import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mockAuth = vi.fn();
const mockValidateBody = vi.fn();
const mockHybridSearch = vi.fn();
const mockGetPageChunks = vi.fn();

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
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
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
  chatWithFallback: vi.fn().mockImplementation(async () => ({
    stream: (async function* () {
      yield { choices: [{ delta: { content: 'test' } }] };
    })(),
    provider: { id: 'p1' },
    modelId: 'm1',
  })),
}));

vi.mock('@/lib/rag/search', () => ({
  hybridSearch: mockHybridSearch,
  getPageChunks: mockGetPageChunks,
}));

vi.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
}));

vi.mock('@/lib/ai/usage-logger', () => ({
  logAIUsage: vi.fn(),
}));

vi.mock('@/lib/validation', () => ({
  chatSchema: {},
  validateBody: mockValidateBody,
}));

vi.mock('@/lib/content-snippet', () => ({
  contentSnippet: vi.fn().mockReturnValue('snippet'),
}));

// §V.35: AI chat requires admin role
describe('Chat admin guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateBody.mockReturnValue({
      success: true,
      data: { message: 'test', scopeType: 'site' },
    });
    mockHybridSearch.mockResolvedValue([]);
    mockGetPageChunks.mockResolvedValue([]);
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
    expect(res.status).not.toBe(401);
  });

  it('POST /api/chat returns 400 for page scope without scopeId', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'admin@e.com', role: 'admin' },
    });
    mockValidateBody.mockReturnValue({
      success: true,
      data: {
        message: 'What is this post about?',
        scopeType: 'page',
      },
    });

    const { POST } = await import('../../chat/route');
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'What is this post about?', scopeType: 'page' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('scopeId is required for scoped chat');
    expect(mockGetPageChunks).not.toHaveBeenCalled();
    expect(mockHybridSearch).not.toHaveBeenCalled();
  });

  it('POST /api/chat loads page chunks directly for page scope', async () => {
    const pageId = '00000000-0000-0000-0000-000000000001';
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'admin@e.com', role: 'admin' },
    });
    mockValidateBody.mockReturnValue({
      success: true,
      data: {
        message: 'What is this post about?',
        scopeType: 'page',
        scopeId: pageId,
      },
    });
    mockGetPageChunks.mockResolvedValue([
      {
        chunkId: 'chunk-1',
        pageId,
        pageTitle: 'Docker Compose',
        pageSlug: 'docker-compose',
        anchorId: 'intro',
        headingPath: ['Intro'],
        content: 'Docker Compose runs multi-container apps.',
        score: 1,
      },
    ]);

    const { POST } = await import('../../chat/route');
    const { chatWithFallback } = await import('@/lib/ai/find-chat-model');
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'What is this post about?', scopeType: 'page', scopeId: pageId }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    await res.text();

    expect(res.status).toBe(200);
    expect(mockGetPageChunks).toHaveBeenCalledWith(pageId);
    expect(mockHybridSearch).not.toHaveBeenCalled();
    expect(chatWithFallback).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'user',
          content: expect.stringContaining('Docker Compose runs multi-container apps.'),
        }),
      ])
    );
  });
});
