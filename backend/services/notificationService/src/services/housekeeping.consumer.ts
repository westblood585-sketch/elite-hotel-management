import { getRabbitChannel } from '../config/rabbitmq.config'
import { rpcGetUserContact } from '../utils/rpcClient'
import { EmailService } from './email.service'
import { SmsService } from './sms.service'

const EMAIL = new EmailService()
const SMS = new SmsService()

export async function initHousekeepingNotificationConsumer() {
  const ch = await getRabbitChannel()
  await ch.assertExchange('housekeeping.events', 'topic', { durable: true })
  await ch.assertQueue('notifications.housekeeping', { durable: true })

  await ch.bindQueue(
    'notifications.housekeeping',
    'housekeeping.events',
    'housekeeping.*'
  )

  ch.consume('notifications.housekeeping', async (msg) => {
    if (!msg) return
    try {
      const evt = JSON.parse(msg.content.toString())
      const task = evt.data

      if (evt.event === 'housekeeping.task.assigned') {
        await handleHousekeepingAssigned(task)
      } else if (evt.event === 'housekeeping.task.completed') {
        await handleHousekeepingCompleted(task)
      }

      ch.ack(msg)
    } catch (err) {
      console.error('Failed to process housekeeping event', err)
      ch.nack(msg, false, false) // DLQ pattern
    }
  })
}

async function handleHousekeepingAssigned(task: any) {
  const contact = await rpcGetUserContact(task.assignedTo)
  const text = `New housekeeping task assigned for room ${task.roomId}. Task ID: ${task._id}`

  if (contact.email) {
    await EMAIL.sendMail({
      to: contact.email,
      subject: 'New Housekeeping Task Assigned',
      text,
    })
  }
  if (contact.phoneNumber) {
    await SMS.sendSms({
      to: contact.phoneNumber,
      body: text,
    })
  }
}

async function handleHousekeepingCompleted(task: any) {
  const contact = await rpcGetUserContact(task.assignedTo)
  const text = `Task completed for room ${task.roomId}. Task ID: ${task._id}`

  if (contact.email) {
    await EMAIL.sendMail({
      to: contact.email,
      subject: 'Housekeeping Task Completed',
      text,
    })
  }
  if (contact.phoneNumber) {
    await SMS.sendSms({
      to: contact.phoneNumber,
      body: text,
    })
  }
}
