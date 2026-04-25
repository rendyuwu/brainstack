import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';

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
  const { email, password, name } = body as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: 'Name, email, and password are required' },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 },
    );
  }

  const passwordHash = await hash(password, 12);

  await db.insert(users).values({
    email,
    passwordHash,
    name,
    role: 'admin',
  });

  return NextResponse.json({ success: true });
}
