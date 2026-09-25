// src/subscribers/reservation.subscriber.ts
import { getRabbitChannel } from '../config/rabbitmq.config'
import { Room } from '../models/room.model' // adjust import path as needed

export async function startReservationSubscriber() {
  const ch = await getRabbitChannel()

  // Ensure the queue exists (topology init should already have done this)
  // Queue asserted in rabbitmq.config.ts with DLQ settings

  console.log(
    '📥 RoomService reservation subscriber is waiting for messages...'
  )
  ch.consume(
    'rooms.reservations.queue',
    async (msg) => {
      if (!msg) return
      try {
        const payload = JSON.parse(msg.content.toString())
        const routingKey = msg.fields.routingKey // e.g., reservation.checkedIn

        // Basic shape check
        const { data } = payload
        if (!data || !data.roomId) {
          console.warn('reservation.subscriber: missing roomId', payload)
          ch.ack(msg)
          return
        }

        const roomId = data.roomId as string

        // Determine target availability
        let targetAvailable = true
        if (routingKey === 'reservation.checkedIn') targetAvailable = false
        if (routingKey === 'reservation.checkedOut') targetAvailable = true
        // If payload has explicit occupied, prefer it
        if (typeof data.occupied === 'boolean') {
          targetAvailable = !data.occupied
        }

        // Idempotent update: only write if changed
        const room = await Room.findById(roomId).exec()
        if (!room) {
          console.warn('Room not found for reservation event', roomId)
          ch.ack(msg)
          return
        }

        if (room.available === targetAvailable) {
          // nothing to do
          ch.ack(msg)
          return
        }

        room.available = targetAvailable
        await room.save()
        console.log(
          `Room ${roomId} availability updated => ${targetAvailable} due to ${routingKey}`
        )
        ch.ack(msg)
      } catch (err) {
        console.error('reservation.subscriber: error handling message', err)
        // Do not ack so message can be requeued, or nack with requeue depending on your policy
        ch.nack(msg, false, false) // drop to DLQ style (adjust as you need)
      }
    },
    { noAck: false }
  )
}
