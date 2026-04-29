import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { setupSchema, validateBody } from '@/lib/validation';

async function adminExists(): Promise<boolean> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, 'admin'))
    .limit(1);
  return !!row;
}

/**
 * §V.42: GET no longer reveals whether admin exists.
 * Returns generic status only.
 */
export async function GET() {
  return NextResponse.json({ status: 'ready' });
}

/**
 * §V.42: POST is atomic — returns 403 after first admin exists.
 * Uses transaction with re-check inside to prevent race with different emails.
 */
export async function POST(request: Request) {
  if (await adminExists()) {
    return NextResponse.json(
      { error: 'Setup is not available' },
      { status: 403 },
    );
  }

  const body = await request.json();
  const v = validateBody(setupSchema, body);
  if (!v.success) return v.response;
  const { email, password, name } = v.data;

  const passwordHash = await hash(password, 12);

  try {
    let created = false;

    await db.transaction(async (tx) => {
      // Re-check inside transaction — prevents race with different emails
      const [existing] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'admin'))
        .limit(1);

      if (existing) {
        // Admin already created by concurrent request
        created = false;
        return;
      }

      await tx.insert(users).values({
        email,
        passwordHash,
        name,
        role: 'admin',
      });
      created = true;
    });

    if (!created) {
      return NextResponse.json(
        { error: 'Setup is not available' },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    // Unique email constraint — secondary guard
    if (msg.includes('unique')) {
      return NextResponse.json(
        { error: 'Setup is not available' },
        { status: 403 },
      );
    }
    throw err;
  }
}
