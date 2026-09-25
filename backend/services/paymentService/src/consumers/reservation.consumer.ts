// src/consumers/reservation.consumer.ts
import { getRabbitChannel } from '../config/rabbitmq.config'
import { PaymentService } from '../services/implementation/payment.service'
import { PaymentRepository } from '../repository/implementation/payment.repository'
import logger from '../utils/logger.service'

export async function startReservationConsumer() {
  const ch = await getRabbitChannel()
  const repo = new PaymentRepository()
  const svc = new PaymentService(repo)

  logger.info('Starting reservation consumer')

  await ch.consume('reservations.queue.forPayments', async (msg) => {
    if (!msg) return
    try {
      const evt = JSON.parse(msg.content.toString())
      
        if (evt.event === 'reservation.created') {
           const { reservationId, totalAmount } = evt.data
          // LOG ONLY - prevent duplicate payment
          // Payment is already initiated synchronously by ReservationService
          logger.info('Received reservation.created event (skipping generic payment init)', {
             reservationId,
             amount: totalAmount,
          })
        }
      ch.ack(msg)
    } catch (err) {
      logger.error('Reservation consumer error', {
        error: (err as Error).message,
        stack: (err as Error).stack,
      })
      ch.nack(msg, false, false)
    }
  })
}
