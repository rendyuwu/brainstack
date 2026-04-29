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

  it('redirects to /login when no valid session on /settings path', async () => {
    mockGetToken.mockResolvedValue(null);
    const res = await middleware(makeRequest('/settings'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  // §V.40: /ask requires admin — redirect to login when no session
  it('redirects to /login when no valid session on /ask path', async () => {
    mockGetToken.mockResolvedValue(null);
    const res = await middleware(makeRequest('/ask'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  it('preserves callbackUrl in redirect', async () => {
    mockGetToken.mockResolvedValue(null);
    const res = await middleware(makeRequest('/editor/abc-123'));
    const location = new URL(res.headers.get('location')!);
    expect(location.searchParams.get('callbackUrl')).toBe('/editor/abc-123');
  });

  // §V.36: non-admin token → redirect to / for /editor/*
  it('redirects non-admin to / on /editor path', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-1', role: 'editor' });
    const res = await middleware(makeRequest('/editor/new'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/');
  });

  // §V.37: non-admin token → redirect to / for /settings
  it('redirects non-admin to / on /settings path', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-1', role: 'editor' });
    const res = await middleware(makeRequest('/settings'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/');
  });

  // §V.38: non-admin token → redirect to / for /admin/*
  it('redirects non-admin to / on /admin path', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-1', role: 'editor' });
    const res = await middleware(makeRequest('/admin/ai/providers'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/');
  });

  // §V.40: non-admin token → redirect to / for /ask
  it('redirects non-admin to / on /ask path', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-1', role: 'editor' });
    const res = await middleware(makeRequest('/ask'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/');
  });

  // §V.36: token with no role → redirect to /
  it('redirects user with no role to / on /editor path', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-1' });
    const res = await middleware(makeRequest('/editor'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/');
  });

  it('passes through when admin token on /editor path', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-1', role: 'admin' });
    const res = await middleware(makeRequest('/editor/new'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('passes through when admin token on /settings path', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-1', role: 'admin' });
    const res = await middleware(makeRequest('/settings'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('passes through when admin token on /admin path', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-1', role: 'admin' });
    const res = await middleware(makeRequest('/admin/ai/usage'));
    expect(res.headers.get('location')).toBeNull();
  });

  // §V.40: admin token → pass through for /ask
  it('passes through when admin token on /ask path', async () => {
    mockGetToken.mockResolvedValue({ sub: 'user-1', role: 'admin' });
    const res = await middleware(makeRequest('/ask'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('uses AUTH_SECRET before NEXTAUTH_SECRET', async () => {
    process.env.AUTH_SECRET = 'auth-secret';
    mockGetToken.mockResolvedValue({ sub: 'user-1', role: 'admin' });
    await middleware(makeRequest('/admin/ai/usage'));
    expect(mockGetToken).toHaveBeenCalledWith(
      expect.objectContaining({ secret: 'auth-secret' })
    );
  });
});

describe('middleware config', () => {
  it('matches /editor, /admin, /settings, and /ask paths', () => {
    expect(config.matcher).toContain('/editor/:path*');
    expect(config.matcher).toContain('/admin/:path*');
    expect(config.matcher).toContain('/settings/:path*');
    expect(config.matcher).toContain('/ask/:path*');
  });

  it('does not match public paths', () => {
    expect(config.matcher).not.toContain('/');
    expect(config.matcher).not.toContain('/blog/:path*');
    expect(config.matcher).not.toContain('/api/:path*');
  });
});
