import { NextResponse } from 'next/server';
import { getProviders, createProvider } from '@/lib/ai/provider-registry';
import { createProviderSchema, validateBody } from '@/lib/validation';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth';
import { maskKey } from '@/lib/crypto';

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const providers = await getProviders();
    // §V.41: mask API keys in GET responses (write-only pattern)
    const masked = providers.map((p) => ({
      ...p,
      apiKeySecretRef: maskKey(p.apiKeySecretRef),
    }));
    return NextResponse.json(masked);
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

    return NextResponse.json({ ...provider, apiKeySecretRef: maskKey(provider.apiKeySecretRef) }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
