import { JwtPayload } from 'jsonwebtoken'
import { Request } from 'express'

export interface CustomeRequest extends Request {
  user?: JwtPayload
}
