import { Request, Response } from 'express';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ErrorHandler {
  static handle(error: any, req: Request, res: Response) {
    // Log error
    console.error('API Error', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      userId: (req as any).user?.userId,
    });

    // Determine response
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    // Unknown error - don't leak details
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    });
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}
