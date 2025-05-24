'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, 
  Headphones, 
  TrendingUp, 
  Upload, 
  Coins, 
  Sparkles,
  Play,
  ArrowRight,
  ChevronRight,
  Globe,
  Users
} from 'lucide-react';
import { useZoraEvents } from './hooks/useZoraEvents';
import { Address, createPublicClient, custom } from 'viem';
import { base } from 'viem/chains';
import { getIpfsUrl } from './services/pinataService';
import axios from 'axios';

// Known coin addresses to fetch immediately
const KNOWN_COIN_ADDRESSES = [
  '0xc8054286955448bafd9d438b71ef55b90626ccf2', // Example address, replace with actual known addresses
  '0x50Ca3d669E893dA18Cc55875e8Ec7a12ce36cdcf',
  '0x989760E2102bEd06C08FE6Fa4872237023D98aE7',
  '0x65b1409997826fbFff22a93e0959dC77fF0bCEa1',
  '0xafd68ffb2518117e026ad7c05c8327da2b3535e5'
];

// ABI of ERC721 functions we need
const ERC721_ABI = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ type: 'string', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tokenURI',
    outputs: [{ type: 'string', name: '' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'payoutRecipient',
    outputs: [{ type: 'address', name: '' }],
    stateMutability: 'view',
    type: 'function',
  }
];

// Custom transport that uses our API proxy
const proxyTransport = custom({
  async request({ method, params }) {
    try {
      const response = await axios.post('/api/rpc', {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      });
      
      if (response.data.error) {
        console.error('RPC Error:', response.data.error);
        throw new Error(response.data.error.message || 'RPC request failed');
      }
      
      if (response.data.result === undefined) {
        console.error('Empty RPC result for method:', method);
        throw new Error('Empty result from RPC endpoint');
      }
      
      return response.data.result;
    } catch (error) {
      console.error('Error with proxy transport:', error);
      throw error;
    }
  },
});

// Create a public client for Base mainnet with our proxy transport
const publicClient = createPublicClient({
  chain: base,
  transport: proxyTransport,
});

// Fetch token metadata from IPFS
async function fetchTokenMetadata(uri: string) {
  try {
    // Convert IPFS URI to HTTP URL if needed
    let fetchUri = uri;
    if (uri.startsWith('ipfs://')) {
      fetchUri = getIpfsUrl(uri);
    }
    
    console.log(`Fetching metadata from: ${fetchUri}`);
    const response = await axios.get(fetchUri, { timeout: 15000 });
    return response.data;
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return null;
  }
}

// Function to fetch a single coin's data
async function fetchCoinData(address: Address) {
  try {
    // Read token data from contract
    const [name, symbol, tokenUri, artistAddress] = await Promise.all([
      publicClient.readContract({
        address,
        abi: ERC721_ABI,
        functionName: 'name',
      }),
      publicClient.readContract({
        address,
        abi: ERC721_ABI,
        functionName: 'symbol',
      }),
      publicClient.readContract({
        address,
        abi: ERC721_ABI,
        functionName: 'tokenURI',
      }),
      publicClient.readContract({
        address,
        abi: ERC721_ABI,
        functionName: 'payoutRecipient',
      }).catch(() => null) // This might not exist on all contracts
    ]);
    
    // Fetch metadata from IPFS
    const metadata = await fetchTokenMetadata(tokenUri as string);
    
    if (!metadata) {
      throw new Error('Failed to fetch token metadata');
    }
    
    // Extract data from metadata
    const description = metadata.description || '';
    const artistName = metadata.artist || 'Unknown Artist';
    
    // Extract image and audio URLs
    let coverArt = '/examples/default-cover.jpg';
    let audioUrl = '';
    
    if (metadata.image) {
      coverArt = metadata.image.startsWith('ipfs://') 
        ? getIpfsUrl(metadata.image) 
        : metadata.image;
    }
    
    if (metadata.animation_url) {
      audioUrl = metadata.animation_url.startsWith('ipfs://') 
        ? getIpfsUrl(metadata.animation_url) 
        : metadata.animation_url;
    }
    
    // Create coin object
    return {
      coinAddress: address,
      name: name as string,
      symbol: symbol as string,
      description,
      artistName,
      artistAddress: artistAddress as Address || '0x0000000000000000000000000000000000000000',
      coverArt,
      audioUrl,
      metadata
    };
  } catch (error) {
    console.error(`Error fetching coin data for ${address}:`, error);
    return null;
  }
}

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : null;
}

