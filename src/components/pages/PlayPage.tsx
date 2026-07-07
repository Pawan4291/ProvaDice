'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Nav from '@/components/Nav';
import ParticleBackground from '@/components/ParticleBackground';
import Dice3D from '@/components/Dice3D';
import RoundTimer from '@/components/RoundTimer';
import BetForm from '@/components/BetForm';
import { useWallet } from '@/components/SphereWalletProvider';
import { baseUnitsToUct, UCT_SYMBOL, ROUND_DURATION_MS } from '@/config/constants';

interface BetInfo {
  nametag: string;
  amountBaseUnits: string;
  txId: string;
  confirmedAt: string;
}

interface RoundState {
  roundId: string;
  status: string;
  startTime: string;
  endTime: string;
  commitHash: string;
  totalPotBaseUnits: string;
  playerCount: number;
  bets: BetInfo[];
  timeRemainingMs: number;
  winnerNametag?: string;
  revealSeed?: string;
  finalHash?: string;
  payoutTxId?: string;
}

interface RecentRound {
  roundId: string;
  status: string;
  winnerNametag?: string;
  totalPotBaseUnits: string;
  playerCount: number;
  payoutTxId?: string;
}

interface RoundStatusResponse {
  currentRound: RoundState | null;
  recentRounds: RecentRound[];
}

const POLL_INTERVAL = 3000; // 3 seconds

