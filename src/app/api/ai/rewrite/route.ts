import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rewriteContent, type RewriteStyle } from '@/lib/ai/rewrite';
import { checkRateLimit } from '@/lib/rate-limiter';

const VALID_STYLES: RewriteStyle[] = ['cheatsheet', 'beginner', 'advanced'];

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
    const { content, style } = body as {
      content?: string;
      style?: string;
    };

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }

    if (!style || !VALID_STYLES.includes(style as RewriteStyle)) {
      return NextResponse.json(
        { error: `style must be one of: ${VALID_STYLES.join(', ')}` },
        { status: 400 }
      );
    }

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
