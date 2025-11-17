import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Global error handling middleware
 * Handles different types of errors and sends appropriate responses
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let validationErrors: Array<{ field: string; message: string }> | undefined = undefined;

  // Handle ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    validationErrors = err.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Send error response
  const response: {
    success: boolean;
    message: string;
    errors?: Array<{ field: string; message: string }>;
    stack?: string;
  } = {
    success: false,
    message,
  };

  if (validationErrors) {
    response.errors = validationErrors;
  }

  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Middleware to handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
