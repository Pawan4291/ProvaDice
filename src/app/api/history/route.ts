import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bets, rounds } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nametag = searchParams.get('nametag');

    if (!nametag) {
      return NextResponse.json({ error: 'nametag query param required' }, { status: 400 });
    }

    const userBets = await db
      .select({
        roundId: bets.roundId,
        amountBaseUnits: bets.amountBaseUnits,
        txId: bets.txId,
        confirmedAt: bets.confirmedAt,
        refunded: bets.refunded,
        refundTxId: bets.refundTxId,
        memo: bets.memo,
        // Round info
        roundStatus: rounds.status,
        winnerNametag: rounds.winnerNametag,
        totalPot: rounds.totalPotBaseUnits,
        payoutTxId: rounds.payoutTxId,
        commitHash: rounds.commitHash,
        finalHash: rounds.finalHash,
      })
      .from(bets)
      .leftJoin(rounds, eq(bets.roundId, rounds.roundId))
      .where(eq(bets.nametag, nametag))
      .orderBy(desc(bets.confirmedAt))
      .limit(100);

    const history = userBets.map((row) => ({
      roundId: row.roundId,
      amountBaseUnits: row.amountBaseUnits,
      txId: row.txId,
      confirmedAt: row.confirmedAt,
      refunded: row.refunded,
      refundTxId: row.refundTxId,
      memo: row.memo,
      round: {
        status: row.roundStatus,
        winnerNametag: row.winnerNametag,
        totalPotBaseUnits: row.totalPot,
        payoutTxId: row.payoutTxId,
        commitHash: row.commitHash,
        finalHash: row.finalHash,
        won: row.winnerNametag === nametag,
      },
    }));

    return NextResponse.json({ nametag, history });
  } catch (err) {
    console.error('[history] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
