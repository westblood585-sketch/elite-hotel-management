// src/controllers/payment.controller.ts
import { Request, Response, NextFunction } from 'express'
import { PaymentService } from '../../services/implementation/payment.service'
import { IPaymentController } from '../interface/IPayment.controller'

export class PaymentController implements IPaymentController {
  constructor(private svc: PaymentService) {}

  async initiate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { reservationId, guestId, guestContact, amount, currency, provider } = req.body
      const result = await this.svc.initiatePayment({
        reservationId,
        guestId,
        guestContact,
        amount,
        currency,
        provider,
      })
      res.status(201).json(result)
    } catch (err) {
      next(err)
    }
  }

  async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { paymentId } = req.params
      const { status, metadata } = req.body
      const updated = await this.svc.updatePaymentStatus(
        paymentId,
        status,
        metadata
      )
      res.json(updated)
    } catch (err) {
      next(err)
    }
  }

  async list(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        page,
        limit,
        status,
        provider,
        minAmount,
        maxAmount,
        dateFrom,
        dateTo,
        search,
        sortBy,
        sortOrder
      } = req.query

      const result = await this.svc.list({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        status: status as any,
        provider: provider as any,
        minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        search: search as string,
        sortBy: (sortBy as any) || 'createdAt',
        sortOrder: (sortOrder as any) || 'desc',
        sort: req.query.sort ? JSON.parse(req.query.sort as string) : undefined
      })

      res.json({
        success: true,
        ...result
      })
    } catch (err) {
      next(err)
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params
      const payment = await this.svc.findById(id)
      if (!payment) {
        res.status(404).json({
          success: false,
          message: 'Payment not found',
        })
        return
      }
      res.json({
        success: true,
        data: payment,
      })
    } catch (err) {
      next(err)
    }
  }
}
