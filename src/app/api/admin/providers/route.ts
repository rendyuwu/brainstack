import { NextResponse } from 'next/server';
import { getProviders, createProvider } from '@/lib/ai/provider-registry';
import { createProviderSchema, validateBody } from '@/lib/validation';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth';

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

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
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const v = validateBody(createProviderSchema, body);
    if (!v.success) return v.response;
    const { label, kind, baseUrl, apiKeySecretRef, defaultHeaders, discoveryMode, enabled } = v.data;

    const provider = await createProvider({
      label,
      kind,
      baseUrl,
      apiKeySecretRef: apiKeySecretRef ?? null,
      defaultHeaders: defaultHeaders ?? null,
      discoveryMode,
      enabled,
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
