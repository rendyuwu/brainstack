import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProvider, addManualModel, testModel } from '@/lib/ai/provider-registry';
import type { ProviderConfig } from '@/lib/ai/types';
import { addModelSchema, validateBody } from '@/lib/validation';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    return null;
  }
  return session;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const provider = await getProvider(id);
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const body = await request.json();
    const v = validateBody(addModelSchema, body);
    if (!v.success) return v.response;
    const { modelId, supportsChat, supportsEmbeddings, supportsVision, supportsResponses, contextLength, test } = v.data;

    if (test) {
      const testResult = await testModel(provider as ProviderConfig, modelId.trim());
      if (!testResult.success) {
        return NextResponse.json(
          { success: false, error: testResult.error },
          { status: 422 },
        );
      }
    }

    const model = await addManualModel(id, {
      modelId: modelId.trim(),
      supportsChat: supportsChat ?? true,
      supportsEmbeddings: supportsEmbeddings ?? false,
      supportsVision: supportsVision ?? false,
      supportsResponses: supportsResponses ?? false,
      contextLength: contextLength ?? null,
    });

    return NextResponse.json({ success: true, model }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