export default function Home() {
  const { coins, loading, error } = useZoraEvents();
  const [knownCoins, setKnownCoins] = useState<any[]>([]);
  const [knownCoinsLoading, setKnownCoinsLoading] = useState(true);
  
  // Fetch known coins immediately
  useEffect(() => {
    const fetchKnownCoins = async () => {
      setKnownCoinsLoading(true);
      try {
        const coinPromises = KNOWN_COIN_ADDRESSES.map(address => 
          fetchCoinData(address as Address)
        );
        
        const results = await Promise.all(coinPromises);
        const validCoins = results.filter(Boolean);
        setKnownCoins(validCoins);
      } catch (error) {
        console.error('Error fetching known coins:', error);
      } finally {
        setKnownCoinsLoading(false);
      }
    };
    
    fetchKnownCoins();
  }, []);
  
  // Get the three most recent coins for the featured section
  const allCoins = [...knownCoins];
  coins.forEach(coin => {
    if (!allCoins.some(knownCoin => knownCoin.coinAddress === coin.coinAddress)) {
      allCoins.push(coin);
    }
  });
  const featuredCoins = allCoins.slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0 diagonal-pattern"></div>
      
        <div className="container relative z-10 px-4 mx-auto">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-20">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="text-center lg:w-1/2 lg:text-left"
            >
              <div className="inline-flex items-center px-4 py-2 mb-6 bg-black border-2 border-white shadow-woodcut">
                <Sparkles size={20} className="text-woodcut-red mr-2 stroke-[3px]" />
                <span className="text-sm font-bold tracking-wide uppercase">Introducing Musik Coins</span>
              </div>
              
              <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight uppercase md:text-6xl lg:text-7xl text-shadow-md">
                Social Tokens for 
                <span className="block mt-2 gradient-text">Musik Artists</span>
              </h1>
              
              <p className="max-w-xl mx-auto mb-8 text-xl font-bold uppercase lg:mx-0">
                Jersey Club lets artists create their own coins, build communities,
                and let fans invest directly in their musikal journey.
              </p>
              
              <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <Link href="/coins" className="px-6 py-3 sonic-button-primary">
                  <Coins size={24} className="stroke-[3px]" />
                  <span>Explore Coins</span>
                </Link>
              </div>
              
              <div className="flex items-center justify-center gap-2 mt-10 text-sm font-bold uppercase lg:justify-start">
                <Globe size={20} className="stroke-[3px]" />
                <span>Powered by Zora Protocol on Base</span>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="flex justify-center lg:w-1/2"
            >
              <div className="relative">
                {/* Main Logo */}
                <div className="flex items-center justify-center w-64 h-64 bg-black border-4 border-white md:w-80 md:h-80 lg:w-96 lg:h-96 shadow-woodcut-xl">
                  <span className="text-6xl font-black tracking-tight text-white uppercase md:text-7xl lg:text-8xl">JC</span>
                </div>
                
                {/* Orbiting Coins */}
                <ClientOnly>
                  {[1, 2, 3, 4, 5].map((i) => {
                    const angle = (i * 72) * (Math.PI / 180);
                    const radius = 160; // Orbit radius
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    const size = Math.random() * 20 + 40; // Random size between 40-60px
                    
                    return (
                      <motion.div
                        key={i}
                        className="absolute"
                        style={{
                          left: 'calc(50% - 20px)',
                          top: 'calc(50% - 20px)',
                        }}
                        animate={{
                          x: [x, -y, -x, y, x],
                          y: [y, x, -y, -x, y],
                          scale: [1, 1.2, 1, 0.9, 1],
                        }}
                        transition={{
                          duration: 20 + i * 2,
                          ease: "linear",
                          repeat: Infinity,
                          delay: i * 0.5,
                        }}
                      >
                        <div 
                          className="flex items-center justify-center text-white border-2 border-white bg-woodcut-red shadow-woodcut"
                          style={{ width: `${size}px`, height: `${size}px` }}
                        >
                          <Coins size={size * 0.4} className="stroke-[3px]" />
                        </div>
                      </motion.div>
                    );
                  })}
                </ClientOnly>
              </div>
            </motion.div>
          </div>
          
          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="grid grid-cols-1 gap-4 p-6 mt-20 woodcut-card md:grid-cols-1"
          >
            <div className="p-3 text-center">
              <div className="mb-1 text-2xl font-black md:text-3xl gradient-text">{allCoins.length || '0'}</div>
              <div className="text-sm font-bold tracking-wide uppercase">Musik Coins Created</div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="relative py-20 woodcut-paper">
        <div className="container px-4 mx-auto">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-black tracking-tight uppercase gradient-text">How Jersey Club Works</h2>
            <p className="max-w-2xl mx-auto text-xl font-bold uppercase">
              Jersey Club creates a new way for artists to engage with fans through tradable social tokens.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative p-6 overflow-hidden woodcut-card group"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 flex items-center justify-center bg-woodcut-red border-2 border-white mb-4 group-hover:translate-y-[-5px] transition-transform duration-300">
                  <Coins size={32} className="text-white stroke-[3px]" />
                </div>
                <div className="inline-block px-3 py-1 mb-2 text-sm font-bold tracking-wide text-white uppercase border border-white bg-woodcut-red">Step 1</div>
                <h3 className="mb-3 text-xl font-black tracking-tight uppercase">Create Coin</h3>
                <p className="mb-4 font-bold uppercase">
                  Artists can create their own ERC20 token with custom name, symbol, and metadata.
                </p>
                <Link href="/coins" className="flex items-center text-sm font-bold tracking-wide uppercase text-woodcut-red group-hover:underline">
                  <span>Create a coin</span>
                  <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform stroke-[3px]" />
                </Link>
              </div>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative p-6 overflow-hidden woodcut-card group"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 flex items-center justify-center bg-woodcut-red border-2 border-white mb-4 group-hover:translate-y-[-5px] transition-transform duration-300">
                  <Music size={32} className="text-white stroke-[3px]" />
                </div>
                <div className="inline-block px-3 py-1 mb-2 text-sm font-bold tracking-wide text-white uppercase border border-white bg-woodcut-red">Step 2</div>
                <h3 className="mb-3 text-xl font-black tracking-tight uppercase">Enrich Profile</h3>
                <p className="mb-4 font-bold uppercase">
                  Upload musik, images, and set benefits for token holders to grow your community.
                </p>
                <Link href="/artists" className="flex items-center text-sm font-bold tracking-wide uppercase text-woodcut-red group-hover:underline">
                  <span>View artists</span>
                  <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform stroke-[3px]" />
                </Link>
              </div>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative p-6 overflow-hidden woodcut-card group"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 flex items-center justify-center bg-woodcut-red border-2 border-white mb-4 group-hover:translate-y-[-5px] transition-transform duration-300">
                  <TrendingUp size={32} className="text-white stroke-[3px]" />
                </div>
                <div className="inline-block px-3 py-1 mb-2 text-sm font-bold tracking-wide text-white uppercase border border-white bg-woodcut-red">Step 3</div>
                <h3 className="mb-3 text-xl font-black tracking-tight uppercase">Trade & Earn</h3>
                <p className="mb-4 font-bold uppercase">
                  Fans can trade tokens on the open market, with artists earning royalties on trades.
                </p>
                <Link href="/coins" className="flex items-center text-sm font-bold tracking-wide uppercase text-woodcut-red group-hover:underline">
                  <span>Explore market</span>
                  <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform stroke-[3px]" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Featured Artists Section */}
  
      
      {/* CTA Section */}
      <section className="py-20">
        <div className="container px-4 mx-auto">
          <div className="relative p-8 overflow-hidden sonic-glass-card md:p-12 rounded-3xl">
            <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 rounded-full w-96 h-96 bg-primary/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 rounded-full w-80 h-80 bg-indigo-500/10 blur-3xl"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <Sparkles className="w-10 h-10 mx-auto mb-6 text-primary" />
              <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                Ready to join the <span className="gradient-text">musik revolution</span>?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Connect your wallet, explore the marketplace, and start creating or collecting musik coins in a truly decentralized platform.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link href="/coins" className="px-8 py-3 sonic-button-primary">
                  <Coins size={20} />
                  <span>Create Your Coin</span>
                </Link>
                <Link href="/coins" className="px-8 py-3 sonic-button-outline">
                  <Music size={20} />
                  <span>Explore Coins</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 