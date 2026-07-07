'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// Pip layout for each face (3x3 grid, true = pip visible)
const PIP_LAYOUTS: Record<number, boolean[][]> = {
  1: [
    [false, false, false],
    [false, true,  false],
    [false, false, false],
  ],
  2: [
    [true,  false, false],
    [false, false, false],
    [false, false, true ],
  ],
  3: [
    [true,  false, false],
    [false, true,  false],
    [false, false, true ],
  ],
  4: [
    [true,  false, true ],
    [false, false, false],
    [true,  false, true ],
  ],
  5: [
    [true,  false, true ],
    [false, true,  false],
    [true,  false, true ],
  ],
  6: [
    [true,  false, true ],
    [true,  false, true ],
    [true,  false, true ],
  ],
};

interface PipsProps {
  face: number;
  isActive?: boolean;
}

function Pips({ face, isActive }: PipsProps) {
  const layout = PIP_LAYOUTS[face] ?? PIP_LAYOUTS[1];
  return (
    <div className="pip-grid">
      {layout.flat().map((visible, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {visible ? (
            <div
              className="pip"
              style={{
                background: isActive ? '#ff9a4a' : 'var(--orange)',
                boxShadow: isActive
                  ? '0 0 15px rgba(249,115,22,1), 0 0 30px rgba(249,115,22,0.6)'
                  : '0 0 10px rgba(249,115,22,0.8)',
              }}
            />
          ) : (
            <div className="pip hidden" />
          )}
        </div>
      ))}
    </div>
  );
}

interface Dice3DProps {
  settling?: boolean;
  winningFace?: number; // 1-6
  timeRemainingMs?: number;
  roundDurationMs?: number;
}

export default function Dice3D({ settling = false, winningFace = 1, timeRemainingMs, roundDurationMs = 60000 }: Dice3DProps) {
  const cubeRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const rotXRef = useRef(20);
  const rotYRef = useRef(0);
  const [isSettling, setIsSettling] = useState(false);
  const [displayFace, setDisplayFace] = useState(winningFace);

  // Progress 0..1 from full to empty as time runs out
  const progress = timeRemainingMs !== undefined && roundDurationMs > 0
    ? Math.max(0, Math.min(1, timeRemainingMs / roundDurationMs))
    : 1;

  // Speed up as round ends
  const baseSpeed = 0.3;
  const maxSpeed = 2.5;
  const speedMultiplier = baseSpeed + (1 - progress) * (maxSpeed - baseSpeed);

  useEffect(() => {
    if (!settling) {
      setIsSettling(false);
      // Continuous slow rotation
      let last = 0;
      const animate = (t: number) => {
        const dt = last ? (t - last) / 1000 : 0.016;
        last = t;
        rotYRef.current += speedMultiplier * 60 * dt;
        if (cubeRef.current) {
          cubeRef.current.style.transform = `rotateX(${rotXRef.current}deg) rotateY(${rotYRef.current}deg)`;
        }
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animRef.current);
    }
  }, [settling, speedMultiplier]);

  useEffect(() => {
    if (settling && winningFace) {
      cancelAnimationFrame(animRef.current);
      setIsSettling(true);
      setDisplayFace(winningFace);

      // Fast spin then land on winning face
      let startTime: number | null = null;
      const duration = 1400;

      // Face rotation targets (so face 1 faces user)
      const faceTargets: Record<number, { x: number; y: number }> = {
        1: { x: 0,    y: 0   },
        2: { x: 0,    y: 90  },
        3: { x: 0,    y: -90 },
        4: { x: 0,    y: 180 },
        5: { x: -90,  y: 0   },
        6: { x: 90,   y: 0   },
      };

      const target = faceTargets[winningFace] ?? faceTargets[1];
      const startX = rotXRef.current % 360;
      const startY = rotYRef.current % 360;

      const spinAnimate = (t: number) => {
        if (!startTime) startTime = t;
        const elapsed = t - startTime;
        const rawProgress = Math.min(1, elapsed / duration);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - rawProgress, 3);

        // Multiple full rotations + land on target
        const totalExtraY = 720;
        const targetY = startY + totalExtraY + (target.y - (startY % 360 + totalExtraY) % 360);

        if (cubeRef.current) {
          const curX = startX + (target.x - startX) * eased;
          const curY = startY + (targetY - startY) * eased;
          cubeRef.current.style.transform = `rotateX(${curX}deg) rotateY(${curY}deg)`;
        }

        if (rawProgress < 1) {
          animRef.current = requestAnimationFrame(spinAnimate);
        } else {
          rotXRef.current = target.x;
          rotYRef.current = target.y;
        }
      };

      animRef.current = requestAnimationFrame(spinAnimate);
      return () => cancelAnimationFrame(animRef.current);
    }
  }, [settling, winningFace]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="dice-scene flex items-center justify-center"
      style={{ width: 280, height: 280 }}
    >
      {/* Glow under dice */}
      <div
        style={{
          position: 'absolute',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
          filter: 'blur(20px)',
          animation: isSettling ? 'pulse-ring 0.5s ease-out 3' : undefined,
        }}
      />

      <div
        ref={cubeRef}
        className={`dice-cube ${isSettling ? 'settling' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front - face 1 */}
        <div className="dice-face" style={{ transform: 'translateZ(110px)' }}>
          <Pips face={1} isActive={isSettling && displayFace === 1} />
        </div>
        {/* Back - face 4 */}
        <div className="dice-face" style={{ transform: 'rotateY(180deg) translateZ(110px)' }}>
          <Pips face={4} isActive={isSettling && displayFace === 4} />
        </div>
        {/* Right - face 2 */}
        <div className="dice-face" style={{ transform: 'rotateY(90deg) translateZ(110px)' }}>
          <Pips face={2} isActive={isSettling && displayFace === 2} />
        </div>
        {/* Left - face 3 */}
        <div className="dice-face" style={{ transform: 'rotateY(-90deg) translateZ(110px)' }}>
          <Pips face={3} isActive={isSettling && displayFace === 3} />
        </div>
        {/* Top - face 5 */}
        <div className="dice-face" style={{ transform: 'rotateX(90deg) translateZ(110px)' }}>
          <Pips face={5} isActive={isSettling && displayFace === 5} />
        </div>
        {/* Bottom - face 6 */}
        <div className="dice-face" style={{ transform: 'rotateX(-90deg) translateZ(110px)' }}>
          <Pips face={6} isActive={isSettling && displayFace === 6} />
        </div>
      </div>
    </motion.div>
  );
}
