// src/consumers/user.consumer.ts
import { getRabbitChannel as getChannel } from '../config/rabbitmq.config'
import { User } from '../models/user.model'

enum UserEventType {
    USER_CREATED = 'user.created',
    USER_UPDATED = 'user.updated',
    USER_DELETED = 'user.deleted',
    USER_APPROVED = 'user.approved',
    USER_VERIFIED = 'user.verified',
    USER_AVATAR_UPDATED = 'user.avatar.updated'
}

export async function initUserEventConsumer() {
  const channel = await getChannel()
  const exchange = 'user.events'
  const queue = 'roomService.user.events'

  await channel.assertExchange(exchange, 'topic', { durable: true })
  await channel.assertExchange('user.events.dlx', 'topic', { durable: true })
  
  try {
    await channel.deleteQueue(queue)
  } catch (error) {
    // ignore
  }

  await channel.assertQueue(queue, {
      durable: true,
      deadLetterExchange: 'user.events.dlx',
      deadLetterRoutingKey: 'failed',
  })
  
  await channel.assertQueue(`${queue}.dlq`, { durable: true })
  await channel.bindQueue(`${queue}.dlq`, 'user.events.dlx', 'failed')

// Bind to all user events
  await channel.bindQueue(queue, exchange, 'user.*')

  const { context } = await import('../utils/context')

  channel.consume(queue, async (msg) => {
    if (!msg) return

    const correlationId = msg.properties.headers?.correlationId
    const store = new Map<string, any>()
    store.set('correlationId', correlationId)

    context.run(store, async () => {
      try {
        const payload = JSON.parse(msg.content.toString())
  
        switch (payload.eventType) {
          case UserEventType.USER_CREATED:
          case UserEventType.USER_UPDATED:
          case UserEventType.USER_APPROVED:
          case UserEventType.USER_VERIFIED:
          case UserEventType.USER_AVATAR_UPDATED:
            const updateData = { ...payload.data };
            if (updateData.password) delete updateData.password;
            
            await User.findOneAndUpdate(
              { _id: payload.data._id },
              { $set: updateData },
              { upsert: true, new: true }
            )
            break
  
          case UserEventType.USER_DELETED:
            await User.findByIdAndDelete(payload.userId)
            break
        }
  
        channel.ack(msg)
      } catch (error) {
        console.error('[RoomService] User event processing error:', error)
        channel.nack(msg, false, false)
      }
    })
  })

  console.log('[RoomService] User event consumer started')
}
