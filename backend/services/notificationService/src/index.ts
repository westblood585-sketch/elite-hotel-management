// notification-service/src/index.ts
import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import { startNotificationConsumer } from './services/notification.consumer'
import { connectDB } from './config/db.config'
import notificationRoutes from './routes/notification.routes'
import logger from './utils/logger.service'
import requestLogger from './middleware/request-logger.middleware'

const app = express()
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

// Routes
app.use('/', notificationRoutes)

const PORT = process.env.PORT || 4010

import { initUserEventConsumer } from './consumers/user.consumer'

async function main() {
  await connectDB()
  const { initRabbitMQ } = await import('./config/rabbitmq.config')
  await initRabbitMQ()
  await startNotificationConsumer()
  await initUserEventConsumer()
  
  app.listen(PORT, () => {
    logger.info(`✅ Notification service started on port ${PORT}`)
  })
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

main().catch((err) => {
  logger.error('Notification service startup error', { error: err })
  process.exit(1)
})
