// notification-service/src/services/sms.service.ts
import twilio, { Twilio } from 'twilio'
import logger from '../utils/logger.service'
import { settingsProvider } from './settings.provider'

export class SmsService {
  private client: Twilio
  private from: string

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || ''
    const authToken = process.env.TWILIO_AUTH_TOKEN || ''
    this.from = process.env.TWILIO_PHONE_NUMBER || ''

    if (!accountSid || !authToken || !this.from) {
      logger.error('Twilio credentials or phone number are missing in environment variables')
      throw new Error('Twilio credentials or phone number are missing in env')
    }

    this.client = twilio(accountSid, authToken)
    logger.info('Twilio SMS service initialized')
  }

  async sendSms({ to, body }: { to: string; body: string }) {
    // Check if SMS notifications are enabled
    const isEnabled = await settingsProvider.isSmsEnabled();
    if (!isEnabled) {
      logger.info('SMS notifications are disabled in settings. Skipping SMS.', { to });
      return;
    }

    if (!to) {
      logger.warn('SMS recipient missing, skipping SMS send')
      return
    }

    try {
      const message = await this.client.messages.create({
        body,
        from: this.from,
        to,
      })

      logger.info('SMS sent successfully', {
        to,
        messageSid: message.sid,
        status: message.status,
      })

      return message
    } catch (err: any) {
      logger.error('Failed to send SMS', {
        to,
        error: err.message,
        code: err.code,
      })
      throw err
    }
  }
}
