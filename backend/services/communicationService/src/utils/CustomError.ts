import { HttpStatus } from '../enums/http.status'

class CustomError extends Error {
  public statusCode: number

  constructor(message: string, statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR) {
    super(message)
    this.statusCode = statusCode
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export default CustomError
