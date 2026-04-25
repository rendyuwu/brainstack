import { describe, it, expect } from 'vitest';
import { middleware, config } from '../middleware';
import { NextRequest } from 'next/server';

function makeRequest(path: string, hasToken = false): NextRequest {
  const url = new URL(path, 'http://localhost:3100');
  const req = new NextRequest(url);
  if (hasToken) {
    req.cookies.set('authjs.session-token', 'fake-token');
  }
  return req;
}

describe('middleware', () => {
  it('redirects to /login when no session token on /editor path', () => {
    const req = makeRequest('/editor/new');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  it('redirects to /login when no session token on /admin path', () => {
    const req = makeRequest('/admin/ai/providers');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  it('preserves callbackUrl in redirect', () => {
    const req = makeRequest('/editor/abc-123');
    const res = middleware(req);
    const location = new URL(res.headers.get('location')!);
    expect(location.searchParams.get('callbackUrl')).toBe('/editor/abc-123');
  });

  it('passes through when session token present', () => {
    const req = makeRequest('/editor/new', true);
    const res = middleware(req);
    expect(res.headers.get('location')).toBeNull();
  });

  it('accepts __Secure- prefixed token', () => {
    const url = new URL('/admin/ai/usage', 'http://localhost:3100');
    const req = new NextRequest(url);
    req.cookies.set('__Secure-authjs.session-token', 'secure-token');
    const res = middleware(req);
    expect(res.headers.get('location')).toBeNull();
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
