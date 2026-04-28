import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
  requireAdmin: async () => {
    const session = await mockAuth();
    if (!session?.user || session.user.role !== 'admin') return null;
    return session;
  },
  unauthorizedResponse: () =>
    NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
}));

vi.mock('@/lib/ai/draft', () => ({
  generateDraft: vi.fn().mockResolvedValue(new ReadableStream()),
}));

vi.mock('@/lib/ai/rewrite', () => ({
  rewriteContent: vi.fn().mockResolvedValue(new ReadableStream()),
}));

vi.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
}));

// §V.35: AI features require admin role
describe('AI admin guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- /api/ai/draft ---

  it('POST /api/ai/draft returns 401 without session', async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import('../../ai/draft/route');
    const req = new NextRequest('http://localhost/api/ai/draft', {
      method: 'POST',
      body: JSON.stringify({ idea: 'test idea' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST /api/ai/draft returns 401 with editor role', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'e@e.com', role: 'editor' },
    });
    const { POST } = await import('../../ai/draft/route');
    const req = new NextRequest('http://localhost/api/ai/draft', {
      method: 'POST',
      body: JSON.stringify({ idea: 'test idea' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST /api/ai/draft succeeds with admin role', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'admin@e.com', role: 'admin' },
    });
    const { POST } = await import('../../ai/draft/route');
    const req = new NextRequest('http://localhost/api/ai/draft', {
      method: 'POST',
      body: JSON.stringify({ idea: 'test idea' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  // --- /api/ai/rewrite ---

  it('POST /api/ai/rewrite returns 401 without session', async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import('../../ai/rewrite/route');
    const req = new NextRequest('http://localhost/api/ai/rewrite', {
      method: 'POST',
      body: JSON.stringify({ content: 'test', style: 'beginner' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST /api/ai/rewrite returns 401 with editor role', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'e@e.com', role: 'editor' },
    });
    const { POST } = await import('../../ai/rewrite/route');
    const req = new NextRequest('http://localhost/api/ai/rewrite', {
      method: 'POST',
      body: JSON.stringify({ content: 'test', style: 'beginner' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST /api/ai/rewrite succeeds with admin role', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'admin@e.com', role: 'admin' },
    });
    const { POST } = await import('../../ai/rewrite/route');
    const req = new NextRequest('http://localhost/api/ai/rewrite', {
      method: 'POST',
      body: JSON.stringify({ content: 'test', style: 'beginner' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
