/**
 * Bet endpoint — called by frontend after user sends UCT via Sphere wallet
 * 
 * The frontend sends a bet intent via the Sphere Connect protocol.
 * After the transfer is confirmed on-chain, the frontend calls this endpoint
 * to notify the house agent about the transfer (with txId for verification).
 * 
 * The house agent also independently sees the transfer via subscribeToIncoming,
 * so this endpoint is a secondary notification path — the real bet is recorded
 * when the actual transfer arrives, not when this endpoint is called.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processManualBet } from '@/lib/roundClock';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
   const body = await req.json() as {
      nametag?: string;
      amountBaseUnits?: string;
      txId?: string;
      memo?: string;
      roundId?: string;
      pickedNumber?: number;
    };

    const { nametag, amountBaseUnits, txId, memo, pickedNumber } = body;

    if (!nametag || !amountBaseUnits || !txId) {
      return NextResponse.json(
        { error: 'Missing required fields: nametag, amountBaseUnits, txId' },
        { status: 400 }
      );
    }

    if (!pickedNumber || pickedNumber < 1 || pickedNumber > 6) {
      return NextResponse.json({ error: 'pickedNumber must be 1-6' }, { status: 400 });
    }

    // Validate amount is a valid bigint string
    let amount: bigint;
    try {
      amount = BigInt(amountBaseUnits);
    } catch {
      return NextResponse.json({ error: 'Invalid amountBaseUnits' }, { status: 400 });
    }

    if (amount <= BigInt(0)) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

   const result = await processManualBet(nametag, amount, txId, memo ?? '', pickedNumber);

    if (!result.accepted) {
      return NextResponse.json({ accepted: false, reason: result.reason }, { status: 422 });
    }

    return NextResponse.json({ accepted: true });
  } catch (err) {
    console.error('[bet] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
