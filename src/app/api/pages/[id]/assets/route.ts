import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import { deleteAssetSchema, validateBody } from '@/lib/validation';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

const MAX_SIZE = 5 * 1024 * 1024;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const rows = await db
      .select()
      .from(assets)
      .where(eq(assets.pageId, id));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET /api/pages/[id]/assets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const altText = formData.get('altText') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: jpg, png, gif, webp, svg' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Max 5MB' },
        { status: 400 }
      );
    }

    const ext = EXT_MAP[file.type] || 'bin';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, filename), buffer);

    const [created] = await db
      .insert(assets)
      .values({
        pageId: id,
        kind: 'image',
        storageUrl: `/uploads/${filename}`,
        altText: altText || null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /api/pages/[id]/assets error:', error);
    return NextResponse.json(
      { error: 'Failed to upload asset' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const v = validateBody(deleteAssetSchema, body);
    if (!v.success) return v.response;
    const { assetId } = v.data;

    const [asset] = await db
      .select()
      .from(assets)
      .where(and(eq(assets.id, assetId), eq(assets.pageId, id)))
      .limit(1);

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const filePath = join(process.cwd(), 'public', asset.storageUrl);
    try {
      await unlink(filePath);
    } catch {
      // file already gone — proceed with DB cleanup
    }

    await db.delete(assets).where(eq(assets.id, assetId));

    return NextResponse.json({ deleted: assetId });
  } catch (error) {
    console.error('DELETE /api/pages/[id]/assets error:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}
