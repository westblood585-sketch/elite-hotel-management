// src/rpc/guest.rpc.server.ts  (inside GuestService)
import { ConsumeMessage } from 'amqplib'
import { getRabbitChannel } from '../config/rabbitmq.config'
import { GuestRepository } from '../repository/implementation/guest.repository'

export async function initGuestRpcServer() {
  const ch = await getRabbitChannel()
  // ensure queue exists
  await ch.assertQueue('guest.service.rpc', { durable: true })

  const repo = new GuestRepository()

  ch.consume('guest.service.rpc', async (msg: ConsumeMessage | null) => {
    if (!msg) return
    try {
      const req = JSON.parse(msg.content.toString())

      if (req.action === 'updateGuestLastVisit' && req.guestId) {
        // Direct repo access or ideally via service if we had service instance here
        // Since we instantiated repo directly:
        await repo.update(req.guestId, { lastVisit: new Date() } as any)
        
        ch.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify({ success: true })),
          { correlationId: msg.properties.correlationId }
        )
      } else if (req.action === 'getContact' && req.guestId) {
        const guest = await repo.findById(req.guestId)
        const payload = guest
          ? { email: guest.email, phoneNumber: guest.phoneNumber }
          : null
        ch.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify(payload)),
          {
            correlationId: msg.properties.correlationId,
          }
        )
      } else if (req.action === 'lookupGuest') {
        const guest = await repo.findByEmailOrPhone(req.email, req.phoneNumber)
        ch.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify(guest)),
          {
            correlationId: msg.properties.correlationId,
          }
        )
      } else if (req.action === 'findOrCreateGuest') {
        const { firstName, lastName, email, phoneNumber } = req.details
        let guest: any = await repo.findByEmailOrPhone(email, phoneNumber)
        if (!guest) {
          guest = await repo.create({
            firstName,
            lastName,
            email,
            phoneNumber,
            password: 'guest-placeholder-password', // Or handle appropriately
            role: 'guest',
            isEmailVerified: false,
          } as any)
        }
        ch.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify(guest)),
          {
            correlationId: msg.properties.correlationId,
          }
        )
      } else if (req.action === 'searchGuests') {
        // Use repo findAll with search query functionality that mimics list()
        // Assuming findAll supports the text search filter
        const filter: any = {}
        if (req.query) {
          filter.$text = { $search: req.query }
        }
        
        // We only need IDs, but BaseRepository might not support projection in options
        const guests = await repo.findAll(filter, { limit: 50 })
        const ids = guests.map((g: any) => g._id.toString())

        ch.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify(ids)),
          {
            correlationId: msg.properties.correlationId,
          }
        )
      } else {
        const payload = null
        ch.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify(payload)),
          {
            correlationId: msg.properties.correlationId,
          }
        )
      }
    } catch (err) {
      // reply with null on failure
      try {
        ch.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify(null)),
          {
            correlationId: msg.properties.correlationId,
          }
        )
      } catch {}
    } finally {
      ch.ack(msg)
    }
  })
}
