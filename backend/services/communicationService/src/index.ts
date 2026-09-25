import express from 'express'
import http from 'http'
import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import connectMongodb from './config/db.config'
import { rabbitmqConnect } from './config/rabbitmq.config'
import { initializeSocketIO } from './config/socket.config'

import chatbotRoute from './routes/chatbot.route'
import videoChatRoute from './routes/videochat.route'
import errorHandler from './middleware/errorHandler'
import requestLogger from './middleware/request-logger.middleware'

dotenv.config()

const app = express()
const httpServer = http.createServer(app)

// Initialize Socket.IO
let io: any
initializeSocketIO(httpServer).then((socketIo) => {
  io = socketIo
  console.log('✅ Socket.IO initialized with Redis adapter')
})

import { scheduleDataRetention } from './jobs/data-retention.job'
import { scheduleCallCleanup } from './jobs/call-cleanup.job'

// Connect to databases and message queue
rabbitmqConnect().then(() => {
  console.log('✅ RabbitMQ connected')
})

connectMongodb().then(() => {
  console.log('✅ MongoDB connected')
  // Start background jobs
  scheduleDataRetention()
  scheduleCallCleanup()
})

// Middleware
app.use(helmet())
app.use(morgan('dev'))
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
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(requestLogger)

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
})
app.use('/api/chat', limiter)
app.use('/api/video', limiter)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'communicationService' })
})

// Routes
// Routes
app.use('/api/chat', chatbotRoute)
app.use('/api/video', videoChatRoute)

// Error handling
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 4009
httpServer.listen(PORT, () => {
  console.log(`🚀 Video Chat Service running on http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
