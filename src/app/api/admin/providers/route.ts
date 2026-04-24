import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProviders, createProvider } from '@/lib/ai/provider-registry';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const providers = await getProviders();
    return NextResponse.json(providers);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const { label, kind, baseUrl } = body;
    if (!label || !kind || !baseUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: label, kind, baseUrl' },
        { status: 400 },
      );
    }

    const validKinds = ['openai_compatible', 'openrouter', 'litellm_proxy'];
    if (!validKinds.includes(kind)) {
      return NextResponse.json(
        { error: `Invalid kind. Must be one of: ${validKinds.join(', ')}` },
        { status: 400 },
      );
    }

    const provider = await createProvider({
      label,
      kind,
      baseUrl,
      apiKeySecretRef: body.apiKeySecretRef ?? null,
      defaultHeaders: body.defaultHeaders ?? null,
      discoveryMode: body.discoveryMode ?? 'v1-models',
      enabled: body.enabled ?? true,
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
