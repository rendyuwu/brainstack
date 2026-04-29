import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * §V.41: AES-256-GCM encryption for provider API keys.
 * Format: iv:authTag:ciphertext (all hex-encoded)
 * Requires ENCRYPTION_KEY env var (32-byte hex = 64 hex chars).
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended IV length
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error(
      'ENCRYPTION_KEY is required for API key encryption. Generate with: openssl rand -hex 32'
    );
  }
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be 32 bytes (64 hex chars), got ${key.length} bytes`
    );
  }
  return key;
}

/** Returns true if the string looks like our encrypted format (iv:tag:ciphertext) */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  const [iv, tag, cipher] = parts;
  // IV = 12 bytes = 24 hex chars, auth tag = 16 bytes = 32 hex chars
  return (
    iv.length === IV_LENGTH * 2 &&
    tag.length === AUTH_TAG_LENGTH * 2 &&
    /^[0-9a-f]+$/i.test(iv) &&
    /^[0-9a-f]+$/i.test(tag) &&
    (cipher.length === 0 || /^[0-9a-f]+$/i.test(cipher))
  );
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format');
  }
  const [ivHex, authTagHex, encryptedHex] = parts;

  if (!ivHex || !authTagHex) {
    throw new Error('Invalid encrypted format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/** Mask API key for display: show first 4 + last 4 chars, mask middle */
export function maskKey(key: string | null): string | null {
  if (!key) return null;
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}${'*'.repeat(Math.min(key.length - 8, 20))}${key.slice(-4)}`;
}
