// src/controllers/interface/IBilling.controller.ts
import { Request, Response, NextFunction } from 'express'

export interface IBillingController {
  // Existing query endpoints
  list(req: Request, res: Response, next: NextFunction): Promise<void>
  getById(req: Request, res: Response, next: NextFunction): Promise<void>
  getByReservation(req: Request, res: Response, next: NextFunction): Promise<void>

  // Ledger operations
  addCharge(req: Request, res: Response, next: NextFunction): Promise<void>
  addCredit(req: Request, res: Response, next: NextFunction): Promise<void>
  processRefund(req: Request, res: Response, next: NextFunction): Promise<void>
  addAdjustment(req: Request, res: Response, next: NextFunction): Promise<void>

  // Status management
  changeStatus(req: Request, res: Response, next: NextFunction): Promise<void>
  sendInvoice(req: Request, res: Response, next: NextFunction): Promise<void>

  // Invoice & Export
  downloadInvoice(req: Request, res: Response, next: NextFunction): Promise<void>
  downloadInvoiceByReservation(req: Request, res: Response, next: NextFunction): Promise<void>
  exportBillings(req: Request, res: Response, next: NextFunction): Promise<void>

  // Administrative
  getAuditLog(req: Request, res: Response, next: NextFunction): Promise<void>
  archiveBilling(req: Request, res: Response, next: NextFunction): Promise<void>

  // Dispute management
  flagDispute(req: Request, res: Response, next: NextFunction): Promise<void>
  resolveDispute(req: Request, res: Response, next: NextFunction): Promise<void>
  getDisputesByBilling(req: Request, res: Response, next: NextFunction): Promise<void>
}
