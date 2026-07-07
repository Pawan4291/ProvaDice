'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface RoundTimerProps {
  endTime: string | null;
  roundDurationMs?: number;
  onExpire?: () => void;
  onTimeUpdate?: (remainingMs: number) => void;
}

export default function RoundTimer({
  endTime,
  roundDurationMs = 60000,
  onExpire,
  onTimeUpdate,
}: RoundTimerProps) {
  const [remainingMs, setRemainingMs] = useState(roundDurationMs);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;

    const tick = () => {
      if (!endTime) {
        setRemainingMs(roundDurationMs);
        return;
      }

      const end = new Date(endTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, end - now);
      setRemainingMs(remaining);
      onTimeUpdate?.(remaining);

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [endTime, roundDurationMs, onExpire, onTimeUpdate]);

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const progress = Math.max(0, Math.min(1, remainingMs / roundDurationMs));

  // SVG ring params
  const size = 120;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  // Color shifts from green→orange→red as time runs out
  const hue = Math.round(progress * 120); // 120=green, 0=red, goes through orange at ~30
  const ringColor = progress > 0.5
    ? `hsl(${hue}, 90%, 55%)`
    : progress > 0.2
    ? '#f97316'
    : '#ef4444';

  const urgency = progress < 0.2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="timer-ring"
          style={{ filter: `drop-shadow(0 0 8px ${ringColor}80)` }}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="timer-track"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.5s ease' }}
          />
        </svg>

        {/* Time display in center */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ gap: 2 }}
        >
          <motion.span
            key={totalSeconds}
            animate={urgency ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.25 }}
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: ringColor,
              letterSpacing: '-0.05em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              textShadow: `0 0 12px ${ringColor}80`,
            }}
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </motion.span>
        </div>
      </div>

      <motion.p
        animate={urgency ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
        transition={urgency ? { duration: 0.5, repeat: Infinity } : {}}
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.15em',
          fontWeight: 600,
          color: urgency ? '#ef4444' : '#888',
          textTransform: 'uppercase',
        }}
      >
        {remainingMs <= 0 ? 'SETTLING...' : urgency ? 'CLOSING SOON' : 'ROUND CLOSES'}
      </motion.p>
    </div>
  );
}
