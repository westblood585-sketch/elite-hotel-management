import { getRabbitChannel } from '../config/rabbitmq.config'
import { randomUUID } from 'crypto'
import { ConsumeMessage } from 'amqplib'

export async function getGuestContact(
  guestId: string
): Promise<{ email: string; phoneNumber: string } | null> {
  const ch = await getRabbitChannel()

  const correlationId = randomUUID()
  const replyQueue = await ch.assertQueue('', { exclusive: true })

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ch.cancel(correlationId).catch(() => {})
      resolve(null) // fallback: null if timeout
    }, 5000)

    ch.consume(
      replyQueue.queue,
      (msg: ConsumeMessage | null) => {
        if (!msg) return
        if (msg.properties.correlationId === correlationId) {
          clearTimeout(timeout)
          try {
            const data = JSON.parse(msg.content.toString())
            resolve(data)
          } catch {
            resolve(null)
          }
        }
      },
      { noAck: true }
    )

    ch.sendToQueue(
      'guest.service.rpc',
      Buffer.from(JSON.stringify({ action: 'getContact', guestId })),
      {
        correlationId,
        replyTo: replyQueue.queue,
      }
    )
  })
}
