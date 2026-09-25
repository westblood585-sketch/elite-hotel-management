// src/config/rabbitmq.config.ts
import amqplib, { Connection, Channel } from 'amqplib'

const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672'
let connection: Connection | null = null
let channel: Channel | null = null

export async function getRabbitConnection(): Promise<Connection> {
  while (!connection) {
    try {
      connection = await amqplib.connect(RABBIT_URL)
      console.log('✅ Connected to RabbitMQ (room-service)')

      connection.on('error', (err) => {
        console.error('❌ RabbitMQ connection error', err)
        connection = null
      })

      connection.on('close', () => {
        console.warn('⚠️ RabbitMQ connection closed, retrying...')
        connection = null
      })
    } catch (err) {
      console.error('❌ Failed to connect to RabbitMQ:', err)
      console.log('⏳ Retrying in 5 seconds...')
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
      console.log('✅ RabbitMQ channel created (room-service)')

      channel.on('error', (err) => {
        console.error('❌ RabbitMQ channel error', err)
        channel = null
      })

      channel.on('close', () => {
        console.warn('⚠️ RabbitMQ channel closed, retrying...')
        channel = null
      })
    } catch (err) {
      console.error('❌ Failed to create RabbitMQ channel:', err)
      console.log('⏳ Retrying in 5 seconds...')
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
  return channel
}

/**
 * Create topology used by Room Service.
 * Call on startup.
 */
export async function initRabbitMQ(): Promise<void> {
  const ch = await getRabbitChannel()

  // ensure the same exchange exists (topic) — service creating it is ok too
  await ch.assertExchange('reservations.events', 'topic', { durable: true })
  await ch.assertExchange('reservations.events.dlx', 'topic', { durable: true })

  await ch.assertExchange('user.events', 'topic', { durable: true })
  await ch.assertExchange('user.events.dlx', 'topic', { durable: true })

  // Queue for Room Service to listen to check-in/check-out
  try {
     await ch.deleteQueue('rooms.reservations.queue')
  } catch(e) {}

  await ch.assertQueue('rooms.reservations.queue', { 
      durable: true,
      deadLetterExchange: 'reservations.events.dlx',
      deadLetterRoutingKey: 'failed',
  })
  await ch.bindQueue('rooms.reservations.queue', 'reservations.events', 'reservation.checkedIn')
  await ch.bindQueue('rooms.reservations.queue', 'reservations.events', 'reservation.checkedOut')
  
  await ch.assertQueue('rooms.reservations.queue.dlq', { durable: true })
  await ch.bindQueue('rooms.reservations.queue.dlq', 'reservations.events.dlx', 'failed')
}
