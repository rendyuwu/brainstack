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

export async function GET() {
  const exists = await adminExists();
  return NextResponse.json({ needsSetup: !exists });
}

export async function POST(request: Request) {
  if (await adminExists()) {
    return NextResponse.json(
      { error: 'Admin account already exists' },
      { status: 403 },
    );
  }

  const body = await request.json();
  const v = validateBody(setupSchema, body);
  if (!v.success) return v.response;
  const { email, password, name } = v.data;

  const passwordHash = await hash(password, 12);

  await db.insert(users).values({
    email,
    passwordHash,
    name,
    role: 'admin',
  });

  return NextResponse.json({ success: true });
}
