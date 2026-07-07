import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { SphereWalletProvider } from '@/components/SphereWalletProvider';

export const metadata: Metadata = {
  title: 'ProvaDice — Provably-Fair Weighted-Pot Game on Unicity',
  description:
    'A provably-fair, autonomous weighted-pot dice game built on the Unicity Sphere network. Every bet and payout is cryptographically verifiable.',
  keywords: ['ProvaDice', 'Unicity', 'Sphere', 'provably fair', 'dice game', 'UCT', 'blockchain'],
  openGraph: {
    title: 'ProvaDice',
    description: 'Provably-Fair Weighted-Pot Dice Game on Unicity Sphere',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white antialiased min-h-screen">
        <SphereWalletProvider>
          {children}
        </SphereWalletProvider>
      </body>
    </html>
  );
}
