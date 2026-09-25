import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectMongodb from './config/db.config'
import roomRoute from './routes/room.route'
import roomBackupRoute from './routes/roomBackup.route'
import errorHandler from './middleware/errorHandler'
import helmet from 'helmet'
import morgan from 'morgan'
import hpp from 'hpp'
import { startReservationSubscriber } from './subscribers/reservation.subscriber'
import requestLogger from './middleware/request-logger.middleware'

const app = express()

dotenv.config()

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

// Security: Helmet for security headers
app.use(helmet())

// Security: HTTP Parameter Pollution protection
app.use(hpp())

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
app.use(morgan('dev'))

app.use('/', roomRoute)
app.use('/room-backup', roomBackupRoute)

// global error handler
app.use(errorHandler)

async function start() {
  try {
    // 1. init RabbitMQ topology (exchanges, queues, bindings)
    const { initRabbitMQ } = await import('./config/rabbitmq.config')
    await initRabbitMQ()

    // 3. connect MongoDB
    await connectMongodb()

    await startReservationSubscriber()

    const { initUserEventConsumer } = await import('./consumers/user.consumer')
    await initUserEventConsumer()

    // 4. start express server
    app.listen(4003, () =>
      console.log(`server running on http://localhost:4003`)
    )
  } catch (error) {
    console.error('Service startup failed:', error)
    process.exit(1) // crash if startup dependencies not ready
  }
}

start()
