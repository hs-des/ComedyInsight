/**
 * Unit Tests - Encryption Service
 */

import { deriveKey, encrypt, decrypt } from '../../../server/src/services/encryption.service';
import crypto from 'crypto';

describe('Encryption Service', () => {
  const testUserId = 'user-123';
  const testDeviceId = 'device-456';

  beforeEach(() => {
    process.env.ENCRYPTION_SECRET = 'test-encryption-secret';
  });

  describe('deriveKey', () => {
    it('should derive same key for same inputs', () => {
      const key1 = deriveKey(testUserId, testDeviceId);
      const key2 = deriveKey(testUserId, testDeviceId);

      expect(key1).toEqual(key2);
    });

    it('should derive different key for different inputs', () => {
      const key1 = deriveKey(testUserId, testDeviceId);
      const key2 = deriveKey('other-user', testDeviceId);

      expect(key1).not.toEqual(key2);
    });

    it('should generate a 32-byte key', () => {
      const key = deriveKey(testUserId, testDeviceId);
      expect(key.length).toBe(32);
    });
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt data correctly', () => {
      const originalData = Buffer.from('test video content');
      const { encrypted, iv, tag } = encrypt(originalData, testUserId, testDeviceId);

      expect(encrypted).toBeDefined();
      expect(iv).toBeDefined();
      expect(tag).toBeDefined();
      expect(encrypted).not.toEqual(originalData);

      const decrypted = decrypt(encrypted, iv, tag, testUserId, testDeviceId);
      expect(decrypted).toEqual(originalData);
    });

    it('should fail with wrong key', () => {
      const originalData = Buffer.from('test data');
      const { encrypted, iv, tag } = encrypt(originalData, testUserId, testDeviceId);

      expect(() => {
        decrypt(encrypted, iv, tag, 'wrong-user', testDeviceId);
      }).toThrow();
    });

    it('should fail with wrong tag', () => {
      const originalData = Buffer.from('test data');
      const { encrypted, iv, tag } = encrypt(originalData, testUserId, testDeviceId);
      const wrongTag = crypto.randomBytes(16);

      expect(() => {
        decrypt(encrypted, iv, wrongTag, testUserId, testDeviceId);
      }).toThrow();
    });

    it('should handle large data', () => {
      const largeData = Buffer.alloc(1024 * 1024, 'a'); // 1MB
      const { encrypted, iv, tag } = encrypt(largeData, testUserId, testDeviceId);

      const decrypted = decrypt(encrypted, iv, tag, testUserId, testDeviceId);
      expect(decrypted).toEqual(largeData);
    });
  });
});

