// notification-service/src/services/email.service.ts
import nodemailer from 'nodemailer'
import logger from '../utils/logger.service'
import { settingsProvider } from './settings.provider'

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    // Example: use SMTP transport from env
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async sendMail({
    to,
    subject,
    text,
    html,
    attachments,
  }: {
    to: string
    subject: string
    text?: string
    html?: string
    attachments?: { filename: string; content: Buffer }[]
  }) {
    // Check if email notifications are enabled
    const isEnabled = await settingsProvider.isEmailEnabled();
    if (!isEnabled) {
      logger.info('Email notifications are disabled in settings. Skipping email.', { to, subject });
      return;
    }

    if (!to) {
      logger.warn('Email recipient missing, skipping email send')
      return
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        html,
        attachments,
      })

      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: info.messageId,
      })

      return info
    } catch (err) {
      logger.error('Failed to send email', {
        to,
        subject,
        error: (err as Error).message,
      })
      throw err
    }
  }
}
