import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth';
import { rewriteContent, type RewriteStyle } from '@/lib/ai/rewrite';
import { checkRateLimit } from '@/lib/rate-limiter';
import { aiRewriteSchema, validateBody } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const rateCheck = checkRateLimit(request, 10, 60_000);
  if (!rateCheck.allowed) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': String(rateCheck.retryAfter) },
    });
  }

  try {
    // §V.35: AI features require admin role
    const session = await requireAdmin();
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const v = validateBody(aiRewriteSchema, body);
    if (!v.success) return v.response;
    const { content, style } = v.data;

    const stream = await rewriteContent(content, style as RewriteStyle);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('POST /api/ai/rewrite error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to rewrite content';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
