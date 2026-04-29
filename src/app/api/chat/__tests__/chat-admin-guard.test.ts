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

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'conv-1' }]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}));

vi.mock('@/db/schema', () => ({
  conversations: {},
  messages: {},
}));

vi.mock('@/lib/ai/find-chat-model', () => ({
  chatWithFallback: vi.fn().mockResolvedValue({
    stream: (async function* () {
      yield { choices: [{ delta: { content: 'test' } }] };
    })(),
    provider: { id: 'p1' },
    modelId: 'm1',
  }),
}));

vi.mock('@/lib/rag/search', () => ({
  hybridSearch: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
}));

vi.mock('@/lib/ai/usage-logger', () => ({
  logAIUsage: vi.fn(),
}));

vi.mock('@/lib/validation', () => ({
  chatSchema: {},
  validateBody: vi.fn().mockReturnValue({
    success: true,
    data: { message: 'test', scopeType: 'site' },
  }),
}));

vi.mock('@/lib/content-snippet', () => ({
  contentSnippet: vi.fn().mockReturnValue('snippet'),
}));

// §V.35: AI chat requires admin role
describe('Chat admin guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/chat returns 401 without session', async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import('../../chat/route');
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST /api/chat returns 401 with non-admin role', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'e@e.com', role: 'editor' },
    });
    const { POST } = await import('../../chat/route');
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST /api/chat succeeds with admin role', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'admin@e.com', role: 'admin' },
    });
    const { POST } = await import('../../chat/route');
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    // Should not be 401 — either 200 (streaming) or other non-auth error
    expect(res.status).not.toBe(401);
  });
});
