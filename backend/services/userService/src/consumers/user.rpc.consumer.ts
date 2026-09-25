import { getChannel } from '../config/rabbitmq.config'
import { userService } from '../config/container'
import { ConsumeMessage } from 'amqplib'

export async function initUserRpcConsumer() {
  const ch = getChannel()

  ch.consume('rpc.user.getContact', async (msg: ConsumeMessage | null) => {
    if (!msg) return

    try {
      // Parse and validate message
      const payload = JSON.parse(msg.content.toString())
      
      if (!payload.userId) {
        throw new Error('Missing userId in RPC request')
      }

      const { userId } = payload
      const contact = await userService.getUserContact(userId)

      // Send successful response
      ch.sendToQueue(
        msg.properties.replyTo,
        Buffer.from(JSON.stringify({ success: true, data: contact })),
        { correlationId: msg.properties.correlationId }
      )
      ch.ack(msg)
    } catch (err) {
      console.error('[UserService] RPC error:', {
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'Unknown error',
        correlationId: msg.properties.correlationId,
      })

      // Send error response instead of silently acking
      try {
        ch.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(
            JSON.stringify({
              success: false,
              error: err instanceof Error ? err.message : 'Internal error',
            })
          ),
          { correlationId: msg.properties.correlationId }
        )
      } catch (sendErr) {
        console.error('[UserService] Failed to send error response:', sendErr)
      }

      ch.ack(msg) // Acknowledge to prevent requeue loop
    }
  })

  console.log('[UserService] RPC consumer started: rpc.user.getContact')
}
