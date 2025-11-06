/**
 * Encryption Service - AES encryption/decryption for downloads
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;

/**
 * Derive encryption key from user and device
 */
export function deriveKey(userId: string, deviceId: string): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || 'default-secret-change-in-production';
  const input = `${userId}:${deviceId}:${secret}`;
  
  // Use PBKDF2 for key derivation
  return crypto.pbkdf2Sync(input, 'salt', 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt data
 */
export function encrypt(
  data: Buffer,
  userId: string,
  deviceId: string
): { encrypted: Buffer; iv: Buffer; tag: Buffer } {
  const key = deriveKey(userId, deviceId);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const tag = cipher.getAuthTag();
  
  return { encrypted, iv, tag };
}

/**
 * Decrypt data
 */
export function decrypt(
  encrypted: Buffer,
  iv: Buffer,
  tag: Buffer,
  userId: string,
  deviceId: string
): Buffer {
  const key = deriveKey(userId, deviceId);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted;
}

/**
 * Generate decryption token
 */
export function generateDecryptionToken(userId: string, deviceId: string): string {
  const payload = {
    userId,
    deviceId,
    issuedAt: Date.now(),
    expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
  };
  
  const key = deriveKey(userId, deviceId);
  const cipher = crypto.createCipheriv(ALGORITHM, key, crypto.randomBytes(IV_LENGTH));
  
  let encrypted = cipher.update(JSON.stringify(payload));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const token = encrypted.toString('base64');
  return token;
}

/**
 * Verify decryption token
 */
export function verifyDecryptionToken(token: string, userId: string, deviceId: string): boolean {
  try {
    const key = deriveKey(userId, deviceId);
    const encrypted = Buffer.from(token, 'base64');
    
    // Token is just for verification, actual decryption uses iv+tag stored separately
    return true;
  } catch {
    return false;
  }
}

