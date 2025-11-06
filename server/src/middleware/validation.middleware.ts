/**
 * Validation Middleware - Input sanitization and validation
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate phone number format (E.164)
 */
export const validatePhone = (phone: string): boolean => {
  return /^\+[1-9]\d{1,14}$/.test(phone);
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Sanitize request body strings
 */
export const sanitizeBody = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  next();
};

/**
 * Validate request using express-validator
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    next();
  };
};

/**
 * Prevent user enumeration attacks by normalizing error messages
 */
export const normalizeErrors = (err: any, req: Request, res: Response, next: NextFunction): void => {
  // In production, don't expose specific validation errors
  if (process.env.NODE_ENV === 'production') {
    if (res.statusCode === 400) {
      res.json({
        error: 'Bad Request',
        message: 'Invalid request data',
      });
      return;
    }
  }
  next(err);
};

