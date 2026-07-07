'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditEntryProps {
  entry: {
    id: number;
    prevHash: string;
    timestamp: string;
    eventType: string;
    data: unknown;
    hash: string;
  };
  verified: boolean | null; // null = checking
}

const EVENT_COLORS: Record<string, string> = {
  ROUND_OPEN: '#3b82f6',
  BET_RECEIVED: '#22c55e',
  BET_REJECTED: '#ef4444',
  ROUND_SETTLE_START: '#f97316',
  ROUND_REVEAL: '#a855f7',
  ROUND_WIN: '#f59e0b',
  ROUND_PAYOUT: '#22c55e',
  ROUND_CANCELLED: '#ef4444',
  REFUND_SENT: '#06b6d4',
  TREASURY_LOW: '#ef4444',
  TREASURY_REFILLED: '#22c55e',
  AGENT_BOOT: '#6366f1',
};

export default function AuditEntryComponent({ entry, verified }: AuditEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const color = EVENT_COLORS[entry.eventType] ?? '#888';

  const verifiedIcon = verified === null ? '⏳' : verified ? '✅' : '❌';
  const verifiedText = verified === null ? 'Verifying...' : verified ? 'Hash valid' : 'Hash mismatch!';

  return (
    <motion.div
      layout
      className="card-glass"
      style={{
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        cursor: 'pointer',
        borderLeft: `3px solid ${color}`,
      }}
      whileHover={{ borderColor: `${color}` }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {/* Event type badge */}
          <span
            style={{
              background: `${color}20`,
              border: `1px solid ${color}50`,
              color,
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.eventType}
          </span>

          {/* Hash preview */}
          <span
            style={{
              fontSize: '0.7rem',
              color: '#666',
              fontFamily: 'monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            #{entry.id} · {entry.hash.slice(0, 16)}…
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: '0.75rem', color: '#555' }}>
            {new Date(entry.timestamp).toLocaleTimeString()}
          </span>
          <span
            title={verifiedText}
            style={{ fontSize: '0.9rem' }}
          >
            {verifiedIcon}
          </span>
          <span style={{ color: '#555', fontSize: '0.9rem' }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', marginTop: 14 }}
          >
            {/* Hash chain */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: '0.7rem', color: '#888', width: 80, flexShrink: 0 }}>prevHash</span>
                <code style={{ fontSize: '0.7rem', color: '#a855f7', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {entry.prevHash}
                </code>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: '0.7rem', color: '#888', width: 80, flexShrink: 0 }}>hash</span>
                <code style={{ fontSize: '0.7rem', color: '#22c55e', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {entry.hash}
                </code>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: '0.7rem', color: '#888', width: 80, flexShrink: 0 }}>timestamp</span>
                <code style={{ fontSize: '0.7rem', color: '#f97316', fontFamily: 'monospace' }}>
                  {entry.timestamp}
                </code>
              </div>
            </div>

            {/* Verification status */}
            <div
              style={{
                background: verified === false
                  ? 'rgba(239,68,68,0.1)'
                  : verified === true
                  ? 'rgba(34,197,94,0.1)'
                  : 'rgba(249,115,22,0.1)',
                border: `1px solid ${verified === false ? 'rgba(239,68,68,0.3)' : verified === true ? 'rgba(34,197,94,0.3)' : 'rgba(249,115,22,0.3)'}`,
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.75rem',
                color: verified === false ? '#ef4444' : verified === true ? '#22c55e' : '#f97316',
                marginBottom: 12,
                fontFamily: 'monospace',
              }}
            >
              {verifiedIcon} Browser verification: SHA256(prevHash + timestamp + eventType + data) = {verifiedText}
            </div>

            {/* Event data */}
            <pre
              style={{
                fontSize: '0.7rem',
                color: '#aaa',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                padding: 12,
                overflow: 'auto',
                maxHeight: 200,
                fontFamily: 'monospace',
              }}
            >
              {JSON.stringify(entry.data, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
