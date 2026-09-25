import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import connectMongodb from './config/db.config'
import guestRoute from './routes/guest.route'
import guestBackupRoute from './routes/guestBackup.route'
import errorHandler from './middleware/errorHandler'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { initGuestRpcServer } from './rpc/guest.rpc.server'
import requestLogger from './middleware/request-logger.middleware'

const app = express()

// Security headers
app.use(helmet())

// Response compression
app.use(compression())

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

// Request logging
app.use(morgan('dev'))

// Security: Request size limits to prevent DoS
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: true, limit: '100kb' }))
app.use(requestLogger)

app.use('/', guestRoute)
app.use('/guest-backup', guestBackupRoute)

// global error handler
app.use(errorHandler)

// setup RabbitMQ topology (exchanges/queues)
import { initRabbitMQ } from './config/rabbitmq.config'
initRabbitMQ()
console.log('✅ RabbitMQ topology initialized')

// start Guest RPC server
initGuestRpcServer()
console.log('✅ Guest RPC server listening on guest.service.rpc')

// connect DB
import { initUserEventConsumer } from './consumers/user.consumer'

// connect DB
connectMongodb().then(async () => {
    console.log('✅ MongoDB connected')
    await initUserEventConsumer()
})

// start Express server
app.listen(4004, () =>
  console.log(`🚀 GuestService running at http://localhost:4004`)
)
