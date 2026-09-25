// src/controllers/interface/IGuest.controller.ts
import { Request, Response, NextFunction } from 'express'

export interface IGuestController {
  create(req: Request, res: Response, next: NextFunction): Promise<any>
  getById(req: Request, res: Response, next: NextFunction): Promise<any>
  list(req: Request, res: Response, next: NextFunction): Promise<any>
  patch(req: Request, res: Response, next: NextFunction): Promise<any>
  remove(req: Request, res: Response, next: NextFunction): Promise<any>

  updateIdProofImage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any>
  removeIdProofImage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any>

  ensureForBooking(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any>
}
