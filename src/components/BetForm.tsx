'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { baseUnitsToUct, UCT_SYMBOL } from '@/config/constants';

interface BetFormProps {
  roundId: string | null;
  totalPotBaseUnits: string;
  onBetSubmitted?: (txId: string, amountBaseUnits: string) => void;
  walletConnected: boolean;
  nametag: string | null;
 onSendBet: (amountBaseUnits: bigint, roundId: string, pickedNumber: number) => Promise<string>;
}

export default function BetForm({
  roundId,
  totalPotBaseUnits,
  onBetSubmitted,
  walletConnected,
  nametag,
  onSendBet,
}: BetFormProps) {
 const [betUCT, setBetUCT] = useState('');
  const [pickedNumber, setPickedNumber] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txId, setTxId] = useState('');

  const currentPotUCT = baseUnitsToUct(totalPotBaseUnits);
  const maxBetUCT = currentPotUCT > 0 ? currentPotUCT * 0.2 : 1000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   if (!walletConnected || !nametag || !roundId) return;

    if (!pickedNumber) {
      setErrorMsg('Pick a number from 1 to 6');
      return;
    }

    const amount = parseFloat(betUCT);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Enter a valid bet amount');
      return;
    }

    // Convert UCT to base units (1 UCT = 1e18 base units)
    const amountBaseUnits = BigInt(Math.floor(amount * 1e9)) * BigInt(1e9);

    setStatus('pending');
    setErrorMsg('');

    try {
      // Send via Sphere wallet
     const sentTxId = await onSendBet(amountBaseUnits, roundId, pickedNumber);
      setTxId(sentTxId);

      // Notify house agent
      const res = await fetch('/api/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
          nametag,
          amountBaseUnits: amountBaseUnits.toString(),
          txId: sentTxId,
          memo: `ProvaDice bet round:${roundId} num:${pickedNumber}`,
          roundId,
          pickedNumber,
        }),
      });

      const data = await res.json() as { accepted?: boolean; reason?: string };

      if (!data.accepted) {
        setStatus('error');
        setErrorMsg(data.reason ?? 'Bet rejected by house agent');
        return;
      }

    setStatus('success');
      onBetSubmitted?.(sentTxId, amountBaseUnits.toString());

      setTimeout(() => {
        setStatus('idle');
        setBetUCT('');
        setPickedNumber(null);
      }, 5000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send bet');
    }
  };

  const quickBets = [0.1, 0.5, 1, 5].filter((v) => v <= maxBetUCT || currentPotUCT === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card-glass"
      style={{ borderRadius: 20, padding: 28 }}
    >
      <h3
        style={{
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          fontWeight: 700,
          color: '#f97316',
          marginBottom: 16,
          textTransform: 'uppercase',
        }}
      >
        Place Your Bet
      </h3>

      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 16 }}>
        Betting as <span style={{ color: '#f97316', fontWeight: 700 }}>@{nametag}</span>
        {currentPotUCT > 0 && (
          <span> · Max bet: <span style={{ color: '#f97316' }}>{maxBetUCT.toFixed(2)} {UCT_SYMBOL}</span></span>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Quick bet buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {quickBets.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setBetUCT(String(v))}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: betUCT === String(v)
                  ? '1px solid #f97316'
                  : '1px solid rgba(249,115,22,0.3)',
                background: betUCT === String(v)
                  ? 'rgba(249,115,22,0.2)'
                  : 'rgba(249,115,22,0.05)',
                color: betUCT === String(v) ? '#f97316' : '#888',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {v} {UCT_SYMBOL}
            </button>
          ))}
        </div>

      {pickedNumber && (
          <div style={{ fontSize: '0.85rem', color: '#f97316', fontWeight: 700, marginBottom: 8 }}>
            Your pick: {pickedNumber}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPickedNumber(n)}
              disabled={status === 'pending'}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 8,
                border: pickedNumber === n ? '1px solid #f97316' : '1px solid rgba(249,115,22,0.3)',
                background: pickedNumber === n ? 'rgba(249,115,22,0.2)' : 'rgba(249,115,22,0.05)',
                color: pickedNumber === n ? '#f97316' : '#888',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <input
            type="number"
            value={betUCT}
            onChange={(e) => setBetUCT(e.target.value)}
            placeholder={`Amount in ${UCT_SYMBOL}`}
            min="0.001"
            step="0.001"
            max={maxBetUCT > 0 ? maxBetUCT : undefined}
            disabled={status === 'pending'}
          />
        </div>

        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: '0.8rem',
                color: '#ef4444',
                marginBottom: 12,
              }}
            >
              ⚠️ {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: '0.8rem',
                color: '#22c55e',
                marginBottom: 12,
                wordBreak: 'break-all',
              }}
            >
              ✅ Bet confirmed! TX: {txId.slice(0, 20)}...
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
         disabled={!roundId || status === 'pending' || !betUCT || !pickedNumber}
          whileHover={roundId && status !== 'pending' && betUCT ? { scale: 1.02 } : {}}
          whileTap={roundId && status !== 'pending' && betUCT ? { scale: 0.98 } : {}}
          className="btn-orange"
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            fontSize: '1rem',
            letterSpacing: '0.03em',
            opacity: (!roundId || status === 'pending' || !betUCT) ? 0.5 : 1,
          }}
        >
          {status === 'pending' ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
              Sending via Sphere...
            </span>
          ) : (
            `🎲 Place Bet`
          )}
        </motion.button>
      </form>

      <p
        style={{
          fontSize: '0.7rem',
          color: '#555',
          marginTop: 12,
          textAlign: 'center',
        }}
      >
        Bets verified from real on-chain transfers only. Win chance = your bet ÷ total pot.
      </p>
    </motion.div>
  );
}
