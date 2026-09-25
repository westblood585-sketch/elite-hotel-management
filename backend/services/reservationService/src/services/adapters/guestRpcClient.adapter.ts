// src/services/adapters/guestRpcClient.adapter.ts
import { getRabbitChannel } from '../../config/rabbitmq.config'
import { randomUUID } from 'crypto'
import { ConsumeMessage } from 'amqplib'

export class GuestRpcClient {
  private channelP: Promise<any>

  constructor() {
    this.channelP = getRabbitChannel()
  }

  /**
   * RPC: request guest contact details from GuestService via RabbitMQ (classic RPC replyTo+correlationId).
   * Returns { email?: string, phoneNumber?: string }
   */
  async getContactDetails(
    guestId: string,
    timeout = 5000
  ): Promise<{ email?: string; phoneNumber?: string } | null> {
    const ch = await this.channelP
    const correlationId = randomUUID()
    // create a temporary exclusive reply queue
    const q = await ch.assertQueue('', { exclusive: true, autoDelete: true })
    const replyQueue = q.queue

    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null
      ch.consume(
        replyQueue,
        (msg: ConsumeMessage | null) => {
          if (!msg) return
          if (msg.properties.correlationId !== correlationId) {
            // ignore others
            return
          }
          if (timer) clearTimeout(timer)
          try {
            const payload = JSON.parse(msg.content.toString())
            resolve(payload)
          } catch (e) {
            resolve(null)
          } finally {
            ch.cancel(msg.fields.consumerTag).catch(() => {})
          }
        },
        { noAck: true }
      ).then(() => {
        // send request to guest.rpc queue
        const payload = { action: 'getContact', guestId }
        ch.sendToQueue(
          'guest.service.rpc',
          Buffer.from(JSON.stringify(payload)),
          {
            correlationId,
            replyTo: replyQueue,
            expiration: String(timeout), // server-side will still respond quickly; this is best-effort
            persistent: false,
          }
        )
        timer = setTimeout(() => {
          reject(new Error('Guest RPC timeout'))
        }, timeout)
      })
    })
  }

  async lookupGuest(
    email?: string,
    phoneNumber?: string,
    timeout = 5000
  ): Promise<any | null> {
    const ch = await this.channelP
    const correlationId = randomUUID()
    const q = await ch.assertQueue('', { exclusive: true, autoDelete: true })
    const replyQueue = q.queue

    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null
      ch.consume(
        replyQueue,
        (msg: ConsumeMessage | null) => {
          if (!msg) return
          if (msg.properties.correlationId !== correlationId) return
          if (timer) clearTimeout(timer)
          try {
            const payload = JSON.parse(msg.content.toString())
            resolve(payload)
          } catch (e) {
            resolve(null)
          } finally {
            ch.cancel(msg.fields.consumerTag).catch(() => {})
          }
        },
        { noAck: true }
      ).then(() => {
        const payload = { action: 'lookupGuest', email, phoneNumber }
        ch.sendToQueue(
          'guest.service.rpc',
          Buffer.from(JSON.stringify(payload)),
          {
            correlationId,
            replyTo: replyQueue,
            expiration: String(timeout),
            persistent: false,
          }
        )
        timer = setTimeout(() => {
          reject(new Error('Guest RPC timeout'))
        }, timeout)
      })
    })
  }
  async findOrCreateGuest(
    details: {
      firstName: string
      lastName: string
      email: string
      phoneNumber: string
    },
    timeout = 5000
  ): Promise<any | null> {
    const ch = await this.channelP
    const correlationId = randomUUID()
    const q = await ch.assertQueue('', { exclusive: true, autoDelete: true })
    const replyQueue = q.queue

    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null
      ch.consume(
        replyQueue,
        (msg: ConsumeMessage | null) => {
          if (!msg) return
          if (msg.properties.correlationId !== correlationId) return
          if (timer) clearTimeout(timer)
          try {
            const payload = JSON.parse(msg.content.toString())
            resolve(payload)
          } catch (e) {
            resolve(null)
          } finally {
            ch.cancel(msg.fields.consumerTag).catch(() => {})
          }
        },
        { noAck: true }
      ).then(() => {
        const payload = { action: 'findOrCreateGuest', details }
        ch.sendToQueue(
          'guest.service.rpc',
          Buffer.from(JSON.stringify(payload)),
          {
            correlationId,
            replyTo: replyQueue,
            expiration: String(timeout),
            persistent: false,
          }
        )
        timer = setTimeout(() => {
          reject(new Error('Guest RPC timeout'))
        }, timeout)
      })
    })
  }

  async searchGuests(query: string, timeout = 5000): Promise<any[]> {
    const ch = await this.channelP
    const correlationId = randomUUID()
    const q = await ch.assertQueue('', { exclusive: true, autoDelete: true })
    const replyQueue = q.queue

    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null
      ch.consume(
        replyQueue,
        (msg: ConsumeMessage | null) => {
          if (!msg) return
          if (msg.properties.correlationId !== correlationId) return
          if (timer) clearTimeout(timer)
          try {
            const payload = JSON.parse(msg.content.toString())
            resolve(Array.isArray(payload) ? payload : [])
          } catch (e) {
            resolve([])
          } finally {
            ch.cancel(msg.fields.consumerTag).catch(() => {})
          }
        },
        { noAck: true }
      ).then(() => {
        const payload = { action: 'searchGuests', query }
        ch.sendToQueue(
          'guest.service.rpc',
          Buffer.from(JSON.stringify(payload)),
          {
            correlationId,
            replyTo: replyQueue,
            expiration: String(timeout),
            persistent: false,
          }
        )
        timer = setTimeout(() => {
          resolve([])
        }, timeout)
      })
    })
  }



  async updateGuestLastVisit(guestId: string, timeout = 5000): Promise<boolean> {
    const ch = await this.channelP
    const correlationId = randomUUID()
    const q = await ch.assertQueue('', { exclusive: true, autoDelete: true })
    const replyQueue = q.queue

    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null
      ch.consume(
        replyQueue,
        (msg: ConsumeMessage | null) => {
          if (!msg) return
          if (msg.properties.correlationId !== correlationId) return
          if (timer) clearTimeout(timer)
          try {
            // we expect { success: true } or similar
            const payload = JSON.parse(msg.content.toString())
            resolve(!!payload)
          } catch (e) {
            resolve(false)
          } finally {
            ch.cancel(msg.fields.consumerTag).catch(() => {})
          }
        },
        { noAck: true }
      ).then(() => {
        const payload = { action: 'updateGuestLastVisit', guestId }
        ch.sendToQueue(
          'guest.service.rpc',
          Buffer.from(JSON.stringify(payload)),
          {
            correlationId,
            replyTo: replyQueue,
            expiration: String(timeout),
            persistent: false,
          }
        )
        timer = setTimeout(() => {
          resolve(false)
        }, timeout)
      })
    })
  }
}
