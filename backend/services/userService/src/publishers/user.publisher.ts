// src/publishers/user.publisher.ts
import { getChannel } from '../config/rabbitmq.config'
import { UserEventPayload } from '../events/user.events'

import { context } from '../utils/context'

const USER_EXCHANGE = 'user.events'

export class UserEventPublisher {
  async publishUserEvent(payload: UserEventPayload): Promise<void> {
    try {
      const channel = getChannel()

      // Assert exchange if not exists
      await channel.assertExchange(USER_EXCHANGE, 'topic', { durable: true })

      // Publish to exchange with routing key based on event type
      const routingKey = payload.eventType
      const correlationId = context.getStore()?.get('correlationId')
      
      channel.publish(
        USER_EXCHANGE,
        routingKey,
        Buffer.from(JSON.stringify(payload)),
        { 
          persistent: true,
          headers: { correlationId }
        }
      )

      console.log(
        `[UserService] Published event: ${payload.eventType} for user ${payload.userId}`
      )
    } catch (error) {
      console.error('[UserService] Failed to publish user event:', error)
      // Don't throw - event publishing failure shouldn't break user operations
    }
  }
}
