import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import housekeepingRoutes from './routes/housekeeping.routes'
import { startHousekeepingConsumer } from './consumers/housekeeping.consumer'
import { createContainer } from './config/container'
import errorHandler from './errors/errorHandler'
import connectMongoDB from './config/db.config'
import requestLogger from './middleware/request-logger.middleware'


async function start() {
  // DI container
  const container = createContainer()

  // DB
  await connectMongoDB()

  // RabbitMQ topology & consumers
  const { initRabbitMQ } = await import('./config/rabbitmq.config')
  await initRabbitMQ()
  await startHousekeepingConsumer(container.housekeepingService)
  
  const { initUserEventConsumer } = await import('./consumers/user.consumer')
  await initUserEventConsumer()

  // Express
  const app = express()

  // Security: Helmet for security headers
  app.use(helmet())

  // Performance: Response compression
  app.use(
    compression({
      level: 6, // Balance between compression ratio and CPU usage
      threshold: 1024, // Only compress responses larger than 1KB
    })
  )

  app.use(express.json({ limit: '100kb' }))
  app.use(express.urlencoded({ extended: true, limit: '100kb' }))
  app.use(requestLogger)

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
  // Routes - mounted at root since API Gateway rewrites /api/housekeeping to /
  app.use('/', housekeepingRoutes(container))

  // global error handler
  app.use(errorHandler)

  app.listen(4008, () => console.log(`HousekeepingService listening on 4008`))
}

start().catch((err) => {
  console.error('Failed to start service', err)
  process.exit(1)
})
