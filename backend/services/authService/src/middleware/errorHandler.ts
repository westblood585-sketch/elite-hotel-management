import { Request, Response, NextFunction } from "express";

interface CustomError extends Error {
  statusCode?: number;
}

const errorHandler = (
  err: CustomError & { code?: string },
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Ignore client disconnection errors - these are normal and not actionable
  const ignoredErrors = ['ECONNABORTED', 'ECONNRESET', 'EPIPE'];
  if (err.code && ignoredErrors.includes(err.code)) {
    // Client disconnected before request completed - this is normal during dev (hot reload, etc.)
    return;
  }

  // Log actual application errors
  console.error(
    "Error in auth middleware:",
    {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack
    }
  );

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  // Only send response if connection is still open
  if (!res.headersSent) {
    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export default errorHandler;
