import { getRabbitChannel } from '../config/rabbitmq.config'
import { BillingService } from '../service/implementation/billing.service'
import logger from '../utils/logger.service'
import { context } from '../utils/context'

export async function startBillingConsumer(billingService: BillingService) {
  const channel = await getRabbitChannel()
  const exchange = 'payments.events'

  await channel.assertExchange(exchange, 'topic', { durable: true })

  const q = await channel.assertQueue('billing.events', { durable: true })

  // Bind only to payment events
  await channel.bindQueue(q.queue, exchange, 'payment.*')

  logger.info('Billing consumer started', {
    queue: q.queue,
    exchange,
    pattern: 'payment.*',
  })

  channel.consume(q.queue, async (msg) => {
    if (!msg) return

    const correlationId = msg.properties.headers?.correlationId
    const store = new Map<string, any>()
    store.set('correlationId', correlationId)

    context.run(store, async () => {
      try {
        const evt = JSON.parse(msg.content.toString())
        logger.info('BillingService received event', {
          event: evt.event,
          paymentId: evt.data?.paymentId,
          correlationId
        })

        switch (evt.event) {
          case 'payment.initiated':
            await billingService.handlePaymentInitiated(evt.data)
            break
          case 'payment.succeeded':
            await billingService.handlePaymentSucceeded(evt.data)
            break
          case 'payment.refunded':
            await billingService.handlePaymentRefunded(evt.data)
            break
          case 'payment.failed':
            await billingService.handlePaymentFailed(evt.data)
            break
          default:
            logger.debug('Unhandled payment event', { event: evt.event })
        }

        channel.ack(msg)
      } catch (err) {
        logger.error('Error in billing consumer', {
          error: (err as Error).message,
          stack: (err as Error).stack,
        })
        channel.nack(msg, false, false)
      }
    })
  })
}
