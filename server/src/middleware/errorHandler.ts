import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger, logError } from '@/utils/logger';

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Log error details
  logError(error, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  });

  // Handle different error types
  if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    // Validation errors
    statusCode = 400;
    message = 'Validation failed';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Database errors
    statusCode = 400;
    
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = error.meta?.target as string[] | undefined;
        message = `A record with this ${field?.[0] || 'value'} already exists`;
        break;
      case 'P2025':
        // Record not found
        message = 'Requested record not found';
        statusCode = 404;
        break;
      case 'P2003':
        // Foreign key constraint violation
        message = 'Cannot perform this operation due to existing relationships';
        break;
      case 'P2014':
        // Invalid relation
        message = 'Invalid relationship data provided';
        break;
      default:
        message = 'Database operation failed';
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = 'Database connection failed';
  } else if (error.name === 'MulterError') {
    // File upload errors
    statusCode = 400;
    message = `File upload error: ${error.message}`;
  } else if (error.name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  } else if (error.message.includes('ENOENT')) {
    // File not found errors
    statusCode = 404;
    message = 'File not found';
  } else if (error.message.includes('EACCES')) {
    // Permission errors
    statusCode = 403;
    message = 'Permission denied';
  } else if ((error as AppError).statusCode) {
    // Custom error with status code
    statusCode = (error as AppError).statusCode!;
    message = error.message;
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse: any = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  if (details) {
    errorResponse.details = details;
  }

  if (isDevelopment) {
    errorResponse.stack = error.stack;
    errorResponse.originalError = error.message;
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Common error creators
export const createValidationError = (message: string) => {
  return new CustomError(message, 400);
};

export const createNotFoundError = (resource: string = 'Resource') => {
  return new CustomError(`${resource} not found`, 404);
};

export const createUnauthorizedError = (message: string = 'Unauthorized') => {
  return new CustomError(message, 401);
};

export const createForbiddenError = (message: string = 'Access denied') => {
  return new CustomError(message, 403);
};

export const createConflictError = (message: string) => {
  return new CustomError(message, 409);
};

export const createTooManyRequestsError = (message: string = 'Too many requests') => {
  return new CustomError(message, 429);
};