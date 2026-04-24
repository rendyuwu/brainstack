import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateDraft } from '@/lib/ai/draft';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const rateCheck = checkRateLimit(request, 10, 60_000);
  if (!rateCheck.allowed) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': String(rateCheck.retryAfter) },
    });
  }

  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { idea, imageUrl } = body as {
      idea?: string;
      imageUrl?: string;
    };

    if (!idea || typeof idea !== 'string' || !idea.trim()) {
      return NextResponse.json(
        { error: 'idea is required' },
        { status: 400 }
      );
    }

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
