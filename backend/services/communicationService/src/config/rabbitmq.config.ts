import amqplib from 'amqplib'
import type { Channel, Connection } from 'amqplib'

let connection: Connection | null = null
let channel: Channel | null = null

export const rabbitmqConnect = async (): Promise<Channel> => {
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672'

  while (!connection) {
    try {
      console.log('[CommunicationService] Connecting to RabbitMQ...')
      connection = await amqplib.connect(rabbitmqUrl)
      console.log('✅ RabbitMQ connected successfully')

      connection.on('error', (err: Error) => {
        console.error('❌ RabbitMQ connection error:', err)
        connection = null
      })

      connection.on('close', () => {
        console.log('⚠️ RabbitMQ connection closed')
        connection = null
      })
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ, retrying in 5s...', error)
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  try {
    channel = await connection.createChannel()
    
    // Declare exchanges
    await channel.assertExchange('videochat.events', 'topic', { durable: true })
    await channel.assertExchange('videochat.events.dlx', 'topic', { durable: true })
    
    console.log('✅ RabbitMQ channel created')
    return channel
  } catch (error) {
    console.error('❌ Failed to create RabbitMQ channel:', error)
    throw error
  }
}

import { context } from '../utils/context'

export const getChannel = (): Channel => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized')
  }
  return channel
}

export const publishEvent = async (routingKey: string, message: object): Promise<void> => {
  try {
    const ch = getChannel()
    const messageBuffer = Buffer.from(JSON.stringify(message))
    const correlationId = context.getStore()?.get('correlationId')
    
    ch.publish('videochat.events', routingKey, messageBuffer, {
      persistent: true,
      contentType: 'application/json',
      headers: { correlationId }
    })
    
    console.log(`📤 Published event: ${routingKey}`)
  } catch (error) {
    console.error('❌ Failed to publish event:', error)
    throw error
  }
}

export const closeConnection = async (): Promise<void> => {
  try {
    if (channel) {
      await channel.close()
      channel = null
    }
    if (connection) {
      await connection.close()
      connection = null
    }
    console.log('✅ RabbitMQ connection closed')
  } catch (error) {
    console.error('❌ Error closing RabbitMQ connection:', error)
  }
}
