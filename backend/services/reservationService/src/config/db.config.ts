import mongoose from 'mongoose'
import logger from '../utils/logger.service'

const connectMongoDB = async () => {
  try {
    const connectionString = process.env.MONGO_URI
    if (!connectionString) {
      logger.error('MONGO_URI environment variable is not set')
      throw new Error('Database configuration missing')
    }
    await mongoose.connect(connectionString)
    logger.info('✅ MongoDB connected (reservation-service)')
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error })
    throw error
  }
}

export default connectMongoDB
