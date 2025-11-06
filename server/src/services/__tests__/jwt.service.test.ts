/**
 * JWT Service Unit Tests
 */

import { JWTService } from '../jwt.service';
import { AuthError } from '../../types/auth.types';

describe('JWTService', () => {
  let jwtService: JWTService;

  beforeEach(() => {
    // Set test JWT secret
    process.env.JWT_SECRET = 'test-secret-key';
    jwtService = new JWTService();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: 'user-123',
        phone: '+1234567890',
        email: 'test@example.com',
      };

      const token = jwtService.generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyAccessToken', () => {
    it('should successfully verify a valid token', () => {
      const payload = {
        userId: 'user-123',
        phone: '+1234567890',
        email: 'test@example.com',
      };

      const token = jwtService.generateAccessToken(payload);
      const decoded = jwtService.verifyAccessToken(token);

      expect(decoded.userId).toBe('user-123');
      expect(decoded.phone).toBe('+1234567890');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => jwtService.verifyAccessToken(invalidToken)).toThrow(AuthError);
    });

    it('should throw error for tampered token', () => {
      const payload = { userId: 'user-123', phone: '+1234567890' };
      const token = jwtService.generateAccessToken(payload);
      const tampered = token.substring(0, token.length - 5) + 'XXXXX';

      expect(() => jwtService.verifyAccessToken(tampered)).toThrow(AuthError);
    });
  });

  describe('getExpiresIn', () => {
    it('should return correct expiry time in seconds', () => {
      process.env.JWT_SECRET = 'test-secret';
      const jwt = new JWTService();
      const expiresIn = jwt.getExpiresIn();

      expect(expiresIn).toBeGreaterThan(0);
      expect(typeof expiresIn).toBe('number');
    });
  });
});

