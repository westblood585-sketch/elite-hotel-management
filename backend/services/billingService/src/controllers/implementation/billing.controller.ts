// src/controllers/implementation/billing.controller.ts
import { Request, Response, NextFunction } from 'express'
import { IBillingController } from '../interface/IBilling.controller'
import { BillingService } from '../../service/implementation/billing.service'
import { DisputeService } from '../../service/implementation/dispute.service'
import logger from '../../utils/logger.service'

export class BillingController implements IBillingController {
  constructor(
    private svc: BillingService,
    private disputeSvc: DisputeService
  ) {}

  // Existing query endpoints
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, reservationId, dateFrom, dateTo, archived, page, limit, search } = req.query
      
      const filters: any = {}
      if (status) filters.status = status
      if (reservationId) filters.reservationId = reservationId
      if (archived !== undefined) filters.archived = archived === 'true'
      if (dateFrom || dateTo) {
        filters.createdAt = {}
        if (dateFrom) filters.createdAt.$gte = new Date(dateFrom as string)
        if (dateTo) filters.createdAt.$lte = new Date(dateTo as string)
      }

      if (search) {
        const searchRegex = { $regex: search, $options: 'i' }
        filters.$or = [
          { guestId: searchRegex },
          { reservationId: searchRegex },
          { paymentId: searchRegex },
          { 'guestContact.email': searchRegex },
          { 'guestContact.phoneNumber': searchRegex }
        ]
      }

      const pageNum = parseInt(page as string) || 1
      const limitNum = parseInt(limit as string) || 20

      // Parse sort parameter
      let sort: any = { createdAt: -1 }
      if (req.query.sort) {
        try {
          const sortParams = JSON.parse(req.query.sort as string)
          if (Array.isArray(sortParams) && sortParams.length > 0) {
            sort = {}
            sortParams.forEach((s: any) => {
              sort[s.column] = s.direction === 'asc' ? 1 : -1
            })
          }
        } catch (e) {
          logger.warn('Invalid sort parameter', { sort: req.query.sort })
        }
      }

      const result = await this.svc.findAll(filters, { page: pageNum, limit: limitNum, sort })
      
      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: limitNum,
          totalPages: result.totalPages
        }
      })
    } catch (err) {
      logger.error('Error listing billings', { error: (err as Error).message })
      next(err)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const billing = await this.svc.findById(id)
      
      if (!billing) {
        res.status(404).json({
          success: false,
          message: 'Billing record not found',
        })
        return
      }

      res.json({
        success: true,
        data: billing,
      })
    } catch (err) {
      logger.error('Error fetching billing', { error: (err as Error).message })
      next(err)
    }
  }

  async getByReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reservationId } = req.params
      const billing = await this.svc.findByReservation(reservationId)
      
      if (!billing) {
        res.status(404).json({
          success: false,
          message: 'Billing record not found for this reservation',
        })
        return
      }

      res.json({
        success: true,
        data: billing,
      })
    } catch (err) {
      logger.error('Error fetching billing by reservation', { error: (err as Error).message })
      next(err)
    }
  }

  // Ledger Operations
  async addCharge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const { type, amount, note } = req.body

      if (!type || amount === undefined) {
        res.status(400).json({
          success: false,
          message: 'Type and amount are required',
        })
        return
      }

      const updated = await this.svc.addCharge(id, {
        type: 'charge',
        amount: Number(amount),
        note: note || `${type} charge`,
      })

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Billing not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Charge added successfully',
        data: updated,
      })
    } catch (err) {
      logger.error('Error adding charge', { error: (err as Error).message })
      next(err)
    }
  }

  async addCredit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const { amount, reason, note } = req.body

      if (amount === undefined || !reason) {
        res.status(400).json({
          success: false,
          message: 'Amount and reason are required',
        })
        return
      }

      const updated = await this.svc.addCredit(id, {
        type: 'credit',
        amount: Number(amount),
        note: note || reason,
      })

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Billing not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Credit added successfully',
        data: updated,
      })
    } catch (err) {
      logger.error('Error adding credit', { error: (err as Error).message })
      next(err)
    }
  }

  async processRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const { amount, reason } = req.body

      if (amount === undefined || !reason) {
        res.status(400).json({
          success: false,
          message: 'Amount and reason are required',
        })
        return
      }

      const updated = await this.svc.processRefund(id, {
        type: 'refund',
        amount: Number(amount),
        note: `Refund: ${reason}`,
      })

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Billing not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: updated,
      })
    } catch (err) {
      logger.error('Error processing refund', { error: (err as Error).message })
      next(err)
    }
  }

  async addAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const { amount, note } = req.body

      if (amount === undefined || !note) {
        res.status(400).json({
          success: false,
          message: 'Amount and note are required for adjustments',
        })
        return
      }

      const updated = await this.svc.addAdjustment(id, {
        type: 'adjustment',
        amount: Number(amount),
        note,
      })

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Billing not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Adjustment added successfully',
        data: updated,
      })
    } catch (err) {
      logger.error('Error adding adjustment', { error: (err as Error).message })
      next(err)
    }
  }

  // Status Management
  async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const { status } = req.body

      const validStatuses = ['pending', 'paid', 'refunded', 'failed', 'void', 'archived']
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        })
        return
      }

      const updated = await this.svc.changeBillingStatus(id, status)

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Billing not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Status updated successfully',
        data: updated,
      })
    } catch (err) {
      logger.error('Error changing status', { error: (err as Error).message })
      next(err)
    }
  }

  async sendInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params

      await this.svc.sendInvoiceEmail(id)

      res.json({
        success: true,
        message: 'Invoice email sent successfully',
      })
    } catch (err) {
      logger.error('Error sending invoice', { error: (err as Error).message })
      if ((err as Error).message === 'Billing not found') {
        res.status(404).json({
          success: false,
          message: 'Billing not found',
        })
        return
      }
      if ((err as Error).message === 'Guest email not available') {
        res.status(400).json({
          success: false,
          message: 'Guest email not available',
        })
        return
      }
      next(err)
    }
  }

  // Invoice & Export
  async downloadInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params

      const pdfBuffer = await this.svc.generateInvoicePDF(id)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename=invoice_${id.slice(-8)}.pdf`)
      res.send(pdfBuffer)
    } catch (err) {
      logger.error('Error downloading invoice', { error: (err as Error).message })
      if ((err as Error).message === 'Billing not found') {
        res.status(404).json({
          success: false,
          message: 'Billing not found',
        })
        return
      }
      next(err)
    }
  }

  async downloadInvoiceByReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reservationId } = req.params
      const billing = await this.svc.findByReservation(reservationId)
      
      if (!billing) {
        res.status(404).json({
          success: false,
          message: 'Billing record not found for this reservation',
        })
        return
      }

      const pdfBuffer = await this.svc.generateInvoicePDF(billing._id.toString())

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename=invoice_${billing.reservationId}.pdf`)
      res.send(pdfBuffer)
    } catch (err) {
      logger.error('Error downloading invoice by reservation', { error: (err as Error).message })
      next(err)
    }
  }

  async exportBillings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { format, status, dateFrom, dateTo } = req.query

      const filters: any = {}
      if (status) filters.status = status
      if (dateFrom || dateTo) {
        filters.createdAt = {}
        if (dateFrom) filters.createdAt.$gte = new Date(dateFrom as string)
        if (dateTo) filters.createdAt.$lte = new Date(dateTo as string)
      }

      if (format === 'csv') {
        const csv = await this.svc.exportBillingsCSV(filters)
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename=billings.csv')
        res.send(csv)
      } else if (format === 'pdf') {
        const pdfBuffer = await this.svc.exportBillingsPDF(filters)
        res.setHeader('Content-Type', 'application/zip')
        res.setHeader('Content-Disposition', 'attachment; filename=billings.zip')
        res.send(pdfBuffer)
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid format. Use csv or pdf',
        })
      }
    } catch (err) {
      logger.error('Error exporting billings', { error: (err as Error).message })
      next(err)
    }
  }

  // Administrative
  async getAuditLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params

      const auditLog = await this.svc.getAuditLog(id)

      res.json({
        success: true,
        data: auditLog,
      })
    } catch (err) {
      logger.error('Error fetching audit log', { error: (err as Error).message })
      next(err)
    }
  }

  async archiveBilling(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params

      const updated = await this.svc.archiveBilling(id)

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Billing not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Billing archived successfully',
        data: updated,
      })
    } catch (err) {
      logger.error('Error archiving billing', { error: (err as Error).message })
      next(err)
    }
  }

  // Dispute Management
  async flagDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const { reason, createdBy } = req.body

      if (!reason || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'Reason and createdBy are required',
        })
        return
      }

      const dispute = await this.disputeSvc.createDispute(id, reason, createdBy)

      res.status(201).json({
        success: true,
        message: 'Dispute flagged successfully',
        data: dispute,
      })
    } catch (err) {
      logger.error('Error flagging dispute', { error: (err as Error).message })
      if ((err as Error).message === 'Billing not found') {
        res.status(404).json({
          success: false,
          message: 'Billing not found',
        })
        return
      }
      next(err)
    }
  }

  async resolveDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, disputeId } = req.params
      const { resolutionNote, resolvedBy, status } = req.body

      if (!resolutionNote || !resolvedBy || !status) {
        res.status(400).json({
          success: false,
          message: 'Resolution note, resolvedBy, and status are required',
        })
        return
      }

      if (!['resolved', 'rejected'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Status must be either resolved or rejected',
        })
        return
      }

      const dispute = await this.disputeSvc.resolveDispute(disputeId, {
        resolutionNote,
        resolvedBy,
        status,
      })

      if (!dispute) {
        res.status(404).json({
          success: false,
          message: 'Dispute not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Dispute resolved successfully',
        data: dispute,
      })
    } catch (err) {
      logger.error('Error resolving dispute', { error: (err as Error).message })
      next(err)
    }
  }

  async getDisputesByBilling(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params

      const disputes = await this.disputeSvc.getDisputesByBilling(id)

      res.json({
        success: true,
        data: disputes,
      })
    } catch (err) {
      logger.error('Error fetching disputes', { error: (err as Error).message })
      next(err)
    }
  }
}

