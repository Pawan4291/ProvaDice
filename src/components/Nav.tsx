'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const NAV_LINKS = [
  { href: '/', label: 'Play', icon: '🎲' },
  { href: '/proof', label: 'Proof', icon: '🔍' },
  { href: '/ranks', label: 'Ranks', icon: '🏆' },
  { href: '/history', label: 'History', icon: '📜' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(249,115,22,0.15)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg, #f97316, #ea6a07)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                boxShadow: '0 0 15px rgba(249,115,22,0.5)',
              }}
            >
              🎲
            </div>
            <span
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #fff 0%, #f97316 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.03em',
              }}
            >
              ProvaDice
            </span>
          </motion.div>
        </Link>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8 }}
              >
                <span style={{ fontSize: '0.9rem' }}>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Testnet badge */}
        <div
          style={{
            background: 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: 20,
            padding: '4px 12px',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: '#f97316',
          }}
        >
          TESTNET
        </div>
      </div>
    </nav>
  );
}
