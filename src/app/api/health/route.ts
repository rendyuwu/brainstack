import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  let dbStatus: 'connected' | 'error' = 'error';

  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = 'connected';
  } catch {
    // DB unreachable — leave as 'error'
  }

  const healthy = dbStatus === 'connected';
  const body = {
    status: healthy ? 'ok' : 'degraded',
    db: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}
