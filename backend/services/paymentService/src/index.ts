import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import connectMongodb from './config/db.config'
import cors from 'cors'
import paymentRoutes from './routes/payment.route'
import { startReservationConsumer } from './consumers/reservation.consumer'
import webhookRoutes from './routes/webhook.routes'
import { startPaymentConsumer } from './consumers/payment.consumer'
import { paymentService } from './config/container'
import requestLogger from './middleware/request-logger.middleware'
import logger from './utils/logger.service'

const app = express()

// ✅ Security middleware (BEFORE body parsing)
app.set('trust proxy', 1) // Required for rate limiting behind proxy/gateway
app.use(helmet())
// app.use(mongoSanitize()) // Prevent NoSQL injection
app.use(requestLogger) // Log all requests with correlation IDs

// ✅ Strict rate limiting for webhooks (prevent spam/DoS)
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // max 100 webhook calls per minute per IP
  message: 'Too many webhook requests',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/webhook', webhookLimiter)

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(generalLimiter)

// ✅ Stripe needs raw body for signature verification (with size limit)
app.use(
  '/webhook/stripe',
  express.raw({ type: 'application/json', limit: '1mb' })
)

// Middlewares for body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ✅ Enhanced CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  })
)

// Routes - mounted at root since API Gateway rewrites /api/payments to /
app.use('/', paymentRoutes)
app.use('/webhook', webhookRoutes)

// Enhanced health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PaymentService',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Startup function
async function start() {
  try {
    // ✅ Validate webhook secrets on startup (CRITICAL)
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logger.error('STRIPE_WEBHOOK_SECRET not configured')
      throw new Error('STRIPE_WEBHOOK_SECRET is required')
    }
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      logger.error('RAZORPAY_WEBHOOK_SECRET not configured')
      throw new Error('RAZORPAY_WEBHOOK_SECRET is required')
    }
    logger.info('✅ Webhook secrets validated')

    // RabbitMQ
    const { initRabbitMQ } = await import('./config/rabbitmq.config')
    await initRabbitMQ()
    logger.info('✅ RabbitMQ connected (PaymentService)')

    await connectMongodb()

    // Consumers
    startReservationConsumer()
    startPaymentConsumer(paymentService)

    // Server
    const PORT = process.env.PORT || 4006
    app.listen(PORT, () => {
      logger.info(`🚀 PaymentService running on port ${PORT}`)
    })
  } catch (err) {
    logger.error('❌ PaymentService startup error', { error: err })
    process.exit(1)
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error })
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise })
  process.exit(1)
})

start()
