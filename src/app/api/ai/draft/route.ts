import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth';
import { generateDraft } from '@/lib/ai/draft';
import { checkRateLimit } from '@/lib/rate-limiter';
import { aiDraftSchema, validateBody } from '@/lib/validation';

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
    const v = validateBody(aiDraftSchema, body);
    if (!v.success) return v.response;
    const { idea, imageUrl } = v.data;

    const stream = await generateDraft(idea, { imageUrl });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('POST /api/ai/draft error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate draft';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
