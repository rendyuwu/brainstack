import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt, maskKey, isEncrypted } from '@/lib/crypto';
import { randomBytes } from 'crypto';

// Set up a test encryption key
beforeAll(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex');
});

describe('crypto', () => {
  describe('encrypt/decrypt round-trip', () => {
    it('encrypts and decrypts a string', () => {
      const plaintext = 'sk-test-api-key-12345';
      const encrypted = encrypt(plaintext);
      expect(encrypted).not.toBe(plaintext);
      expect(decrypt(encrypted)).toBe(plaintext);
    });

    it('produces different ciphertext each time (random IV)', () => {
      const plaintext = 'same-key';
      const a = encrypt(plaintext);
      const b = encrypt(plaintext);
      expect(a).not.toBe(b);
      expect(decrypt(a)).toBe(plaintext);
      expect(decrypt(b)).toBe(plaintext);
    });

    it('handles empty string', () => {
      const encrypted = encrypt('');
      // Empty string still produces valid ciphertext (GCM auth tag protects it)
      expect(encrypted).toBeTruthy();
      expect(decrypt(encrypted)).toBe('');
    });

    it('handles unicode', () => {
      const plaintext = 'key-with-émojis-🔑';
      const encrypted = encrypt(plaintext);
      expect(decrypt(encrypted)).toBe(plaintext);
    });
  });

  describe('isEncrypted', () => {
    it('detects encrypted format', () => {
      const encrypted = encrypt('test');
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('rejects plaintext', () => {
      expect(isEncrypted('sk-plain-api-key')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isEncrypted('')).toBe(false);
    });
  });

  describe('maskKey', () => {
    it('masks middle of long key', () => {
      expect(maskKey('sk-1234567890abcdef')).toBe('sk-1***********cdef');
    });

    it('returns **** for short key', () => {
      expect(maskKey('short')).toBe('****');
    });

    it('returns null for null', () => {
      expect(maskKey(null)).toBeNull();
    });
  });
});
