/**
 * Clock endpoint — triggers the round lifecycle tick
 * Called periodically by the frontend's polling mechanism (or a cron job)
 * This is the heartbeat that drives round open/settle/cancel
 */

import { NextResponse } from 'next/server';
import { tickClock, initRoundClock } from '@/lib/roundClock';

export const dynamic = 'force-dynamic';

let clockBooted = false;

export async function GET() {
  try {
    if (!clockBooted) {
      clockBooted = true;
      await initRoundClock();
    }

    const result = await tickClock();
    return NextResponse.json({ ok: true, ...result, ts: new Date().toISOString() });
  } catch (err) {
    console.error('[clock] Error:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
