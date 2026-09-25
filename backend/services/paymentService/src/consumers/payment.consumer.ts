// src/consumers/payment.consumer.ts
import { getRabbitChannel } from '../config/rabbitmq.config'
import { PaymentService } from '../services/implementation/payment.service'
import logger from '../utils/logger.service'
import { context } from '../utils/context'

export async function startPaymentConsumer(paymentService: PaymentService) {
  const channel = await getRabbitChannel()
  const queue = 'reservations.queue.forPayments'

  logger.info('Starting payment consumer', { queue })

  channel.consume(queue, async (msg) => {
    if (!msg) return

    const correlationId = msg.properties.headers?.correlationId
    const store = new Map<string, any>()
    store.set('correlationId', correlationId)

    context.run(store, async () => {
      try {
        const evt = JSON.parse(msg.content.toString())
        logger.info('PaymentService received event', {
          event: evt.event,
          reservationId: evt.data?.reservationId,
          correlationId
        })

        if (evt.event === 'reservation.cancelled') {
          const { reservationId, refundPercentage = 0.8 } = evt.data
          await paymentService.handleReservationCancelled(
            reservationId,
            refundPercentage
          )
        }

        channel.ack(msg)
      } catch (err) {
        logger.error('Error in payment consumer', {
          error: (err as Error).message,
          stack: (err as Error).stack,
        })
        channel.nack(msg, false, false) // dead-letter on error
      }
    })
  })
}
