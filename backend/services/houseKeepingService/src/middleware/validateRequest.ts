import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { AppError } from '../errors/AppError'

export default function validateRequest(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
    })
    if (error) {
      const message = error.details.map((d) => d.message).join(', ')
      return next(new AppError(message, 400))
    }
    next()
  }
}
