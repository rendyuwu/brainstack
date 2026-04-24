import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProvider, discoverModels } from '@/lib/ai/provider-registry';
import type { ProviderConfig } from '@/lib/ai/types';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    return null;
  }
  return session;
}

export async function POST(
  _request: Request,
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
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const discovered = await discoverModels(provider as ProviderConfig);
    return NextResponse.json({ success: true, models: discovered });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
