'use client';

import { ReactNode, useEffect } from 'react';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { http, createConfig, WagmiConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setApiKey } from '@zoralabs/coins-sdk';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { coinbaseWallet, injected } from 'wagmi/connectors';
import { farcasterFrame as miniAppConnector } from '@farcaster/frame-wagmi-connector'

// Create query client
const queryClient = new QueryClient();

// Set up Wagmi with the Base chain 
const config = createConfig({
  chains: [base],
  connectors: [
    miniAppConnector(),
    coinbaseWallet({
      appName: 'SongCast',
    }),
    injected(),
  ],
  transports: {
    [base.id]: http('/api/rpc'), // Use our own proxy API for all RPC calls
  },
});

// Font for our site
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
})

// The next.js font helper requires keys of Latin, Cyrillic, etc.,
// but just use Latin for now
const fontClasses = inter.variable;

export function Providers({ children }: { children: ReactNode }) {
  // Set up Zora API key if available
  useEffect(() => {
    const zoraApiKey = process.env.NEXT_PUBLIC_ZORA_API_KEY;
    if (zoraApiKey) {
      setApiKey(zoraApiKey);
      console.log('Zora API key set up successfully');
    } else {
      console.warn('No Zora API key found. API rate limits may apply.');
    }
  }, []);

  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || ''} 
      chain={base}
    >
      <WagmiConfig config={config}>
        <QueryClientProvider client={queryClient}>
          <div className={fontClasses}>
            {children}
            <Toaster position="bottom-right" />
          </div>
        </QueryClientProvider>
      </WagmiConfig>
    </OnchainKitProvider>
  );
} 