'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Nav from '@/components/Nav';
import ParticleBackground from '@/components/ParticleBackground';
import LeaderboardRow from '@/components/LeaderboardRow';
import { baseUnitsToUct, UCT_SYMBOL } from '@/config/constants';

interface LeaderboardEntry {
  nametag: string;
  totalWins: number;
  totalWonBaseUnits: string;
  totalBetsPlaced: number;
  totalBetBaseUnits: string;
  lastWinAt: string | null;
  updatedAt: string;
}

export default function RanksPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json() as { leaderboard: LeaderboardEntry[] };
        setLeaderboard(data.leaderboard);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 15000);
    return () => clearInterval(interval);
  }, []);

  const totalPrizePool = leaderboard.reduce(
    (sum, e) => sum + parseFloat(e.totalWonBaseUnits || '0'),
    0
  );

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <ParticleBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Nav />

        <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
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
              🏆 LEADERBOARD
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>
              Top Players
            </h1>
            <p style={{ color: '#888', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Rankings derived live from the Astrid audit log payout entries.
              No separate scores database — every number traces to a real settlement.
            </p>
          </motion.div>

          {/* Stats banner */}
          {!loading && leaderboard.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
                marginBottom: 32,
              }}
            >
              {[
                { label: 'Total Players', value: leaderboard.length.toString() },
                { label: 'Total UCT Paid Out', value: `${baseUnitsToUct(Math.floor(totalPrizePool).toString()).toFixed(2)} ${UCT_SYMBOL}` },
                { label: 'Top Win Streak', value: leaderboard[0]?.totalWins.toString() ?? '0' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="card-glass"
                  style={{ borderRadius: 16, padding: '20px 24px', textAlign: 'center' }}
                >
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f97316', marginBottom: 4 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Leaderboard */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 70,
                    background: 'rgba(249,115,22,0.05)',
                    borderRadius: 12,
                    animation: 'pulse 1s infinite',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#ef4444' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
              <p>{error}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '80px 0', color: '#666' }}
            >
              <div style={{ fontSize: '4rem', marginBottom: 20 }}>🎲</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8, color: '#888' }}>
                No winners yet
              </h3>
              <p style={{ fontSize: '0.9rem' }}>
                Be the first to win a round and claim the top spot!
              </p>
            </motion.div>
          ) : (
            <div>
              {leaderboard.map((entry, i) => (
                <LeaderboardRow
                  key={entry.nametag}
                  rank={i + 1}
                  nametag={entry.nametag}
                  totalWins={entry.totalWins}
                  totalWonBaseUnits={entry.totalWonBaseUnits}
                  totalBetsPlaced={entry.totalBetsPlaced}
                  lastWinAt={entry.lastWinAt}
                  index={i}
                />
              ))}
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
