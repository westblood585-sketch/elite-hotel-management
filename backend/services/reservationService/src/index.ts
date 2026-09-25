import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import connectMongodb from './config/db.config'
import reservationRoute from './routes/reservation.route'
import reservationBackupRoute from './routes/reservationBackup.route'
import errorHandler from './middleware/errorHandler'
import { startPaymentConsumer } from './consumers/payment.consumer'
import requestLogger from './middleware/request-logger.middleware'
import sanitizeInputs from './middleware/sanitization.middleware'
import logger from './utils/logger.service'

const app = express()

// Security middleware (BEFORE body parsing)
app.use(helmet())
// app.use(mongoSanitize()) // Removed due to incompatibility with Express 5
app.use(requestLogger) // Log all requests with correlation IDs

// Rate limiting for public endpoints (more restrictive)
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per 15 minutes
  message: 'Too many booking requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// XSS sanitization (AFTER body parsing)
app.use(sanitizeInputs)

// CORS configuration
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

// Apply public rate limiter to public booking endpoints
// app.use('/public', publicLimiter)
// app.use('/quote', publicLimiter)

// Apply general rate limiter to all other routes
// app.use(generalLimiter)

// Routes
app.use('/', reservationRoute)
app.use('/reservation-backup', reservationBackupRoute)

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    service: 'ReservationService',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }

  res.status(200).json(health)
})

// Global error handler (MUST BE LAST)
app.use(errorHandler)

async function start() {
  try {
    //1. init RabbitMQ topology (exchanges, queues, bindings)
    const { initRabbitMQ } = await import('./config/rabbitmq.config')
    await initRabbitMQ()
    logger.info('✅ RabbitMQ topology initialized')

    // 2. connect MongoDB
    await connectMongodb()
    logger.info('✅ MongoDB connected')

    // 2.5 Start Consumers
    await startPaymentConsumer()
    
    const { initUserEventConsumer } = await import('./consumers/user.consumer')
    await initUserEventConsumer()

    logger.info('✅ User & Payment Consumers started')

    // 3. start express server
    const PORT = process.env.PORT || 4005
    app.listen(PORT, () => {
      logger.info(`🚀 ReservationService running on port ${PORT}`)
    })
  } catch (error) {
    logger.error('❌ Service startup failed', { error })
    process.exit(1) // crash if startup dependencies not ready
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
