// src/config/rabbitmq.config.ts
import amqplib, { Connection, Channel } from 'amqplib'
import logger from '../utils/logger.service'

const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672'
let connection: Connection | null = null
let channel: Channel | null = null

export async function getRabbitConnection(): Promise<Connection> {
  while (!connection) {
    try {
      connection = await amqplib.connect(RABBIT_URL)
      logger.info('✅ Connected to RabbitMQ')

      connection.on('error', (err) => {
        logger.error('❌ RabbitMQ connection error', { error: err })
        connection = null
      })

      connection.on('close', () => {
        logger.warn('⚠️ RabbitMQ connection closed, retrying...')
        connection = null
      })
    } catch (err) {
      logger.error('❌ Failed to connect to RabbitMQ', { error: err })
      logger.info('⏳ Retrying in 5 seconds...')
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
  return connection
}

export async function getRabbitChannel(): Promise<Channel> {
  while (!channel) {
    try {
      const conn = await getRabbitConnection()
      channel = await conn.createChannel()
      logger.info('✅ RabbitMQ channel created')

      channel.on('error', (err) => {
        logger.error('❌ RabbitMQ channel error', { error: err })
        channel = null
      })

      channel.on('close', () => {
        logger.warn('⚠️ RabbitMQ channel closed, retrying...')
        channel = null
      })
    } catch (err) {
      logger.error('❌ Failed to create RabbitMQ channel', { error: err })
      logger.info('⏳ Retrying in 5 seconds...')
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
  return channel
}

export const initRabbitMQ = async () => {
  try {
    const channel = await getRabbitChannel()
    
    // Exchanges
    await channel.assertExchange('billing.events', 'topic', { durable: true })
    await channel.assertExchange('billing.events.dlx', 'topic', { durable: true })
    
    // Main Queue
    try {
      await channel.deleteQueue('billing.queue')
    } catch(e) {}

    await channel.assertQueue('billing.queue', {
      durable: true,
      deadLetterExchange: 'billing.events.dlx',
      deadLetterRoutingKey: 'failed',
      messageTtl: 300000 
    })
    
    // Dead Letter Queue
    await channel.assertQueue('billing.queue.dlq', { durable: true })
    
    // Bindings
    // Bind main queue to main exchange
    await channel.bindQueue('billing.queue', 'billing.events', 'billing.*')
    
    // Bind DLQ to DLX
    await channel.bindQueue('billing.queue.dlq', 'billing.events.dlx', 'failed')

    logger.info('✅ RabbitMQ Topology Initialized (Billing)')
  } catch (error) {
    logger.error('Failed to init RabbitMQ topology:', error)
  }
}
