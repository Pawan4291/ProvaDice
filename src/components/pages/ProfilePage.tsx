'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Nav from '@/components/Nav';
import ParticleBackground from '@/components/ParticleBackground';
import { baseUnitsToUct, UCT_SYMBOL, SPHERE_WALLET_URL } from '@/config/constants';
import { useWallet } from '@/components/SphereWalletProvider';

interface ProfileStats {
  nametag: string;
  totalWins: number;
  totalWonBaseUnits: string;
  totalBetsPlaced: number;
  totalBetBaseUnits: string;
  lastWinAt: string | null;
}

export default function ProfilePage() {
  const { connected, identity, connect, disconnect, connecting, getHistory } = useWallet();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [sphereHistory, setSphereHistory] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connected || !identity?.nametag) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Fetch stats from leaderboard cache
        const lb = await fetch('/api/leaderboard');
        const lbData = await lb.json() as { leaderboard: ProfileStats[] };
        const myStats = lbData.leaderboard.find((e) => e.nametag === identity.nametag);
        if (myStats) setStats(myStats);

        // Fetch real history from Sphere SDK (wallet's actual transfer log)
        const hist = await getHistory();
        setSphereHistory(hist);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [connected, identity, getHistory]);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <ParticleBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Nav />

        <main style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}>
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
              👤 PLAYER PROFILE
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
              {connected ? `@${identity?.nametag}` : 'Your Profile'}
            </h1>
          </motion.div>

          {!connected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-glass"
              style={{ borderRadius: 24, padding: 48, textAlign: 'center' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🌐</div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
                Connect to view profile
              </h2>
              <p style={{ color: '#888', marginBottom: 24, fontSize: '0.9rem', lineHeight: 1.6 }}>
                Your stats are sourced from real Astrid audit log entries — only your Sphere nametag unlocks your data.
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
          ) : (
            <div>
              {/* Identity card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-glass"
                style={{ borderRadius: 24, padding: 32, marginBottom: 24 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      background: 'linear-gradient(135deg, #f97316, #ea6a07)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      boxShadow: '0 0 30px rgba(249,115,22,0.4)',
                      flexShrink: 0,
                    }}
                  >
                    🎲
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f97316', letterSpacing: '-0.02em' }}>
                      @{identity?.nametag}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 4 }}>
                      Sphere Testnet · Connected
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={SPHERE_WALLET_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 16px',
                        borderRadius: 10,
                        border: '1px solid rgba(249,115,22,0.3)',
                        background: 'rgba(249,115,22,0.05)',
                        color: '#f97316',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Open Sphere
                    </a>
                    <button
                      onClick={disconnect}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 10,
                        border: '1px solid rgba(239,68,68,0.3)',
                        background: 'rgba(239,68,68,0.05)',
                        color: '#ef4444',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Stats */}
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ height: 100, background: 'rgba(249,115,22,0.05)', borderRadius: 16, animation: 'pulse 1s infinite' }} />
                  ))}
                </div>
              ) : stats ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}
                >
                  {[
                    { label: 'Total Wins', value: stats.totalWins.toString(), icon: '🏆', color: '#ffd700' },
                    { label: 'UCT Won', value: `${baseUnitsToUct(stats.totalWonBaseUnits).toFixed(4)} ${UCT_SYMBOL}`, icon: '💰', color: '#f97316' },
                    { label: 'Rounds Played', value: stats.totalBetsPlaced.toString(), icon: '🎲', color: '#a855f7' },
                    { label: 'UCT Wagered', value: `${baseUnitsToUct(stats.totalBetBaseUnits).toFixed(4)} ${UCT_SYMBOL}`, icon: '⚡', color: '#06b6d4' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="card-glass"
                      style={{ borderRadius: 16, padding: '20px 24px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                        <span style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          {s.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.color }}>
                        {s.value}
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card-glass"
                  style={{ borderRadius: 16, padding: 32, textAlign: 'center', marginBottom: 24 }}
                >
                  <p style={{ color: '#666' }}>No game stats yet — place your first bet!</p>
                </motion.div>
              )}

              {/* Wallet history from Sphere */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card-glass"
                style={{ borderRadius: 24, padding: 24 }}
              >
                <h3 style={{ fontSize: '0.8rem', color: '#f97316', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                  Sphere Transfer History
                </h3>
                {loading ? (
                  <p style={{ color: '#666', fontSize: '0.85rem' }}>Loading transfer history...</p>
                ) : sphereHistory.length === 0 ? (
                  <p style={{ color: '#555', fontSize: '0.85rem' }}>
                    No transfers found. Your Sphere wallet history will appear here after you place bets.
                  </p>
                ) : (
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {sphereHistory.map((tx, i) => {
                      const t = tx as {
                        id?: string;
                        txId?: string;
                        type?: string;
                        amount?: string;
                        memo?: string;
                        timestamp?: string;
                        counterparty?: string;
                      };
                      return (
                        <div
                          key={t.id ?? t.txId ?? i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 0',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            fontSize: '0.82rem',
                          }}
                        >
                          <div>
                            <code style={{ color: '#666', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                              {(t.id ?? t.txId ?? '').slice(0, 20)}…
                            </code>
                            {t.memo && (
                              <div style={{ color: '#888', fontSize: '0.7rem', marginTop: 2 }}>
                                {t.memo}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {t.amount && (
                              <div style={{ color: '#f97316', fontWeight: 600 }}>
                                {baseUnitsToUct(t.amount).toFixed(4)} {UCT_SYMBOL}
                              </div>
                            )}
                            {t.timestamp && (
                              <div style={{ color: '#555', fontSize: '0.7rem' }}>
                                {new Date(t.timestamp).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Network info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ marginTop: 20, padding: '16px 20px', background: 'rgba(249,115,22,0.03)', borderRadius: 14, border: '1px solid rgba(249,115,22,0.08)' }}
              >
                <div style={{ fontSize: '0.7rem', color: '#555', lineHeight: 1.8 }}>
                  <strong style={{ color: '#888' }}>Network:</strong> Unicity Testnet
                  &nbsp;·&nbsp; <strong style={{ color: '#888' }}>Aggregator:</strong>{' '}
                  <a href="https://goggregator-test.unicity.network/" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316', textDecoration: 'none' }}>
                    goggregator-test.unicity.network
                  </a>
                  &nbsp;·&nbsp; <strong style={{ color: '#888' }}>Faucet:</strong>{' '}
                  <a href="https://faucet.unicity.network/faucet/" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316', textDecoration: 'none' }}>
                    faucet.unicity.network
                  </a>
                </div>
              </motion.div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  );
}
