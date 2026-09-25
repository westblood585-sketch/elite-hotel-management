import { EmailService } from './email.service'
import { SmsService } from './sms.service'
import { generateInvoicePdf } from '../utils/pdf.util'
import { retryNotification } from './notification.retry'

const EMAIL = new EmailService()
const SMS = new SmsService()

export async function handleInvoiceCreated(data: any) {
  const toEmail = data.guestContact?.email
  const toPhone = data.guestContact?.phoneNumber
  const subject = `Invoice Created — ${data.reservationId}`
  const text = `Hello! Your invoice for reservation ${data.reservationId} of amount ${data.amount} ${data.currency} has been created.`

  let attachments = []
  try {
    const pdfBuffer = await generateInvoicePdf(data)
    attachments.push({
      filename: `invoice_${data.reservationId}.pdf`,
      content: pdfBuffer,
    })
  } catch (err) {
    console.error('❌ PDF generation failed', err)
    // push to retry queue
    await retryNotification({ event: 'billing.invoice.created', data }, 10000)
    return
  }

  try {
    if (toEmail)
      await EMAIL.sendMail({
        to: toEmail,
        subject,
        text,
        html: text,
        attachments,
      })
    if (toPhone) await SMS.sendSms({ to: toPhone, body: text })
  } catch (err) {
    console.error('❌ Notification send failed', err)
    // push to retry queue with delay
    await retryNotification({ event: 'billing.invoice.created', data }, 10000)
  }
}

export async function handleInvoiceRefunded(data: any) {
  const toEmail = data.guestContact?.email
  const toPhone = data.guestContact?.phoneNumber
  const subject = `Refund Processed — ${data.reservationId}`
  const text = `Hello! Your payment for reservation ${data.reservationId} of amount ${data.amount} ${data.currency} has been refunded.`

  let attachments = []
  try {
    const pdfBuffer = await generateInvoicePdf({ ...data, note: 'Refunded' })
    attachments.push({
      filename: `refund_${data.reservationId}.pdf`,
      content: pdfBuffer,
    })
  } catch (err) {
    console.error('❌ PDF generation failed', err)
    await retryNotification({ event: 'billing.invoice.refunded', data }, 10000)
    return
  }

  try {
    if (toEmail)
      await EMAIL.sendMail({
        to: toEmail,
        subject,
        text,
        html: text,
        attachments,
      })
    if (toPhone) await SMS.sendSms({ to: toPhone, body: text })
  } catch (err) {
    console.error('❌ Notification send failed', err)
    await retryNotification({ event: 'billing.invoice.refunded', data }, 10000)
  }
}
