import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Round ticking now runs on the separate Astrid agent (Render).
  // This endpoint is read-only, just confirms the API is alive.
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}