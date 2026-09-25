// src/config/rabbitmq.config.ts
import amqplib, { Connection, Channel } from 'amqplib'
import logger from '../utils/logger.service'
import { context } from '../utils/context'

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

export const publishEvent = async (routingKey: string, message: object): Promise<void> => {
  try {
    const ch = await getRabbitChannel() // Changed from getChannel() to getRabbitChannel()
    const messageBuffer = Buffer.from(JSON.stringify(message))
    const correlationId = context.getStore()?.get('correlationId')

    ch.publish('videochat.events', routingKey, messageBuffer, {
      persistent: true,
      contentType: 'application/json',
      headers: { correlationId }
    })

    console.log(`📤 Published event: ${routingKey}`)
  } catch (error) {
    logger.error('Failed to publish event:', { error })
  }
}

/**
 * Initialize top-level topology used across services.
 * Call once at service startup.
 */
export const initRabbitMQ = async () => {
  try {
    const ch = await getRabbitChannel()
    
    // Exchanges
    await ch.assertExchange('payments.events', 'topic', { durable: true })
    await ch.assertExchange('payments.events.dlx', 'topic', { durable: true })
    
    // Main Queue for internal processing
    try {
      await ch.deleteQueue('payments.queue')
    } catch(e) {}

    await ch.assertQueue('payments.queue', {
      durable: true,
      deadLetterExchange: 'payments.events.dlx',
      deadLetterRoutingKey: 'failed',
      messageTtl: 300000 
    })
    
    // DLQ
    await ch.assertQueue('payments.queue.dlq', { durable: true })
    
    // Bindings
    await ch.bindQueue('payments.queue', 'payments.events', 'payment.*')
    await ch.bindQueue('payments.queue.dlq', 'payments.events.dlx', 'failed')

    // Bindings
    await ch.bindQueue('payments.queue', 'payments.events', 'payment.*')
    await ch.bindQueue('payments.queue.dlq', 'payments.events.dlx', 'failed')

    
    // Queue for reservations (payments listen for reservation.created)
    // We should probably add DLQ to this too if Payment Service consumes from it
    await ch.assertExchange('reservations.events.dlx', 'topic', { durable: true })
    try {
      await ch.deleteQueue('reservations.queue.forPayments')
    } catch(e) {}

    await ch.assertQueue('reservations.queue.forPayments', {
         durable: true,
         deadLetterExchange: 'reservations.events.dlx',
         deadLetterRoutingKey: 'failed',
         messageTtl: 300000 
    })
    await ch.assertQueue('reservations.queue.forPayments.dlq', { durable: true })
    
    await ch.bindQueue('reservations.queue.forPayments', 'reservations.events', 'reservation.created')
    await ch.bindQueue('reservations.queue.forPayments', 'reservations.events', 'reservation.cancelled')
    
    await ch.bindQueue('reservations.queue.forPayments.dlq', 'reservations.events.dlx', 'failed')

    logger.info('✅ RabbitMQ Topology Initialized (PaymentService)')
  } catch (error) {
    logger.error('Failed to init RabbitMQ topology:', { error })
  }
}
