/**
 * Security Middleware
 * Input validation, sanitization, CSRF protection
 */

import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        // Remove HTML tags
        req.body[key] = req.body[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      }
    });
  }
  next();
};

/**
 * Validate and sanitize common input fields
 */
export const validateInput = [
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone('any'),
  body('username').optional().isLength({ min: 3, max: 50 }).trim(),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

/**
 * Check validation results
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * CSRF token validation for dashboard
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for public API endpoints
  if (req.path.startsWith('/api/public') || req.path.startsWith('/health')) {
    return next();
  }

  // For dashboard/admin endpoints
  if (req.path.startsWith('/admin')) {
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = (req as any).session?.csrfToken;

    if (!token || token !== sessionToken) {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }
  }

  next();
};

/**
 * SQL injection prevention - ensure using parameterized queries
 */
export const checkSqlInjection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(;|\-\-|#|\*|\/\*|\*\/)/g,
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return sqlPatterns.some((pattern) => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    return res.status(400).json({ message: 'Suspicious input detected' });
  }

  next();
};

/**
 * File upload validation
 */
export const validateFileUpload = (allowedTypes: string[], maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next();
    }

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type' });
    }

    // Check file size (in bytes)
    if (req.file.size > maxSize) {
      return res.status(400).json({ message: 'File too large' });
    }

    next();
  };
};

/**
 * Content-Type validation
 */
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      return res.status(400).json({ message: 'Missing Content-Type header' });
    }

    if (!allowedTypes.some(type => contentType.includes(type))) {
      return res.status(400).json({ message: 'Invalid Content-Type' });
    }

    next();
  };
};

/**
 * Request size limit middleware
 */
export const requestSizeLimit = (maxSize: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxBytes = parseSize(maxSize);

    if (contentLength > maxBytes) {
      return res.status(413).json({ message: 'Request entity too large' });
    }

    next();
  };
};

/**
 * Parse size string to bytes (e.g., "1MB" => 1048576)
 */
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
  };

  const match = size.match(/^(\d+)([A-Z]+)$/);
  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2].toUpperCase();
  return value * (units[unit] || 1);
}

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

