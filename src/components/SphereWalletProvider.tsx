'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import { UCT_COIN_ID } from '@/config/constants';

interface WalletIdentity {
  nametag: string;
  pubkey?: string;
}

interface ConnectClientLike {
  connect: () => Promise<{ identity?: { nametag?: string; pubkey?: string } }>;
  query: (method: string) => Promise<unknown>;
  intent: (method: string, params: unknown) => Promise<unknown>;
  disconnect?: () => void;
  on?: (event: string, handler: (data: unknown) => void) => void;
}

interface WalletContextValue {
  connected: boolean;
  identity: WalletIdentity | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendBet: (amountBaseUnits: bigint, roundId: string) => Promise<string>;
  getHistory: () => Promise<unknown[]>;
  houseNametag: string;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const DAPP_INFO = {
  name: 'ProvaDice',
  description: 'Provably-fair weighted-pot dice game on Unicity Sphere',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://provadice.vercel.app',
};

const HOUSE_NAMETAG =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_HOUSE_NAMETAG) || 'provadice-house';

const SPHERE_WALLET_URL = 'https://sphere.unicity.network/';

export function SphereWalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [identity, setIdentity] = useState<WalletIdentity | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<ConnectClientLike | null>(null);

  // Try silent auto-connect on mount
  useEffect(() => {
    tryAutoConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Detect transport: iframe > extension > popup
   */
  const buildClient = useCallback(async (silent: boolean): Promise<ConnectClientLike | null> => {
    try {
      const sdkConnect = await import('@unicitylabs/sphere-sdk/connect' as string);
      const ConnectClient = sdkConnect.ConnectClient as new (opts: unknown) => ConnectClientLike;

      let transport: unknown;

      // Check if in iframe
      const inIframe = (() => {
        try { return window.self !== window.top; } catch { return true; }
      })();

      // Check if extension installed
      const hasExt = !!(
        (window as unknown as Record<string, unknown>).__SPHERE_EXT__ ||
        (window as unknown as Record<string, unknown>).sphere
      );

      if (inIframe) {
        const m = await import('@unicitylabs/sphere-sdk/connect/browser' as string);
        transport = (m.PostMessageTransport as { forClient: () => unknown }).forClient();
      } else if (hasExt) {
        const m = await import('@unicitylabs/sphere-sdk/connect/browser' as string);
        transport = (m.ExtensionTransport as { forClient: () => unknown }).forClient();
      } else {
        const m = await import('@unicitylabs/sphere-sdk/connect/browser' as string);
        const popup = window.open(SPHERE_WALLET_URL, 'sphere-wallet', 'width=420,height=680,popup=1');
        if (!popup && !silent) throw new Error('Popup blocked — please allow popups for this site');
        if (!popup) return null;
        transport = (m.PostMessageTransport as { forClient: (opts: unknown) => unknown }).forClient({
          target: popup,
          targetOrigin: SPHERE_WALLET_URL,
        });
      }

      return new ConnectClient({ transport, dapp: DAPP_INFO, silent });
    } catch (err) {
      if (!silent) throw err;
      return null;
    }
  }, []);

  const tryAutoConnect = useCallback(async () => {
    try {
      const client = await buildClient(true);
      if (!client) return;

      await client.connect();
      const idResult = (await client.query('sphere_getIdentity')) as {
        nametag?: string;
        pubkey?: string;
      } | null;

      if (idResult?.nametag) {
        clientRef.current = client;
        setIdentity({ nametag: idResult.nametag, pubkey: idResult.pubkey });
        setConnected(true);
      }
    } catch {
      // Silent — user hasn't approved yet
    }
  }, [buildClient]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const client = await buildClient(false);
      if (!client) throw new Error('Could not build wallet transport');

      const result = await client.connect();
      const nametag = result?.identity?.nametag;
      if (!nametag) throw new Error('Wallet connected but no nametag returned');

      clientRef.current = client;
      setIdentity({ nametag, pubkey: result?.identity?.pubkey });
      setConnected(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setError(msg);
    } finally {
      setConnecting(false);
    }
  }, [buildClient]);

  const disconnect = useCallback(() => {
    if (clientRef.current?.disconnect) {
      clientRef.current.disconnect();
    }
    clientRef.current = null;
    setConnected(false);
    setIdentity(null);
    setError(null);
  }, []);

  const sendBet = useCallback(
    async (amountBaseUnits: bigint, roundId: string): Promise<string> => {
      if (!clientRef.current) throw new Error('Wallet not connected');

      const result = (await clientRef.current.intent('send', {
        recipient: `@${HOUSE_NAMETAG}`,
        amount: amountBaseUnits.toString(),
        coinId: UCT_COIN_ID,
        memo: `ProvaDice bet round:${roundId}`,
      })) as { txId?: string; transferId?: string; id?: string } | null;

      return (
        result?.txId ?? result?.transferId ?? result?.id ?? `tx-${Date.now()}`
      );
    },
    []
  );

  const getHistory = useCallback(async (): Promise<unknown[]> => {
    if (!clientRef.current) return [];
    try {
      const result = (await clientRef.current.query('sphere_getHistory')) as unknown[] | null;
      return result ?? [];
    } catch {
      return [];
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        connected,
        identity,
        connecting,
        error,
        connect,
        disconnect,
        sendBet,
        getHistory,
        houseNametag: HOUSE_NAMETAG,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside SphereWalletProvider');
  return ctx;
}
