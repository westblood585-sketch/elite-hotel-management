import { getRabbitChannel } from '../config/rabbitmq.config'
import { reservationService } from '../config/container'
import logger from '../utils/logger.service'
import { context } from '../utils/context'
import { Message } from 'amqplib'

export async function startPaymentConsumer() {
  const channel = await getRabbitChannel()
  const queueName = 'reservations.from.payments'

  channel.consume(queueName, async (msg: Message | null) => {
    if (!msg) return
    
    const correlationId = msg.properties.headers?.correlationId
    const store = new Map<string, any>()
    store.set('correlationId', correlationId)

    context.run(store, async () => {
      try {
        const evt = JSON.parse(msg.content.toString())
        const { event, data } = evt
        
        logger.info('ReservationService received payment event', {
          event,
          reservationId: data.reservationId,
          correlationId
        })
  
        if (!data.reservationId) {
            logger.warn('Event missing reservationId, skipping', { event })
            channel.ack(msg)
            return
        }
  
        switch (event) {
          case 'payment.succeeded':
            try {
              await reservationService.confirm(data.reservationId)
              logger.info('Reservation confirmed via payment event', { reservationId: data.reservationId })
            } catch (err: any) {
               // If already confirmed or checked out, we might get an error, but that's okay.
               logger.warn('Failed to confirm reservation', { reservationId: data.reservationId, error: err.message })
            }
            break
            
          case 'payment.failed':
            // Optional: Could add notes to reservation or trigger alert?
            // Currently we don't auto-cancel on *one* failed attempt because user might retry.
            logger.info('Payment failed for reservation', { reservationId: data.reservationId, error: data.error })
            break
            
          case 'payment.refunded':
            // Optionally cancel? Or just log? 
            // Usually refunds happen AFTER cancellation, so status might already be Cancelled.
            logger.info('Payment refunded for reservation', { reservationId: data.reservationId })
            break
        }
  
        channel.ack(msg)
      } catch (err: any) {
        logger.error('Error in payment consumer', { error: err.message })
        channel.nack(msg, false, false) 
      }
    })
  })
}
