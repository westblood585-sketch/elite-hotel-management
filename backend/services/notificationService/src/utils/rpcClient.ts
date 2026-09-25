import { getRabbitChannel } from '../config/rabbitmq.config'
import { randomUUID } from 'crypto'

export async function rpcGetUserContact(
  userId: string
): Promise<{ email?: string; phoneNumber?: string }> {
  const ch = await getRabbitChannel()
  const corrId = randomUUID()

  return new Promise((resolve, reject) => {
    ch.consume(
      'amq.rabbitmq.reply-to',
      (msg) => {
        if (msg && msg.properties.correlationId === corrId) {
          resolve(JSON.parse(msg.content.toString()))
        }
      },
      { noAck: true }
    )

    ch.sendToQueue(
      'rpc.user.getContact',
      Buffer.from(JSON.stringify({ userId })),
      { replyTo: 'amq.rabbitmq.reply-to', correlationId: corrId }
    )
  })
}
