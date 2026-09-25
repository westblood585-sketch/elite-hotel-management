import { Request } from 'express'

export interface CustomeRequest extends Request {
  user?: any
}
