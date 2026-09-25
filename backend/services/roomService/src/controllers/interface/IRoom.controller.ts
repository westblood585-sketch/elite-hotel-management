import { NextFunction, Request, Response } from 'express'

export interface IRoomController {
  create(req: Request, res: Response, next: NextFunction): Promise<void>
  getById(req: Request, res: Response, next: NextFunction): Promise<void>
  list(req: Request, res: Response, next: NextFunction): Promise<void>
  patch(req: Request, res: Response, next: NextFunction): Promise<void>
  remove(req: Request, res: Response, next: NextFunction): Promise<void>
}