export default function PlayPage() {
  const { connected, identity, connecting, error: walletError, connect, sendBet } = useWallet();

  const [roundState, setRoundState] = useState<RoundState | null>(null);
  const [recentRounds, setRecentRounds] = useState<RecentRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [winnerFace, setWinnerFace] = useState(1);
  const [lastWinner, setLastWinner] = useState<RecentRound | null>(null);
  const [timeRemainingMs, setTimeRemainingMs] = useState(ROUND_DURATION_MS);
  const prevRoundIdRef = useRef<string | null>(null);

  // Fetch round status from real API
  const fetchRoundStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/round-status', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json() as RoundStatusResponse;

      // Detect round transition
      if (
        prevRoundIdRef.current &&
        data.currentRound?.roundId !== prevRoundIdRef.current
      ) {
        // Round changed — find the settled one
        const settled = data.recentRounds.find(
          (r) => r.roundId === prevRoundIdRef.current && r.status === 'settled'
        );
        if (settled) {
          setLastWinner(settled);
          setSettling(true);
          // Pick a random face for the dice animation (1-6)
          setWinnerFace(Math.floor(Math.random() * 6) + 1);
          setTimeout(() => {
            setSettling(false);
          }, 3000);
        }
      }

      prevRoundIdRef.current = data.currentRound?.roundId ?? null;
      setRoundState(data.currentRound);
      setRecentRounds(data.recentRounds);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch round status:', err);
    }
  }, []);

  // Trigger clock tick (keeps rounds running)
  const tickClock = useCallback(async () => {
    try {
      await fetch('/api/clock', { cache: 'no-store' });
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchRoundStatus();
    tickClock();

    const pollInterval = setInterval(fetchRoundStatus, POLL_INTERVAL);
    const clockInterval = setInterval(tickClock, 5000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(clockInterval);
    };
  }, [fetchRoundStatus, tickClock]);

  const potUCT = roundState ? baseUnitsToUct(roundState.totalPotBaseUnits) : 0;
  const userBet = roundState?.bets.find((b) => b.nametag === identity?.nametag);
  const winChance =
    userBet && roundState && potUCT > 0
      ? (baseUnitsToUct(userBet.amountBaseUnits) / potUCT) * 100
      : 0;

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <ParticleBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Nav />

        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>

          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ textAlign: 'center', marginBottom: 48 }}
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
                marginBottom: 20,
              }}
            >
              <span style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e', display: 'inline-block' }} />
              LIVE ON UNICITY TESTNET
            </div>
            <h1
              className="shimmer-text"
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                marginBottom: 16,
              }}
            >
              ProvaDice
            </h1>
            <p style={{ fontSize: '1rem', color: '#888', maxWidth: 500, margin: '0 auto' }}>
              Provably-fair weighted-pot dice game. Every bet verified on-chain. Every win cryptographically proven.
            </p>
          </motion.div>

          {/* Main Game Area */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 340px',
              gap: 32,
              alignItems: 'start',
            }}
          >
            {/* Left: Dice + Stats */}
            <div>
              {/* Dice + Timer row */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="card-glass"
                style={{
                  borderRadius: 24,
                  padding: 40,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 32,
                  marginBottom: 24,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Background glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    height: 400,
                    background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                  }}
                >
                  {/* Pot size */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                      Total Pot
                    </div>
                    {loading ? (
                      <div style={{ width: 120, height: 36, background: 'rgba(249,115,22,0.1)', borderRadius: 8, animation: 'pulse 1s infinite' }} />
                    ) : (
                      <motion.div
                        key={roundState?.totalPotBaseUnits}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        style={{
                          fontSize: '2rem',
                          fontWeight: 900,
                          color: '#f97316',
                          letterSpacing: '-0.03em',
                          textShadow: '0 0 20px rgba(249,115,22,0.4)',
                        }}
                      >
                        {potUCT.toFixed(2)}
                        <span style={{ fontSize: '1rem', marginLeft: 6, color: '#ea6a07' }}>{UCT_SYMBOL}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Timer */}
                  {loading ? (
                    <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(249,115,22,0.05)', border: '6px solid rgba(249,115,22,0.1)' }} />
                  ) : (
                    <RoundTimer
                      endTime={roundState?.endTime ?? null}
                      roundDurationMs={ROUND_DURATION_MS}
                      onTimeUpdate={setTimeRemainingMs}
                      onExpire={fetchRoundStatus}
                    />
                  )}

                  {/* Players */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                      Players
                    </div>
                    {loading ? (
                      <div style={{ width: 60, height: 36, background: 'rgba(249,115,22,0.1)', borderRadius: 8 }} />
                    ) : (
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>
                        {roundState?.playerCount ?? 0}
                        <span style={{ fontSize: '0.9rem', color: '#666', marginLeft: 4 }}>/50</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3D Dice — THE CENTERPIECE */}
                <div style={{ position: 'relative' }}>
                  <Dice3D
                    settling={settling}
                    winningFace={winnerFace}
                    timeRemainingMs={timeRemainingMs}
                    roundDurationMs={ROUND_DURATION_MS}
                  />
                </div>

                {/* Round status */}
                <div style={{ width: '100%' }}>
                  {loading ? (
                    <div style={{ width: '100%', height: 40, background: 'rgba(249,115,22,0.05)', borderRadius: 10 }} />
                  ) : (
                    <div
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 12,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div style={{ fontSize: '0.65rem', color: '#555', letterSpacing: '0.1em', flexShrink: 0 }}>
                        COMMIT HASH
                      </div>
                      <code
                        style={{
                          fontSize: '0.65rem',
                          color: '#f97316',
                          fontFamily: 'monospace',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {roundState?.commitHash ?? '—'}
                      </code>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Winner announcement */}
              <AnimatePresence>
                {settling && lastWinner && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,106,7,0.08) 100%)',
                      border: '1px solid rgba(249,115,22,0.4)',
                      borderRadius: 20,
                      padding: '24px 32px',
                      textAlign: 'center',
                      marginBottom: 24,
                      boxShadow: '0 0 40px rgba(249,115,22,0.2)',
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f97316', marginBottom: 4 }}>
                      @{lastWinner.winnerNametag ?? '?'} wins!
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#888' }}>
                      Pot: {baseUnitsToUct(lastWinner.totalPotBaseUnits).toFixed(2)} {UCT_SYMBOL} · Payout sent automatically
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Your bet status */}
              <AnimatePresence>
                {userBet && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="card-glass"
                    style={{ borderRadius: 16, padding: '16px 20px', marginBottom: 24 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                          Your Bet This Round
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f97316' }}>
                          {baseUnitsToUct(userBet.amountBaseUnits).toFixed(4)} {UCT_SYMBOL}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                          Win Chance
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#22c55e' }}>
                          {winChance.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bet list */}
              {roundState && roundState.bets.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card-glass"
                  style={{ borderRadius: 16, padding: 20 }}
                >
                  <h3 style={{ fontSize: '0.75rem', color: '#f97316', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                    Bets This Round ({roundState.bets.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {roundState.bets.map((bet, i) => {
                      const betPct = potUCT > 0 ? (baseUnitsToUct(bet.amountBaseUnits) / potUCT) * 100 : 0;
                      const isMe = bet.nametag === identity?.nametag;
                      return (
                        <motion.div
                          key={bet.txId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 14px',
                            background: isMe ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isMe ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.05)'}`,
                            borderRadius: 10,
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, color: isMe ? '#f97316' : '#ddd', fontSize: '0.9rem' }}>
                              @{bet.nametag}
                              {isMe && <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#f97316', background: 'rgba(249,115,22,0.15)', padding: '1px 6px', borderRadius: 4 }}>YOU</span>}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div
                              style={{
                                width: 80,
                                height: 4,
                                background: 'rgba(249,115,22,0.15)',
                                borderRadius: 2,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${betPct}%`,
                                  background: 'linear-gradient(90deg, #f97316, #ea6a07)',
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f97316', width: 80, textAlign: 'right' }}>
                              {baseUnitsToUct(bet.amountBaseUnits).toFixed(4)} {UCT_SYMBOL}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#666', width: 50, textAlign: 'right' }}>
                              {betPct.toFixed(1)}%
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right: Wallet + Bet Form */}
            <div>
              {/* Connect or Bet Form */}
              {!connected ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="card-glass"
                  style={{ borderRadius: 24, padding: 32, textAlign: 'center' }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔐</div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8 }}>
                    Connect to Play
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: 24, lineHeight: 1.6 }}>
                    Connect your Sphere wallet to place bets with real UCT on the Unicity testnet.
                  </p>

                  <AnimatePresence>
                    {walletError && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 10,
                          padding: '10px 14px',
                          fontSize: '0.8rem',
                          color: '#ef4444',
                          marginBottom: 16,
                        }}
                      >
                        {walletError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    onClick={connect}
                    disabled={connecting}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-orange"
                    style={{
                      width: '100%',
                      padding: '16px 24px',
                      borderRadius: 14,
                      fontSize: '1rem',
                      fontWeight: 700,
                      letterSpacing: '0.03em',
                    }}
                  >
                    {connecting ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                        Connecting...
                      </span>
                    ) : (
                      '🌐 Connect Sphere Wallet'
                    )}
                  </motion.button>

                  <p style={{ fontSize: '0.7rem', color: '#555', marginTop: 16 }}>
                    Requires Sphere browser extension or opens sphere.unicity.network
                  </p>
                </motion.div>
              ) : (
                <div>
                  {/* Wallet badge */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-glass"
                    style={{
                      borderRadius: 16,
                      padding: '14px 20px',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        background: 'linear-gradient(135deg, #f97316, #ea6a07)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        flexShrink: 0,
                        boxShadow: '0 0 12px rgba(249,115,22,0.4)',
                      }}
                    >
                      👤
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#f97316', fontSize: '0.95rem' }}>
                        @{identity?.nametag}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#555' }}>Sphere wallet connected</div>
                    </div>
                    <div style={{ marginLeft: 'auto', width: 8, height: 8, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }} />
                  </motion.div>

                  {/* Bet form */}
                  <BetForm
                    roundId={roundState?.roundId ?? null}
                    totalPotBaseUnits={roundState?.totalPotBaseUnits ?? '0'}
                    walletConnected={connected}
                    nametag={identity?.nametag ?? null}
                    onSendBet={sendBet}
                    onBetSubmitted={fetchRoundStatus}
                  />
                </div>
              )}

              {/* Recent rounds */}
              {recentRounds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="card-glass"
                  style={{ borderRadius: 20, padding: 20, marginTop: 20 }}
                >
                  <h3 style={{ fontSize: '0.75rem', color: '#f97316', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                    Recent Rounds
                  </h3>
                  {recentRounds.slice(0, 5).map((r) => (
                    <div
                      key={r.roundId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ color: '#666', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                        {r.roundId.slice(0, 20)}…
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {r.winnerNametag && (
                          <span style={{ color: '#f97316', fontWeight: 600 }}>
                            @{r.winnerNametag}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.65rem',
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: r.status === 'settled'
                              ? 'rgba(34,197,94,0.1)'
                              : r.status === 'cancelled'
                              ? 'rgba(239,68,68,0.1)'
                              : 'rgba(249,115,22,0.1)',
                            color: r.status === 'settled'
                              ? '#22c55e'
                              : r.status === 'cancelled'
                              ? '#ef4444'
                              : '#f97316',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                          }}
                        >
                          {r.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Feature badges — below fold */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                style={{ marginTop: 20 }}
              >
                {[
                  { icon: '🔐', label: 'Provably Fair', desc: 'Commit-reveal scheme' },
                  { icon: '⚡', label: 'Instant Payouts', desc: 'Auto-sent on settle' },
                  { icon: '⚖️', label: 'Weighted Pot', desc: 'Bet more = more odds' },
                ].map((f) => (
                  <div
                    key={f.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 16px',
                      background: 'rgba(249,115,22,0.03)',
                      border: '1px solid rgba(249,115,22,0.08)',
                      borderRadius: 10,
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{f.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ddd' }}>{f.label}</div>
                      <div style={{ fontSize: '0.7rem', color: '#666' }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
