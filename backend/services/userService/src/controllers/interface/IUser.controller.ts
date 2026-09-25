// src/controllers/interface/IUser.controller.ts
import { Request, Response, NextFunction } from 'express'

export interface IUserController {
  create(req: Request, res: Response, next: NextFunction): Promise<void | Response>
  getById(req: Request, res: Response, next: NextFunction): Promise<void | Response>
  list(req: Request, res: Response, next: NextFunction): Promise<void>
  patch(req: Request, res: Response, next: NextFunction): Promise<void>
  remove(req: Request, res: Response, next: NextFunction): Promise<void>
  updateAvatar(req: Request, res: Response, next: NextFunction): Promise<void>
  uploadPublic(req: Request, res: Response, next: NextFunction): Promise<void>
  removeAvatar(req: Request, res: Response, next: NextFunction): Promise<void>
}
