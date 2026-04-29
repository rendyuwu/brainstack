import { NextResponse } from 'next/server';
import { getProvider, discoverModels } from '@/lib/ai/provider-registry';
import type { ProviderConfig } from '@/lib/ai/types';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

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
