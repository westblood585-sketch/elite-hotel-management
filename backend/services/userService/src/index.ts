import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import connectMongodb from './config/db.config'
import userRoute from './routes/user.route'
import settingRoute from './routes/setting.route'
import backupRoute from './routes/backup.route'
import { BackupService } from './services/implementation/backup.service'
import { BackupScheduler } from './schedulers/backup.scheduler'
import errorHandler from './middleware/errorHandler'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { initRabbitMQ } from './config/rabbitmq.config'
import { initUserRpcConsumer } from './consumers/user.rpc.consumer'
import { sanitizeInput } from './middleware/sanitization.middleware'
import { requestTimeout } from './middleware/timeout.middleware'
import requestLogger from './middleware/request-logger.middleware'

const app = express()

// Start Backup Scheduler
const backupService = new BackupService();
const backupScheduler = new BackupScheduler(backupService);
backupScheduler.start();

// Request timeout (30 seconds)
app.use(requestTimeout(30000))

// Security: Request body size limits to prevent DoS
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Security: Helmet with enhanced configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
)

// CORS: Support multiple origins from environment
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

// Logging
app.use(morgan('dev'))

// Performance: Compress responses
app.use(compression())
app.use(requestLogger)

// Security: Input sanitization to prevent NoSQL injection
app.use(sanitizeInput)

app.use('/settings', settingRoute)
app.use('/backups', backupRoute)
app.use('/', userRoute)

// global error handler
app.use(errorHandler)

// Main function to start the application
async function start() {
  try {
    // Connect to MongoDB
    await connectMongodb()

    // Initialize RabbitMQ and RPC consumer
    await initRabbitMQ()
    await initUserRpcConsumer()

    // Start the Express server
    app.listen(4002, () => {
      console.log('UserService running on http://localhost:4002')
    })
  } catch (err) {
    console.error('Failed to start the server:', err)
    process.exit(1)
  }
}

// Call the start function
start()
