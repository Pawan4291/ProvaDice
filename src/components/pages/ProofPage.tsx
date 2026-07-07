'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Nav from '@/components/Nav';
import ParticleBackground from '@/components/ParticleBackground';
import AuditEntryComponent from '@/components/AuditEntry';

interface AuditEntry {
  id: number;
  prevHash: string;
  timestamp: string;
  eventType: string;
  data: unknown;
  hash: string;
}

interface VerificationResult {
  [id: number]: boolean | null;
}

// Browser-side SHA-256 using SubtleCrypto
async function sha256Browser(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyEntry(entry: AuditEntry): Promise<boolean> {
  const payload = entry.prevHash + entry.timestamp + entry.eventType + JSON.stringify(entry.data);
  const expected = await sha256Browser(payload);
  return expected === entry.hash;
}

export default function ProofPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [verified, setVerified] = useState<VerificationResult>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const PAGE_SIZE = 20;

  const fetchAudit = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit?page=${p}&pageSize=${PAGE_SIZE}`);
      const data = await res.json() as { entries: AuditEntry[]; total: number };
      setEntries(data.entries);
      setTotal(data.total);

      // Verify each entry client-side
      const newVerified: VerificationResult = {};
      for (const entry of data.entries) {
        newVerified[entry.id] = null; // loading
      }
      setVerified(newVerified);

      // Async verify all entries
      for (const entry of data.entries) {
        verifyEntry(entry).then((result) => {
          setVerified((prev) => ({ ...prev, [entry.id]: result }));
        });
      }

      // Check chain continuity (consecutive prev/hash links)
      let valid = true;
      for (let i = 0; i < data.entries.length - 1; i++) {
        // entries are newest-first, so entry[i].prevHash should == entry[i+1].hash
        if (data.entries[i].prevHash !== data.entries[i + 1].hash) {
          valid = false;
          break;
        }
      }
      setChainValid(valid);
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudit(page);
  }, [page, fetchAudit]);

  const allVerified = Object.values(verified).every((v) => v === true);
  const anyFailed = Object.values(verified).some((v) => v === false);

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
              🔍 AUDIT LOG — ASTRID HASH CHAIN
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>
              Proof of Fairness
            </h1>
            <p style={{ color: '#888', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 600 }}>
              Every game event is recorded in a tamper-evident hash chain (Astrid audit log).
              Click any entry to expand it. Your browser re-computes the SHA-256 hash locally
              and verifies it against the stored value — no trust required.
            </p>
          </motion.div>

          {/* Chain validity banner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              background: chainValid === false
                ? 'rgba(239,68,68,0.1)'
                : chainValid === true && allVerified
                ? 'rgba(34,197,94,0.1)'
                : 'rgba(249,115,22,0.1)',
              border: `1px solid ${chainValid === false ? 'rgba(239,68,68,0.3)' : chainValid === true && allVerified ? 'rgba(34,197,94,0.3)' : 'rgba(249,115,22,0.3)'}`,
              borderRadius: 16,
              padding: '16px 24px',
              marginBottom: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{ fontSize: '2rem' }}>
              {anyFailed ? '❌' : allVerified && chainValid ? '✅' : '⏳'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
                {anyFailed
                  ? 'CHAIN INTEGRITY VIOLATION DETECTED'
                  : allVerified && chainValid
                  ? 'All hashes verified — chain is intact'
                  : 'Verifying hash chain...'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#888' }}>
                Algorithm: SHA256(prevHash + timestamp + eventType + JSON.stringify(data))
                · Verified in your browser · {entries.length} entries on this page
              </div>
            </div>
          </motion.div>

          {/* Audit entries */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 56,
                    background: 'rgba(249,115,22,0.05)',
                    borderRadius: 14,
                    animation: 'pulse 1s infinite',
                  }}
                />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📋</div>
              <p>No audit entries yet. Play a round to generate the first entries.</p>
            </div>
          ) : (
            <>
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <AuditEntryComponent
                    entry={entry}
                    verified={verified[entry.id] ?? null}
                  />
                </motion.div>
              ))}

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 32 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: '1px solid rgba(249,115,22,0.3)',
                    background: 'rgba(249,115,22,0.05)',
                    color: page <= 1 ? '#555' : '#f97316',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ← Prev
                </button>
                <span style={{ padding: '10px 16px', color: '#888', fontSize: '0.85rem' }}>
                  Page {page} · {total} total entries
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * PAGE_SIZE >= total}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: '1px solid rgba(249,115,22,0.3)',
                    background: 'rgba(249,115,22,0.05)',
                    color: page * PAGE_SIZE >= total ? '#555' : '#f97316',
                    cursor: page * PAGE_SIZE >= total ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Next →
                </button>
              </div>
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
