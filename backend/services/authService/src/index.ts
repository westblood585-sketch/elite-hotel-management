import express from 'express'
import errorHandler from './middleware/errorHandler'
import dotenv from 'dotenv'
import cors from 'cors'
import { rabbitmqConnect } from './config/rabbitmq'
import authRoute from './routes/auth.route'
import connectMongodb from './config/db.config'
import cookieParser from 'cookie-parser'
import requestLogger from './middleware/request-logger.middleware'
dotenv.config()

const app = express()

import { initUserEventConsumer } from './consumers/user.consumer'

rabbitmqConnect().then(async () => {
  console.log('rabbitmq connected')
  await initUserEventConsumer()
})

connectMongodb().then(() => {
  console.log('mongodb connected')
})

app.use(cookieParser())
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
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

app.use('/', authRoute)

// Global error handling middleware
app.use(errorHandler)

app.listen(4001, () => console.log(`server running on http://localhost:4001`))
