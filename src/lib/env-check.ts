/**
 * §V.44: Boot-time environment validation.
 * Import this module early (e.g., from db/index.ts) to fail fast on misconfiguration.
 * Skipped during test runs (NODE_ENV=test or VITEST=true).
 */

export const ENV_VALIDATED = (() => {
  if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
    const AUTH_SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

    if (!AUTH_SECRET) {
      throw new Error(
        'AUTH_SECRET (or NEXTAUTH_SECRET) is required. Generate with: openssl rand -base64 32'
      );
    }

    if (AUTH_SECRET.length < 32) {
      throw new Error(
        `AUTH_SECRET must be at least 32 characters (got ${AUTH_SECRET.length}). Generate with: openssl rand -base64 32`
      );
    }
  }
  return true;
})();
