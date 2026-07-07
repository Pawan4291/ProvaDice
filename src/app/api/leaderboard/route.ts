import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leaderboardCache } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(leaderboardCache)
      .orderBy(desc(leaderboardCache.totalWins), desc(sql`${leaderboardCache.totalWonBaseUnits}::numeric`))
      .limit(50);

    return NextResponse.json({
      leaderboard: rows.map((r) => ({
        nametag: r.nametag,
        totalWins: r.totalWins,
        totalWonBaseUnits: r.totalWonBaseUnits,
        totalBetsPlaced: r.totalBetsPlaced,
        totalBetBaseUnits: r.totalBetBaseUnits,
        lastWinAt: r.lastWinAt,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (err) {
    console.error('[leaderboard] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
