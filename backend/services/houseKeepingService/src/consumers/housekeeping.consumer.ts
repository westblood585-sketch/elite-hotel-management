import { getRabbitChannel } from '../config/rabbitmq.config'
import { HousekeepingService } from '../services/implementation/housekeeping.service'
import { ConsumeMessage } from 'amqplib'
import { context } from "../utils/context";

export async function startHousekeepingConsumer(
  housekeepingService: HousekeepingService
) {
  const ch = await getRabbitChannel()
  const queue = 'housekeeping.from.reservations'

  // Queue asserted in rabbitmq.config.ts with DLQ settings

  ch.consume(queue, async (msg: ConsumeMessage | null) => {
    if (!msg) return

    const correlationId = msg.properties.headers?.correlationId
    const store = new Map<string, any>()
    store.set('correlationId', correlationId)

    context.run(store, async () => {
      try {
        const evt = JSON.parse(msg.content.toString())
        // expect evt.event === 'reservation.checkedOut'
        if (evt?.event === 'reservation.checkedOut' && evt?.data) {
          const { roomId, reservationId } = evt.data
          // create a pending housekeeping task (unassigned)
          await housekeepingService.assignTask({
            roomId,
            reservationId,
            assignedTo: '',
            notes: 'Auto-created after checkout',
          })
        }
        ch.ack(msg)
      } catch (err) {
        console.error('Housekeeping consumer error', err)
        ch.nack(msg, false, false)
      }
    })
  })
}
