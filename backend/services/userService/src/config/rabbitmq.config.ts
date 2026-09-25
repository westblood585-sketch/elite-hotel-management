import amqplib, { Connection, Channel } from 'amqplib'

let connection: Connection | null = null
let channel: Channel | null = null

const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672'

export async function initRabbitMQ(): Promise<Channel> {
  if (channel) return channel

  while (!connection) {
    try {
      console.log('[UserService] Connecting to RabbitMQ...')
      connection = await amqplib.connect(RABBIT_URL)
      console.log('[UserService] RabbitMQ connected')

      connection.on('error', (err) => {
        console.error('[UserService] RabbitMQ connection error', err)
        connection = null
      })

      connection.on('close', () => {
        console.warn('[UserService] RabbitMQ connection closed')
        connection = null
      })

    } catch (err) {
      console.error('[UserService] Failed to connect to RabbitMQ, retrying in 5s...', err)
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  try {
    channel = await connection.createChannel()
    // enable direct-reply-to for RPC
    await channel.assertQueue('rpc.user.getContact', { durable: false })
    
    // Assert user events exchange
    await channel.assertExchange('user.events', 'topic', { durable: true })
    await channel.assertExchange('user.events.dlx', 'topic', { durable: true })
    
    // Optional: Dead letter queue for user events if we want to catch undeliverable messages? 
    // Usually required if we have queues bound to it. UserService mostly publishes.
    
    return channel
  } catch (err) {
    console.error('[UserService] Failed to create channel', err)
    throw err
  }
}

export function getChannel(): Channel {
  if (!channel) throw new Error('RabbitMQ channel not initialized')
  return channel
}

export async function closeRabbitMQ() {
  await channel?.close()
  await connection?.close()
  connection = null
  channel = null
}
