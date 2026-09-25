import mongoose from 'mongoose'
import logger from '../utils/logger.service'

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notification_db'

export const connectDB = async () => {
  try {
    logger.info('Connecting to MongoDB...', { uri: MONGO_URI.replace(/\/\/[^@]*@/, '//***:***@') })
    await mongoose.connect(MONGO_URI)
    logger.info('✅ MongoDB connected')
  } catch (error) {
    logger.error('❌ MongoDB connection error', { error })
    process.exit(1)
  }
}
