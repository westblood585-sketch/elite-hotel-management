import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import connectMongodb from './config/db.config'
import { startBillingConsumer } from './consumers/billing.consumer'
import { billingService } from './config/container'
import billingRoutes from './routes/billing.route'
import logger from './utils/logger.service'
import requestLogger from './middleware/request-logger.middleware'

// Startup function
async function start() {
  try {
    // MongoDB
    await connectMongodb()
    logger.info('✅ MongoDB connected (BillingService)')

    // RabbitMQ
    const { initRabbitMQ } = await import('./config/rabbitmq.config')
    await initRabbitMQ()
    logger.info('✅ RabbitMQ connected (BillingService)')

    // Start consumer
    await startBillingConsumer(billingService)
    logger.info('✅ Billing consumer started')

    // Start Express server
    const app = express()
    
    // CORS configuration - must specify origin when using credentials
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
    
    app.use(express.json())
    app.use(requestLogger)

    // Mount routes at root since API Gateway rewrites /api/billing to /
    app.use('/', billingRoutes)

    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'billingService' })
    })

    const PORT = process.env.PORT || 4007
    app.listen(PORT, () => {
      logger.info(`✅ BillingService HTTP server running on port ${PORT}`)
    })

    logger.info('🚀 BillingService running (consumer + API)')
  } catch (err) {
    logger.error('❌ BillingService startup error', { error: err })
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
