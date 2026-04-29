import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
  requireAdmin: async () => {
    const session = await mockAuth();
    const user = session?.user as { id?: string; role?: string } | undefined;
    if (!user?.id || user.role !== 'admin') return null;
    return session;
  },
  unauthorizedResponse: () =>
    NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
}));

vi.mock('@/lib/ai/provider-registry', () => ({
  getProviders: vi.fn().mockResolvedValue([
    { id: 'p1', label: 'Test Provider' },
  ]),
  createProvider: vi.fn().mockResolvedValue({
    id: 'p2',
    label: 'New Provider',
  }),
}));

describe('admin providers auth guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 401 when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const { GET } = await import('../../admin/providers/route');
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('GET returns 401 when role is not admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'e@e.com', role: 'editor' },
    });
    const { GET } = await import('../../admin/providers/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET returns providers when admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'admin@e.com', role: 'admin' },
    });
    const { GET } = await import('../../admin/providers/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].label).toBe('Test Provider');
  });

  it('POST returns 401 when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import('../../admin/providers/route');
    const req = new Request('http://localhost/api/admin/providers', {
      method: 'POST',
      body: JSON.stringify({ label: 'X', kind: 'openai_compatible', baseUrl: 'http://x' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST returns 401 when role is editor', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'e@e.com', role: 'editor' },
    });
    const { POST } = await import('../../admin/providers/route');
    const req = new Request('http://localhost/api/admin/providers', {
      method: 'POST',
      body: JSON.stringify({ label: 'X', kind: 'openai_compatible', baseUrl: 'http://x' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST creates provider when admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'admin@e.com', role: 'admin' },
    });
    const { POST } = await import('../../admin/providers/route');
    const req = new Request('http://localhost/api/admin/providers', {
      method: 'POST',
      body: JSON.stringify({ label: 'New', kind: 'openai_compatible', baseUrl: 'http://new' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('POST rejects invalid provider kind', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'admin@e.com', role: 'admin' },
    });
    const { POST } = await import('../../admin/providers/route');
    const req = new Request('http://localhost/api/admin/providers', {
      method: 'POST',
      body: JSON.stringify({ label: 'New', kind: 'bad', baseUrl: 'http://new' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST rejects invalid discovery mode', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'admin@e.com', role: 'admin' },
    });
    const { POST } = await import('../../admin/providers/route');
    const req = new Request('http://localhost/api/admin/providers', {
      method: 'POST',
      body: JSON.stringify({ label: 'New', kind: 'openai_compatible', baseUrl: 'http://new', discoveryMode: 'bad' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
