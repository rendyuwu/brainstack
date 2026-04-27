import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware, config } from '../middleware';

const mockGetToken = vi.fn();

vi.mock('next-auth/jwt', () => ({
  getToken: (args: unknown) => mockGetToken(args),
}));

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, 'http://localhost:3100'));
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret';
    delete process.env.AUTH_SECRET;
  });

  it('redirects to /login when no valid session on /editor path', async () => {
    mockGetToken.mockResolvedValue(null);
    const res = await middleware(makeRequest('/editor/new'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  it('redirects to /login when no valid session on /admin path', async () => {
    mockGetToken.mockResolvedValue(null);
    const res = await middleware(makeRequest('/admin/ai/providers'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  it('preserves callbackUrl in redirect', async () => {
    mockGetToken.mockResolvedValue(null);
    const res = await middleware(makeRequest('/editor/abc-123'));
    const location = new URL(res.headers.get('location')!);
    expect(location.searchParams.get('callbackUrl')).toBe('/editor/abc-123');
  });

  it('passes through when session token is valid', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-1' });
    const res = await middleware(makeRequest('/editor/new'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('uses AUTH_SECRET before NEXTAUTH_SECRET', async () => {
    process.env.AUTH_SECRET = 'auth-secret';
    mockGetToken.mockResolvedValue({ sub: 'user-1' });
    await middleware(makeRequest('/admin/ai/usage'));
    expect(mockGetToken).toHaveBeenCalledWith(
      expect.objectContaining({ secret: 'auth-secret' })
    );
  });
});

describe('middleware config', () => {
  it('matches /editor and /admin paths', () => {
    expect(config.matcher).toContain('/editor/:path*');
    expect(config.matcher).toContain('/admin/:path*');
  });

  it('does not match public paths', () => {
    expect(config.matcher).not.toContain('/');
    expect(config.matcher).not.toContain('/blog/:path*');
    expect(config.matcher).not.toContain('/api/:path*');
  });
});
