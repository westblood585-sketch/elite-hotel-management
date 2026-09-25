import { getRabbitChannel } from '../config/rabbitmq.config'

export async function retryNotification(payload: any, delayMs: number = 5000) {
  const ch = await getRabbitChannel()

  // Send to retry queue with expiration
  ch.sendToQueue(
    'notifications.retry.queue',
    Buffer.from(JSON.stringify(payload)),
    {
      expiration: String(delayMs),
      persistent: true,
    }
  )
}
