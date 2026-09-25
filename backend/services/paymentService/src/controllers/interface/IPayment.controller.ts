// src/controllers/interface/IPayment.controller.ts
import { Request, Response, NextFunction } from 'express'

export interface IPaymentController {
  initiate(req: Request, res: Response, next: NextFunction): Promise<void>
  updateStatus(req: Request, res: Response, next: NextFunction): Promise<void>
}
