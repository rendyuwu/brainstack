import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/db', () => {
  const insertReturning = vi.fn().mockResolvedValue([{
    id: 'page-1',
    title: 'Test',
    slug: 'test',
    status: 'draft',
  }]);
  const insertValues = vi.fn().mockReturnValue({ returning: insertReturning });
  const insertFn = vi.fn().mockReturnValue({ values: insertValues });
  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      insert: insertFn,
    },
  };
});

vi.mock('@/db/schema', () => ({
  pages: {},
  pageTags: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  desc: vi.fn(),
  and: vi.fn(),
  SQL: class {},
}));

vi.mock('@/lib/slugify', () => ({
  uniqueSlug: vi.fn().mockResolvedValue('test-slug'),
}));

describe('pages auth guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/pages works without auth (public)', async () => {
    mockAuth.mockResolvedValue(null);
    const { GET } = await import('../../pages/route');
    const req = new NextRequest('http://localhost/api/pages');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('GET /api/pages rejects invalid status filter', async () => {
    const { GET } = await import('../../pages/route');
    const req = new NextRequest('http://localhost/api/pages?status=nope');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('GET /api/pages rejects invalid type filter', async () => {
    const { GET } = await import('../../pages/route');
    const req = new NextRequest('http://localhost/api/pages?type=nope');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('POST /api/pages returns 401 without session', async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import('../../pages/route');
    const req = new NextRequest('http://localhost/api/pages', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Page' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST /api/pages succeeds with valid session', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'e@e.com', role: 'editor' },
    });
    const { POST } = await import('../../pages/route');
    const req = new NextRequest('http://localhost/api/pages', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Page' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('POST /api/pages rejects invalid type', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'e@e.com', role: 'editor' },
    });
    const { POST } = await import('../../pages/route');
    const req = new NextRequest('http://localhost/api/pages', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Page', type: 'invalid' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST /api/pages returns 400 without title', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'e@e.com', role: 'editor' },
    });
    const { POST } = await import('../../pages/route');
    const req = new NextRequest('http://localhost/api/pages', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Title');
  });
});
