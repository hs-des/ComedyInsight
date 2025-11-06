# Security Implementation Guide

Complete security implementation for ComedyInsight with code examples.

## 🔒 Quick Start

```bash
# Install dependencies
cd server
yarn install

# Run database migrations (including refresh tokens)
psql -U comedyinsight -d comedyinsight -f ../security/migrations/create_refresh_tokens.sql

# Start server with security middleware
yarn dev
```

## 📝 Implementation Checklist

- [x] Input validation and sanitization
- [x] SQL injection prevention
- [x] CSRF protection
- [x] Rate limiting
- [x] JWT security and rotation
- [x] Refresh token management
- [x] Audit logging
- [x] Prometheus metrics
- [x] Privacy policy

## 🛡️ Security Middleware Usage

### 1. Input Validation

```typescript
import { validateInput, handleValidationErrors } from './middleware/security.middleware';
import { sanitizeInput } from './middleware/security.middleware';

// In your routes
app.post('/api/users',
  sanitizeInput,
  validateInput,
  handleValidationErrors,
  createUserController
);
```

### 2. Rate Limiting

```typescript
import {
  otpRateLimiter,
  loginRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
} from './middleware/ratelimit.middleware';

// OTP endpoint
app.post('/auth/send-otp',
  otpRateLimiter,
  sendOtpController
);

// Login endpoint
app.post('/auth/login',
  loginRateLimiter,
  loginController
);

// Upload endpoint
app.post('/api/upload',
  uploadRateLimiter,
  uploadController
);

// General API endpoints
app.use('/api', apiRateLimiter);
```

### 3. JWT Security

```typescript
import { jwtService, checkTokenBlacklist } from './middleware';

// Protected routes
app.get('/api/profile',
  authenticateToken,
  checkTokenBlacklist,
  getProfileController
);

// Token refresh
app.post('/auth/refresh',
  refreshTokenController  // See example below
);
```

### 4. Audit Logging

```typescript
import { auditLogger } from './middleware/audit.middleware';

// In controllers
async function deleteVideo(req: Request, res: Response) {
  const userId = req.user.userId;
  const videoId = req.params.id;

  // Perform deletion
  await videoService.delete(videoId);

  // Log action
  await auditLogger.logAdminAction(
    userId,
    'delete_video',
    'video',
    videoId,
    { /* old values */ },
    { /* new values */ }
  );

  res.json({ success: true });
}
```

### 5. Metrics Collection

```typescript
import { metricsMiddleware, getMetrics } from './services/prometheus-metrics.service';

// Add metrics middleware
app.use(metricsMiddleware);

// Expose metrics endpoint
app.get('/metrics', getMetrics);
```

## 🔐 Complete Example

```typescript
// server/src/routes/auth.routes.ts
import express from 'express';
import { 
  sanitizeInput, 
  validateInput, 
  handleValidationErrors,
  otpRateLimiter,
  loginRateLimiter 
} from '../middleware/security.middleware';

const router = express.Router();

// Send OTP with rate limiting and validation
router.post('/send-otp',
  sanitizeInput,
  validateInput,
  handleValidationErrors,
  otpRateLimiter,
  async (req, res) => {
    // Your logic here
  }
);

// Login with rate limiting
router.post('/login',
  sanitizeInput,
  validateInput,
  handleValidationErrors,
  loginRateLimiter,
  async (req, res) => {
    // Your logic here
  }
);

export default router;
```

## 📊 Monitoring

### Prometheus Metrics

Access metrics at: `http://localhost:3000/metrics`

**Format: `prometheus`**
```
# Prometheus Metrics

# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1500
http_requests_total{method="POST",status="200"} 800

# HELP http_errors_total Total HTTP errors
# TYPE http_errors_total counter
http_errors_total{method="POST",status="400"} 50

# HELP http_response_time_seconds HTTP response time
# TYPE http_response_time_seconds summary
http_response_time_seconds{quantile="0.5"} 0.125
http_response_time_seconds{quantile="0.95"} 0.450
http_response_time_seconds{quantile="0.99"} 1.200

# HELP http_active_connections Active HTTP connections
# TYPE http_active_connections gauge
http_active_connections 15
```

**Format: `json`**
```json
{
  "http_requests": {
    "GET:200": 1500,
    "POST:200": 800
  },
  "http_errors": {
    "POST:400": 50
  },
  "response_time": {
    "p50": 125,
    "p95": 450,
    "p99": 1200,
    "avg": 180
  },
  "active_connections": 15
}
```

## 🔄 Token Rotation

### Refresh Token Flow

```typescript
// server/src/controllers/auth.controller.ts
import { rotateRefreshToken } from '../middleware/jwt-security.middleware';
import { Pool } from 'pg';

export const refreshToken = async (req: Request, res: Response, db: Pool) => {
  const { refreshToken: oldToken } = req.body;

  try {
    // Rotate token
    const newRefreshToken = await rotateRefreshToken(
      db,
      req.user.userId,
      oldToken
    );

    // Generate new access token
    const newAccessToken = jwtService.generateAccessToken({
      userId: req.user.userId,
      phone: req.user.phone,
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};
```

## 🚨 Error Handling

```typescript
// Log all security events
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.message.includes('rate limit')) {
    auditLogger.logAuthAction('rate_limit_exceeded', {
      ip: req.ip,
      path: req.path,
    });
  }

  if (err.message.includes('token')) {
    auditLogger.logAuthAction('token_error', {
      ip: req.ip,
      error: err.message,
    });
  }

  next(err);
});
```

## 📈 Dashboard Integration

```typescript
// Add metrics to dashboard
import { metricsService } from './services/prometheus-metrics.service';

app.get('/api/admin/metrics', 
  authenticateToken,
  requireAdmin,
  (req, res) => {
    res.json(metricsService.getMetrics());
  }
);
```

## 🧪 Testing

```typescript
// Test rate limiting
describe('Rate Limiting', () => {
  it('should block after 5 OTP requests', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/auth/send-otp').send({ phone: '+1234567890' });
    }
    
    const response = await request(app)
      .post('/auth/send-otp')
      .send({ phone: '+1234567890' });
      
    expect(response.status).toBe(429);
  });
});

// Test CSRF protection
describe('CSRF Protection', () => {
  it('should reject requests without CSRF token', async () => {
    const response = await request(app)
      .post('/admin/videos')
      .send({ title: 'Test Video' });
      
    expect(response.status).toBe(403);
  });
});
```

## 🔧 Configuration

```bash
# .env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret
RATE_LIMIT_OTP=5
RATE_LIMIT_LOGIN=10
RATE_LIMIT_API=100
```

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Rate Limiting Strategies](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

## ✅ Security Audit

Run these checks before deployment:

```bash
# Dependency vulnerabilities
npm audit

# Code analysis
npm run lint

# Security headers test
curl -I https://your-domain.com/api

# SSL test
openssl s_client -connect your-domain.com:443

# Rate limit test
for i in {1..10}; do curl http://localhost:3000/auth/send-otp; done
```

## 🆘 Incident Response

1. **Detect**: Monitor logs and metrics
2. **Contain**: Block IPs, revoke tokens
3. **Investigate**: Review audit logs
4. **Remediate**: Fix vulnerabilities
5. **Document**: Update security docs

## 📞 Support

- Security Team: security@comedyinsight.com
- Emergency: +1-XXX-XXX-XXXX

