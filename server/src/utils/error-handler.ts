/**
 * Standardized Error Handling
 * 
 * Provides consistent error responses across all API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { getAppConfig } from '../config/app.config';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * Custom error class for API errors
 */
export class AppError extends Error implements ApiError {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Standardized error response format
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path?: string;
  };
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: ApiError | Error,
  req?: Request
): ErrorResponse {
  const config = getAppConfig();
  const isDevelopment = config.nodeEnv === 'development';

  // Determine error code and message
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  if (error instanceof AppError) {
    code = error.code;
    message = error.message;
    details = isDevelopment ? error.details : undefined;
  } else if (error instanceof Error) {
    message = isDevelopment ? error.message : 'An unexpected error occurred';
    details = isDevelopment ? { stack: error.stack } : undefined;
  }

  return {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: req?.originalUrl,
    },
  };
}

/**
 * Standardized success response format
 */
export interface SuccessResponse<T = any> {
  data?: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  meta?: SuccessResponse<T>['meta']
): SuccessResponse<T> {
  const response: SuccessResponse<T> = {};

  if (data !== undefined) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: ApiError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errorResponse = createErrorResponse(err, req);
  const statusCode = (err as ApiError).statusCode || 500;

  // Log error in development
  const config = getAppConfig();
  if (config.nodeEnv === 'development') {
    console.error('Error:', err);
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper for route handlers
 * Wraps async route handlers to catch errors and pass to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  const errorResponse = createErrorResponse(
    new AppError('Route not found', 404, 'NOT_FOUND'),
    req
  );
  res.status(404).json(errorResponse);
}

