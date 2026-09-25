// src/services/implementation/billing.service.ts
import { BillingRepository } from '../../repository/implementation/billing.repository'
import { getRabbitChannel } from '../../config/rabbitmq.config'
import { BillingDoc, LedgerEntry } from '../../models/billing.model'
import { IBillingService } from '../interface/IBilling.service'
import { getGuestContact } from '../../rpc/guest.rpc.client'
import { PDFService } from '../../utils/pdf.service'
import { ExportService } from '../../utils/export.service'
import logger from '../../utils/logger.service'
import { PaginatedResult } from '../../repository/interface/IBilling.repository'
import { context } from '../../utils/context'

export class BillingService implements IBillingService {
  private repo: BillingRepository
  private channelP: Promise<any>

  constructor(repo: BillingRepository) {
    this.repo = repo
    this.channelP = getRabbitChannel()
  }

  private async publishEvent(event: string, data: any) {
    try {
      const ch = await this.channelP
      const correlationId = context.getStore()?.get('correlationId')
      
      ch.publish(
        'billing.events',
        event,
        Buffer.from(JSON.stringify({ event, data, createdAt: new Date() })),
        { 
          persistent: true,
          headers: { correlationId }
        }
      )
      logger.debug('Billing event published', { event, invoiceId: data._id, correlationId })
    } catch (err) {
      logger.error('Failed to publish billing event', {
        event,
        error: (err as Error).message,
      })
    }
  }

  // Existing event handlers
  async handlePaymentInitiated(evt: any): Promise<BillingDoc> {
    logger.info('Handling payment.initiated', {
      paymentId: evt.paymentId,
      reservationId: evt.reservationId,
    })

    let guestContact = evt.guestContact
    if (!guestContact) {
      try {
        guestContact = await getGuestContact(evt.guestId)
        logger.info('Fetched guest contact via RPC', { guestId: evt.guestId })
      } catch (err) {
        logger.warn('Failed to fetch guest contact for invoice', {
          guestId: evt.guestId,
          error: (err as Error).message,
        })
      }
    } else {
      logger.debug('Using guest contact from event', { guestId: evt.guestId })
    }

    const billing = await this.repo.create({
      paymentId: evt.paymentId,
      reservationId: evt.reservationId,
      guestId: evt.guestId,
      guestContact: guestContact || undefined,
      amount: evt.amount,
      currency: evt.currency,
      status: 'pending',
      ledger: [
        {
          type: 'initiated',
          amount: evt.amount,
          note: 'Payment initiated',
          createdAt: new Date(),
        },
      ],
    })

    logger.info('Invoice created', {
      invoiceId: billing._id.toString(),
      paymentId: evt.paymentId,
      amount: evt.amount,
    })

    await this.publishEvent('billing.invoice.created', billing)
    return billing
  }

  async handlePaymentSucceeded(evt: any): Promise<BillingDoc | null> {
    logger.info('Handling payment.succeeded', { paymentId: evt.paymentId })

    const updated = await this.repo.updateStatus(evt.paymentId, 'paid', {
      type: 'payment',
      amount: evt.amount,
      note: 'Payment succeeded',
    })

    if (updated) {
      logger.info('Invoice marked as paid', {
        invoiceId: updated._id.toString(),
        paymentId: evt.paymentId,
      })
      
      // ✅ Ensure guestContact is present for the notification
      const payload = updated.toObject ? updated.toObject() : { ...updated }
      if ((!payload.guestContact || !payload.guestContact.email) && evt.guestContact) {
          payload.guestContact = evt.guestContact
          // We could also update the repo here, but critical path is notification
      }

      await this.publishEvent('billing.invoice.paid', payload)
    } else {
      logger.warn('Invoice not found for payment.succeeded', {
        paymentId: evt.paymentId,
      })
    }

    return updated
  }

  async handlePaymentRefunded(evt: any): Promise<BillingDoc | null> {
    logger.info('Handling payment.refunded', {
      paymentId: evt.paymentId,
      refundAmount: evt.refundAmount,
    })

    const updated = await this.repo.updateStatus(evt.paymentId, 'refunded', {
      type: 'refund',
      amount: evt.refundAmount || evt.amount,
      note: `Payment refunded (${evt.refundPercentage * 100}%)`,
    })

    if (updated) {
      logger.info('Invoice marked as refunded', {
        invoiceId: updated._id.toString(),
        paymentId: evt.paymentId,
      })
      await this.publishEvent('billing.invoice.refunded', updated)
    } else {
      logger.warn('Invoice not found for payment.refunded', {
        paymentId: evt.paymentId,
      })
    }

    return updated
  }

  async handlePaymentFailed(evt: any): Promise<BillingDoc | null> {
    logger.info('Handling payment.failed', { paymentId: evt.paymentId })

    const updated = await this.repo.updateStatus(evt.paymentId, 'failed', {
      type: 'failure',
      amount: evt.amount,
      note: 'Payment failed',
    })

    if (updated) {
      logger.info('Invoice marked as failed', {
        invoiceId: updated._id.toString(),
        paymentId: evt.paymentId,
      })
      await this.publishEvent('billing.invoice.failed', updated)
    } else {
      logger.warn('Invoice not found for payment.failed', {
        paymentId: evt.paymentId,
      })
    }

    return updated
  }

  // Ledger Operations
  async addCharge(
    billingId: string,
    charge: Omit<LedgerEntry, 'createdAt'>
  ): Promise<BillingDoc | null> {
    logger.info('Adding charge to billing', { billingId, charge })

    const updated = await this.repo.addCharge(billingId, charge)
    if (updated) {
      // Update total amount
      const newTotal = updated.ledger.reduce((sum, entry) => sum + entry.amount, 0)
      await this.repo.updateTotalAmount(billingId, newTotal)

      await this.publishEvent('billing.charge.added', { billingId, charge })
      logger.info('Charge added successfully', { billingId, amount: charge.amount })
    }
    return updated
  }

