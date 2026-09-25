import { Request, Response, NextFunction } from 'express'
import { ErrorHandler } from '../utils/error-handler'

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  if (res.headersSent) {
    return next(err)
  }

  ErrorHandler.handle(err, req, res)
}

export default errorHandler
