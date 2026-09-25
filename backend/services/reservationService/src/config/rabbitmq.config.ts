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

      connection.on('error', (err: Error) => {
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

      channel.on('error', (err: Error) => {
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

/**
 * Initialize top-level topology used across services.
 * Call once at service startup.
 */
export async function initRabbitMQ(): Promise<void> {
  try {
    const ch = await getRabbitChannel()
    
    // Exchanges
    await ch.assertExchange('reservations.events', 'topic', { durable: true })
    await ch.assertExchange('reservations.events.dlx', 'topic', { durable: true })
    
    await ch.assertExchange('payments.events', 'topic', { durable: true })
    await ch.assertExchange('payments.events.dlx', 'topic', { durable: true })
    
    await ch.assertExchange('user.events', 'topic', { durable: true })
    await ch.assertExchange('user.events.dlx', 'topic', { durable: true })

    // Notifications queue (consumers pick up messages here)
    await ch.assertQueue('notifications.queue', { durable: true })
    await ch.bindQueue(
        'notifications.queue',
        'reservations.events',
        'reservation.*'
    )

    // Delayed / scheduled notification queue
    await ch.assertExchange('notifications.dlx', 'direct', { durable: true })
    await ch.assertQueue('notifications.delayed', {
        durable: true,
        arguments: {
        'x-dead-letter-exchange': 'reservations.events',
        'x-dead-letter-routing-key': 'reservation.notification',
        },
    })
    
    // Payment events consumption (reservation might listen for payment success)
    await ch.assertQueue('reservations.from.payments', { 
        durable: true,
        deadLetterExchange: 'payments.events.dlx',
        deadLetterRoutingKey: 'failed',
    })
    await ch.bindQueue('reservations.from.payments', 'payments.events', 'payment.succeeded')
    await ch.bindQueue('reservations.from.payments', 'payments.events', 'payment.failed')
    
    await ch.assertQueue('reservations.from.payments.dlq', { durable: true })
    await ch.bindQueue('reservations.from.payments.dlq', 'payments.events.dlx', 'failed')
    
    console.log('✅ RabbitMQ Topology Initialized (ReservationService)')
  } catch (error) {
    console.error('Failed to init RabbitMQ topology (ReservationService):', error)
  }
}
