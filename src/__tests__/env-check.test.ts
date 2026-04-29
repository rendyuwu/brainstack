import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('env-check', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    // Replace process.env with a mutable copy for testing
    process.env = { ...originalEnv, NODE_ENV: 'production' };
    delete process.env.VITEST;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws when AUTH_SECRET is missing', async () => {
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    await expect(import('@/lib/env-check')).rejects.toThrow(
      'AUTH_SECRET (or NEXTAUTH_SECRET) is required'
    );
  });

  it('throws when AUTH_SECRET is too short', async () => {
    process.env.AUTH_SECRET = 'short';
    await expect(import('@/lib/env-check')).rejects.toThrow(
      'AUTH_SECRET must be at least 32 characters'
    );
  });

  it('passes with valid AUTH_SECRET', async () => {
    process.env.AUTH_SECRET = 'a'.repeat(32);
    // Side-effect module — import succeeds without throwing
    await expect(import('@/lib/env-check')).resolves.toBeDefined();
  });

  it('accepts NEXTAUTH_SECRET as fallback', async () => {
    delete process.env.AUTH_SECRET;
    process.env.NEXTAUTH_SECRET = 'b'.repeat(32);
    await expect(import('@/lib/env-check')).resolves.toBeDefined();
  });
});
