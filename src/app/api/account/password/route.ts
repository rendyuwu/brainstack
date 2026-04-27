import { NextResponse } from 'next/server';
import { compare, hash } from 'bcryptjs';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { changePasswordSchema, validateBody } from '@/lib/validation';

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validation = validateBody(changePasswordSchema, body);
    if (!validation.success) return validation.response;

    const { currentPassword, newPassword } = validation.data;
    const userId = session.user!.id!;

    // Fetch current password hash
    const [user] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Password change failed' },
        { status: 400 },
      );
    }

    // V28: verify current password before update
    const isCurrentValid = await compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Password change failed' },
        { status: 400 },
      );
    }

    // V29: new password must differ from current
    const isSamePassword = await compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'Password change failed' },
        { status: 400 },
      );
    }

    // V22: hash with bcryptjs, salt rounds 12
    const newHash = await hash(newPassword, 12);

    await db
      .update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Password change failed' },
      { status: 500 },
    );
  }
}
