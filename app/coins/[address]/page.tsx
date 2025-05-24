'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coins, 
  ArrowLeft, 
  ExternalLink, 
  Share, 
  Music,
  User,
  AudioLines
} from 'lucide-react';
import IPFSAudio from '../../components/IPFSAudio';
import TradeMusicCoin from '../../components/TradeMusicCoin';
import { Address, createPublicClient, custom } from 'viem';
import { base } from 'viem/chains';
import { getIpfsUrl } from '../../services/pinataService';
import axios from 'axios';
import { sdk } from '@farcaster/frame-sdk';

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

interface CoinDetailProps {
  params: {
    address: string;
  }
}

export default function CoinDetail() {
  const params = useParams();
  const address = params.address as Address;
  const [coin, setCoin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch the coin data directly from the contract
  useEffect(() => {
    const fetchCoinData = async () => {
      if (!address) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching data for coin: ${address}`);
        
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
        
        console.log(`Token URI: ${tokenUri}`);
        
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
        const coinData = {
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
        
        setCoin(coinData);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching coin data:', err);
        setError(err.message || 'Failed to fetch coin data');
        setLoading(false);
      }
    };
    
    fetchCoinData();
  }, [address]);

  // Function to handle audio playback errors
  const handlePlayError = () => {
    console.error('Failed to play audio file');
    setError('Failed to play the audio file. The music file might be unavailable or in an unsupported format.');
  };

  type Props = {
    address: string;
  };
  
  const ShortAddressLink: React.FC<Props> = ({ address }) => {
    if (!address) return null;
  
    const shortAddress = `${address.slice(0, 2)}...${address.slice(-3)}`;
  
    return (
      <a
        href={`https://basescan.org/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        title={address}
      >
        {shortAddress}
      </a>
    );
  };
  // Function to share the coin on Farcaster
  const shareCoinOnFarcaster = async () => {
    if (!coin) return;
    
    try {
      // Check if in a Farcaster mini app environment
      if (typeof sdk !== 'undefined' && sdk.actions && sdk.actions.openUrl) {
        // Get the base URL from environment or default to the vercel deployment
        const baseUrl = 'https://jerseyclub.io';
        
        // Create share text
        const shareText = `Check out ${coin.name} (${coin.symbol}) by ${coin.artistName} on Jersey Club! 🎵 ${baseUrl}/coins/${address}`;
        
        // Open in Warpcast compose
        await sdk.actions.openUrl('https://warpcast.com/~/compose?text=' + 
          encodeURIComponent(shareText));
      } else {
        // Fallback for non-Farcaster environments
        if (navigator.share) {
          try {
            await navigator.share({
              title: `${coin.name} (${coin.symbol}) by ${coin.artistName}`,
              text: `Check out ${coin.name} by ${coin.artistName} on Jersey Club!`,
              url: window.location.href
            });
          } catch (e) {
            console.error('Error sharing:', e);
          }
        } else {
          // Copy to clipboard if sharing isn't available
          navigator.clipboard.writeText(window.location.href);
          alert('Link copied to clipboard!');
        }
      }
    } catch (error) {
      console.error('Error sharing on Farcaster:', error);
    }
  };

  // Function to refresh the coin data
  const refreshCoin = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      setError(null);
      setCoin(null);
      
      const fetchCoinData = async () => {
        // ... Existing fetch logic
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
          }).catch(() => null)
        ]);
        
        // Fetch metadata from IPFS
        const metadata = await fetchTokenMetadata(tokenUri as string);
        
        if (!metadata) {
          throw new Error('Failed to fetch token metadata');
        }
        
        // Process metadata
        const description = metadata.description || '';
        const artistName = metadata.artist || 'Unknown Artist';
        
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
        
        const coinData = {
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
        
        setCoin(coinData);
        setLoading(false);
      };
      
      await fetchCoinData();
    } catch (err: any) {
      console.error('Error refreshing coin data:', err);
      setError(err.message || 'Failed to refresh coin data');
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen px-4 py-16 mx-auto">
        <div className="w-full max-w-md p-8 text-center sonic-glass-card rounded-2xl">
          <Coins className="w-16 h-16 mx-auto mb-6 text-primary animate-pulse" />
          <h2 className="mb-4 text-2xl font-bold">Loading Coin Details</h2>
          <p className="text-muted-foreground">Please wait while we fetch the coin information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !coin) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen px-4 py-16 mx-auto">
        <div className="w-full max-w-md p-8 text-center sonic-glass-card rounded-2xl">
          <Coins className="w-16 h-16 mx-auto mb-6 text-red-500" />
          <h2 className="mb-4 text-2xl font-bold">Coin Not Found</h2>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <div className="flex flex-col gap-4">
            <button 
              onClick={refreshCoin} 
              className="px-4 py-2 sonic-button-primary"
            >
              Try Again
            </button>
            <Link href="/coins" className="px-4 py-2 sonic-button-outline">
              <ArrowLeft size={16} className="mr-2" />
              Back to All Coins
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default state when no coin is found yet
  if (!coin) {
    return null;
  }

  return (
    <main className="min-h-screen py-12">
      <div className="container px-4 mx-auto">
        {/* Back button */}
        <Link 
          href="/coins" 
          className="inline-flex items-center gap-2 mb-8 transition-colors text-muted-foreground hover:text-white"
        >
          <ArrowLeft size={18} />
          <span>Back to All Coins</span>
        </Link>
        
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Left Column - Cover Art and Audio Player */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="p-4 overflow-hidden sonic-glass-card rounded-2xl"
            >
              {/* Cover Art */}
              <div className="relative mb-6 overflow-hidden aspect-square rounded-xl">
                {coin.coverArt ? (
                  <Image 
                    src={coin.coverArt} 
                    alt={coin.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover" 
                    priority
                    unoptimized={true}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/30 to-primary/10">
                    <Coins size={64} className="text-primary/50" />
                  </div>
                )}
                
                {/* Symbol badge */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold z-20 border border-white/10">
                  {coin.symbol}
                </div>
              </div>
              
              {/* Audio Player */}
              {coin.audioUrl && (
                <div className="relative">
                  <div className="flex items-center justify-center mb-4">
                    <IPFSAudio 
                      src={coin.audioUrl}
                      onPlayError={handlePlayError}
                      className="mx-auto"
                    />
                  </div>
                  
                  {/* Audio waveform visualization - static for now */}
                  <div className="flex items-center justify-center h-16 gap-1 mb-4">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div 
                        key={i}
                        className="w-1 h-6 rounded-full bg-primary/30"
                        style={{
                          height: `${Math.sin(i / 3) * 16 + 12}px`,
                          opacity: 0.3 + Math.sin(i / 5) * 0.7
                        }}
                      />
                    ))}
                  </div>
                  
                  {error && (
                    <div className="mb-4 text-xs text-center text-red-400">
                      {error}
                    </div>
                  )}
                  
                  <div className="mb-2 text-sm text-center text-muted-foreground">
                    <AudioLines size={16} className="inline-block mr-2" />
                    <span>Listen to this musik coin</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
          
          {/* Right Column - Coin Details and Trading */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Coin Details */}
              <div className="p-8 mb-8 sonic-glass-card rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
                    <Coins size={24} className="text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold gradient-text">
                      {coin.name}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User size={14} />
                      <ShortAddressLink address={coin.artistAddress} />
                    </div>
                  </div>
                </div>
                
                <p className="mb-8 text-lg text-muted-foreground">
                  {coin.description}
                </p>
                
                <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
                  <div className="p-4 sonic-card">
                    <div className="mb-1 text-sm text-muted-foreground">Token Address</div>
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-xs truncate max-w-[200px]">
                        {coin.coinAddress}
                      </div>
                      <a
                        href={`https://basescan.org/token/${coin.coinAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors text-primary hover:text-primary/80"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                  
                  <div className="p-4 sonic-card">
                    <div className="mb-1 text-sm text-muted-foreground">Artist Address</div>
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-xs truncate max-w-[200px]">
                        {coin.artistAddress}
                      </div>
                      <a
                        href={`https://basescan.org/address/${coin.artistAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors text-primary hover:text-primary/80"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={shareCoinOnFarcaster}
                    className="px-4 py-2 sonic-button-outline"
                  >
                    <Share size={16} className="mr-2" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
              
              {/* Trading Section */}
              <div className="p-8 sonic-glass-card rounded-2xl">
                <h2 className="flex items-center gap-3 mb-6 text-2xl font-bold">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20">
                    <Coins size={20} className="text-primary" />
                  </div>
                  <span>Trade Coin</span>
                </h2>
                
                <TradeMusicCoin
                  coinAddress={coin.coinAddress}
                  coinName={coin.name}
                  coinSymbol={coin.symbol}
                  artistName={coin.artistName}
                  coverArt={coin.coverArt}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
} 