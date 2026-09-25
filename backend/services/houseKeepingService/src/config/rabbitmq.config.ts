import amqplib, { Channel, Connection } from 'amqplib'

const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672'
let conn: Connection | null = null
let channel: Channel | null = null

export async function getRabbitChannel(): Promise<Channel> {
  while (!channel) {
    try {
      if (!conn) {
        conn = await amqplib.connect(RABBIT_URL)
        console.log('✅ Connected to RabbitMQ')

        conn.on('error', (err) => {
          console.error('❌ RabbitMQ connection error', err)
          conn = null
        })

        conn.on('close', () => {
          console.warn('⚠️ RabbitMQ connection closed, retrying...')
          conn = null
          channel = null
        })
      }

      channel = await conn.createChannel()
      console.log('✅ RabbitMQ channel created')

      channel.on('error', (err) => {
        console.error('❌ RabbitMQ channel error', err)
        channel = null
      })

      channel.on('close', () => {
        console.warn('⚠️ RabbitMQ channel closed, retrying...')
        channel = null
      })
    } catch (err) {
      console.error('❌ Failed to connect/create channel:', err)
      console.log('⏳ Retrying in 5 seconds...')
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
  return channel
}

export async function initRabbitMQ() {
  let initialized = false

  while (!initialized) {
    try {
      const ch = await getRabbitChannel()

      // exchanges
      await ch.assertExchange('housekeeping.events', 'topic', { durable: true })
      await ch.assertExchange('housekeeping.events.dlx', 'topic', { durable: true })
      
      await ch.assertExchange('reservations.events', 'topic', { durable: true })
      await ch.assertExchange('reservations.events.dlx', 'topic', { durable: true })

      await ch.assertExchange('user.events', 'topic', { durable: true })
      await ch.assertExchange('user.events.dlx', 'topic', { durable: true })

      // queues
      try {
        await ch.deleteQueue('housekeeping.events.queue')
      } catch(e) {}

      await ch.assertQueue('housekeeping.events.queue', { 
          durable: true,
          deadLetterExchange: 'housekeeping.events.dlx',
          deadLetterRoutingKey: 'failed',
      })
      await ch.bindQueue( 'housekeeping.events.queue', 'housekeeping.events', 'housekeeping.*')
      
      await ch.assertQueue('housekeeping.events.queue.dlq', { durable: true })
      await ch.bindQueue('housekeeping.events.queue.dlq', 'housekeeping.events.dlx', 'failed')

      // consumer queue for reservation events (listen reservation.checkedOut)
      // IMPORTANT: If consume fails, we DLQ it.
      // We can use reservations DLX or a dedicated housekeeping DLX.
      try {
        await ch.deleteQueue('housekeeping.from.reservations')
      } catch(e) {}

      await ch.assertQueue('housekeeping.from.reservations', {
          durable: true,
          deadLetterExchange: 'reservations.events.dlx', // Send to reservations DLX or housekeeping specific?
          // Let's create specific DLQ for this queue
          deadLetterRoutingKey: 'failed',
      })
      await ch.bindQueue( 'housekeeping.from.reservations', 'reservations.events', 'reservation.checkedOut')
      
      await ch.assertQueue('housekeeping.from.reservations.dlq', { durable: true })
      // Assuming reservations.events.dlx exists (it should, we asserted it)
      await ch.bindQueue('housekeeping.from.reservations.dlq', 'reservations.events.dlx', 'failed')

      console.log('✅ RabbitMQ topology initialized (HousekeepingService)')
      initialized = true
    } catch (err) {
      console.error('❌ Failed to initialize RabbitMQ topology:', err)
      console.log('⏳ Retrying in 5 seconds...')
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
}
