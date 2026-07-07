'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Nav from '@/components/Nav';
import ParticleBackground from '@/components/ParticleBackground';
import { baseUnitsToUct, UCT_SYMBOL } from '@/config/constants';
import { useWallet } from '@/components/SphereWalletProvider';

interface HistoryEntry {
  roundId: string;
  amountBaseUnits: string;
  txId: string;
  confirmedAt: string;
  refunded: boolean;
  refundTxId: string | null;
  memo: string | null;
  round: {
    status: string | null;
    winnerNametag: string | null;
    totalPotBaseUnits: string | null;
    payoutTxId: string | null;
    commitHash: string | null;
    finalHash: string | null;
    won: boolean;
  };
}

export default function HistoryPage() {
  const { connected, identity, connect, connecting } = useWallet();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !identity?.nametag) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/history?nametag=${encodeURIComponent(identity.nametag)}`);
        const data = await res.json() as { history: HistoryEntry[] };
        setHistory(data.history);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [connected, identity]);

  const wins = history.filter((h) => h.round.won && h.round.status === 'settled');
  const totalBet = history.reduce((s, h) => s + parseFloat(h.amountBaseUnits), 0);
  const totalWon = wins.reduce((s, h) => {
    const pot = parseFloat(h.round.totalPotBaseUnits ?? '0');
    return s + pot * 0.98; // after 2% house fee
  }, 0);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <ParticleBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Nav />

        <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 40 }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(249,115,22,0.1)',
                border: '1px solid rgba(249,115,22,0.3)',
                borderRadius: 20,
                padding: '6px 16px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#f97316',
                letterSpacing: '0.1em',
                marginBottom: 16,
              }}
            >
              📜 GAME HISTORY
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>
              Round History
            </h1>
            <p style={{ color: '#888', fontSize: '0.95rem' }}>
              Your complete betting history filtered from real Sphere transfer records.
            </p>
          </motion.div>

          {!connected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-glass"
              style={{ borderRadius: 24, padding: 48, textAlign: 'center' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔐</div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
                Connect wallet to view history
              </h2>
              <p style={{ color: '#888', marginBottom: 24, fontSize: '0.9rem' }}>
                Your history is filtered from real on-chain transfers using your nametag.
              </p>
              <motion.button
                onClick={connect}
                disabled={connecting}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-orange"
                style={{ padding: '14px 32px', borderRadius: 12, fontSize: '1rem', fontWeight: 700 }}
              >
                {connecting ? 'Connecting...' : '🌐 Connect Sphere Wallet'}
              </motion.button>
            </motion.div>
          ) : loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 90,
                    background: 'rgba(249,115,22,0.05)',
                    borderRadius: 16,
                    animation: 'pulse 1s infinite',
                  }}
                />
              ))}
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#ef4444' }}>
              <p>⚠️ {error}</p>
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#666' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎲</div>
              <h3 style={{ fontSize: '1.3rem', color: '#888', marginBottom: 8 }}>No rounds yet</h3>
              <p>Place your first bet to start your history!</p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 12,
                  marginBottom: 32,
                }}
              >
                {[
                  { label: 'Rounds Played', value: history.length.toString() },
                  { label: 'Wins', value: wins.length.toString() },
                  { label: 'Total Bet', value: `${baseUnitsToUct(Math.floor(totalBet).toString()).toFixed(2)} ${UCT_SYMBOL}` },
                  { label: 'Total Won', value: `${baseUnitsToUct(Math.floor(totalWon).toString()).toFixed(2)} ${UCT_SYMBOL}` },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="card-glass"
                    style={{ borderRadius: 14, padding: '16px', textAlign: 'center' }}
                  >
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f97316', marginBottom: 4 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* History entries */}
              {history.map((entry, i) => (
                <motion.div
                  key={`${entry.roundId}-${entry.txId}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card-glass"
                  style={{
                    borderRadius: 16,
                    padding: '18px 24px',
                    marginBottom: 10,
                    borderLeft: `3px solid ${
                      entry.round.won ? '#22c55e' :
                      entry.refunded ? '#06b6d4' : '#333'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {entry.round.won ? '🏆' : entry.refunded ? '↩️' : '🎲'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: entry.round.won
                              ? 'rgba(34,197,94,0.1)'
                              : entry.refunded
                              ? 'rgba(6,182,212,0.1)'
                              : 'rgba(255,255,255,0.05)',
                            color: entry.round.won ? '#22c55e' : entry.refunded ? '#06b6d4' : '#888',
                            border: `1px solid ${entry.round.won ? 'rgba(34,197,94,0.3)' : entry.refunded ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          {entry.round.won ? 'WON' : entry.refunded ? 'REFUNDED' : entry.round.status?.toUpperCase() ?? 'UNKNOWN'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#555', fontFamily: 'monospace', marginBottom: 4 }}>
                        Round: {entry.roundId}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#555' }}>
                        {new Date(entry.confirmedAt).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f97316', marginBottom: 4 }}>
                        {baseUnitsToUct(entry.amountBaseUnits).toFixed(4)} {UCT_SYMBOL}
                      </div>
                      {entry.round.totalPotBaseUnits && (
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          Pot: {baseUnitsToUct(entry.round.totalPotBaseUnits).toFixed(2)} {UCT_SYMBOL}
                        </div>
                      )}
                      {entry.txId && (
                        <code style={{ fontSize: '0.65rem', color: '#555', fontFamily: 'monospace' }}>
                          tx: {entry.txId.slice(0, 16)}…
                        </code>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </main>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  );
}
