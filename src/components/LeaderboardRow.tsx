'use client';

import { motion } from 'framer-motion';
import { baseUnitsToUct, UCT_SYMBOL } from '@/config/constants';

interface LeaderboardRowProps {
  rank: number;
  nametag: string;
  totalWins: number;
  totalWonBaseUnits: string;
  totalBetsPlaced: number;
  lastWinAt: string | Date | null;
  index: number;
}

const RANK_STYLES: Record<number, { icon: string; color: string; glow: string }> = {
  1: { icon: '🥇', color: '#ffd700', glow: 'rgba(255,215,0,0.4)' },
  2: { icon: '🥈', color: '#c0c0c0', glow: 'rgba(192,192,192,0.3)' },
  3: { icon: '🥉', color: '#cd7f32', glow: 'rgba(205,127,50,0.3)' },
};

export default function LeaderboardRow({
  rank,
  nametag,
  totalWins,
  totalWonBaseUnits,
  totalBetsPlaced,
  lastWinAt,
  index,
}: LeaderboardRowProps) {
  const style = RANK_STYLES[rank];
  const wonUCT = baseUnitsToUct(totalWonBaseUnits);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 20px',
        background: rank <= 3 ? `rgba(${style?.color === '#ffd700' ? '255,215,0' : style?.color === '#c0c0c0' ? '192,192,192' : '205,127,50'}, 0.05)` : 'rgba(17,17,17,0.6)',
        border: `1px solid ${rank <= 3 ? `${style?.color}30` : 'rgba(249,115,22,0.1)'}`,
        borderRadius: 12,
        marginBottom: 8,
        boxShadow: rank <= 3 ? `0 0 20px ${style?.glow}` : 'none',
        transition: 'all 0.2s',
      }}
    >
      {/* Rank */}
      <div
        style={{
          width: 40,
          textAlign: 'center',
          fontSize: rank <= 3 ? '1.4rem' : '1rem',
          fontWeight: 800,
          color: rank <= 3 ? style?.color : '#666',
          flexShrink: 0,
        }}
      >
        {rank <= 3 ? style?.icon : `#${rank}`}
      </div>

      {/* Nametag */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: '0.95rem',
            color: rank <= 3 ? style?.color : '#ddd',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          @{nametag}
        </div>
        {lastWinAt && (
          <div style={{ fontSize: '0.7rem', color: '#555', marginTop: 2 }}>
            Last win: {new Date(lastWinAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f97316' }}>
            {totalWins}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Wins
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
            {wonUCT.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {UCT_SYMBOL} Won
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#888' }}>
            {totalBetsPlaced}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Bets
          </div>
        </div>
      </div>
    </motion.div>
  );
}
