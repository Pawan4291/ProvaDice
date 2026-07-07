import { NextResponse } from 'next/server';
import { getCurrentRoundState } from '@/lib/roundManager';
import { getRecentRounds } from '@/lib/roundManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const state = await getCurrentRoundState();
    const recentRounds = await getRecentRounds(5);

    return NextResponse.json({
      currentRound: state,
      recentRounds: recentRounds.map((r) => ({
        roundId: r.roundId,
        status: r.status,
        startTime: r.startTime,
        endTime: r.endTime,
        commitHash: r.commitHash,
        revealSeed: r.revealSeed,
        finalHash: r.finalHash,
        winnerNametag: r.winnerNametag,
        totalPotBaseUnits: r.totalPotBaseUnits,
        playerCount: r.playerCount,
        payoutTxId: r.payoutTxId,
      })),
    });
  } catch (err) {
    console.error('[round-status] Error:', err);
    return NextResponse.json(
      { error: 'Failed to get round status' },
      { status: 500 }
    );
  }
}
