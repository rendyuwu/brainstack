import { NextResponse } from 'next/server';
import {
  getProvider,
  updateProvider,
  deleteProvider,
} from '@/lib/ai/provider-registry';
import { updateProviderSchema, validateBody } from '@/lib/validation';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth';
import { isValidUUID } from '@/lib/uuid';
import { maskKey } from '@/lib/crypto';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const provider = await getProvider(id);
    if (!provider) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    // §V.41: mask API key in GET response
    return NextResponse.json({ ...provider, apiKeySecretRef: maskKey(provider.apiKeySecretRef) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const v = validateBody(updateProviderSchema, body);
    if (!v.success) return v.response;

    const updated = await updateProvider(id, v.data);
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const deleted = await deleteProvider(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
