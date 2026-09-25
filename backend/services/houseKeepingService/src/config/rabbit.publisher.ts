import { getRabbitChannel } from './rabbitmq.config'
import { context } from '../utils/context'

export class RabbitPublisher {
  async publish(exchange: string, routingKey: string, payload: any) {
    const ch = await getRabbitChannel()
    const correlationId = context.getStore()?.get('correlationId')
    
    ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      headers: { correlationId }
    })
  }
}