  async addCredit(
    billingId: string,
    credit: Omit<LedgerEntry, 'createdAt'>
  ): Promise<BillingDoc | null> {
    logger.info('Adding credit to billing', { billingId, credit })

    // Credit should be negative amount
    const creditEntry = { ...credit, amount: -Math.abs(credit.amount) }
    const updated = await this.repo.addCredit(billingId, creditEntry)

    if (updated) {
      // Update total amount
      const newTotal = updated.ledger.reduce((sum, entry) => sum + entry.amount, 0)
      await this.repo.updateTotalAmount(billingId, newTotal)

      await this.publishEvent('billing.credit.added', { billingId, credit: creditEntry })
      logger.info('Credit added successfully', { billingId, amount: creditEntry.amount })
    }
    return updated
  }

  async processRefund(
    billingId: string,
    refund: Omit<LedgerEntry, 'createdAt'>
  ): Promise<BillingDoc | null> {
    logger.info('Processing refund for billing', { billingId, refund })

    // Refund should be negative amount
    const refundEntry = { ...refund, amount: -Math.abs(refund.amount) }
    const updated = await this.repo.addRefund(billingId, refundEntry)

    if (updated) {
      // Update status to refunded
      await this.repo.changeStatus(billingId, 'refunded', {
        type: 'status_change',
        amount: 0,
        note: 'Status changed to refunded',
      })

      await this.publishEvent('billing.refund.processed', { billingId, refund: refundEntry })
      logger.info('Refund processed successfully', { billingId, amount: refundEntry.amount })
    }
    return updated
  }

  async addAdjustment(
    billingId: string,
    adjustment: Omit<LedgerEntry, 'createdAt'>
  ): Promise<BillingDoc | null> {
    logger.info('Adding adjustment to billing', { billingId, adjustment })

    const updated = await this.repo.addAdjustment(billingId, adjustment)

    if (updated) {
      // Update total amount
      const newTotal = updated.ledger.reduce((sum, entry) => sum + entry.amount, 0)
      await this.repo.updateTotalAmount(billingId, newTotal)

      await this.publishEvent('billing.adjustment.added', { billingId, adjustment })
      logger.info('Adjustment added successfully', { billingId, amount: adjustment.amount })
    }
    return updated
  }

  // Status Management
  async changeBillingStatus(
    billingId: string,
    newStatus: BillingDoc['status']
  ): Promise<BillingDoc | null> {
    logger.info('Changing billing status', { billingId, newStatus })

    const updated = await this.repo.changeStatus(billingId, newStatus, {
      type: 'status_change',
      amount: 0,
      note: `Status changed to ${newStatus}`,
    })

    if (updated) {
      await this.publishEvent('billing.status.changed', { billingId, newStatus })
      logger.info('Status changed successfully', { billingId, newStatus })
    }
    return updated
  }

  async sendInvoiceEmail(billingId: string): Promise<void> {
    logger.info('Sending invoice email', { billingId })

    const billing = await this.repo.findById(billingId)
    if (!billing) {
      throw new Error('Billing not found')
    }

    if (!billing.guestContact?.email) {
      throw new Error('Guest email not available')
    }

    // Publish event to notification service via RabbitMQ
    await this.publishEvent('billing.invoice.send', billing)

    logger.info('Invoice email queued', { billingId, email: billing.guestContact.email })
  }

  // Invoice Generation
  async generateInvoicePDF(billingId: string): Promise<Buffer> {
    logger.info('Generating invoice PDF', { billingId })

    const billing = await this.repo.findById(billingId)
    if (!billing) {
      throw new Error('Billing not found')
    }

    const pdfBuffer = await PDFService.generateInvoice(billing)
    logger.info('Invoice PDF generated', { billingId })
    return pdfBuffer
  }

  // Administrative
  async archiveBilling(billingId: string): Promise<BillingDoc | null> {
    logger.info('Archiving billing', { billingId })

    const updated = await this.repo.archive(billingId)
    if (updated) {
      await this.publishEvent('billing.archived', { billingId })
      logger.info('Billing archived', { billingId })
    }
    return updated
  }

  async getAuditLog(billingId: string): Promise<LedgerEntry[]> {
    logger.info('Fetching audit log', { billingId })
    return this.repo.getAuditLog(billingId)
  }

  // Export
  async exportBillingsCSV(filters?: any): Promise<string> {
    logger.info('Exporting billings to CSV', { filters })

    const result = await this.repo.findAll(filters, { page: 1, limit: 10000 }) // Export all (limit high)
    const csv = ExportService.exportToCSV(result.data)

    logger.info('Billings exported to CSV', { count: result.data.length })
    return csv
  }

  async exportBillingsPDF(filters?: any): Promise<Buffer> {
    logger.info('Exporting billings to PDF', { filters })

    const result = await this.repo.findAll(filters, { page: 1, limit: 10000 }) // Export all
    const pdfBuffer = await ExportService.exportToPDFBatch(result.data)

    logger.info('Billings exported to PDF', { count: result.data.length })
    return pdfBuffer
  }

  // Existing query methods
  async findAll(
    filters?: any,
    options?: { page: number; limit: number; sort?: any }
  ): Promise<PaginatedResult<BillingDoc>> {
    return this.repo.findAll(filters, options)
  }

  async findById(id: string): Promise<BillingDoc | null> {
    return this.repo.findById(id)
  }

  async findByReservation(reservationId: string): Promise<BillingDoc | null> {
    return this.repo.findByReservation(reservationId)
  }
}
