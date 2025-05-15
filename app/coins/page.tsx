'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Coins, Plus, GridIcon, Sparkles, ArrowRight, TrendingUp, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MusicCoinCard from '../components/MusicCoinCard';
import CreateMusicCoin from '../components/CreateMusicCoin';
import { useZoraEvents } from '../hooks/useZoraEvents';
import { Address, createPublicClient, custom } from 'viem';
import { base } from 'viem/chains';
import { getIpfsUrl } from '../services/pinataService';
import axios from 'axios';

// Known coin addresses to fetch immediately
const KNOWN_COIN_ADDRESSES = [
  '0xc8054286955448bafd9d438b71ef55b90626ccf2', // Example address, replace with actual known addresses
  '0x50Ca3d669E893dA18Cc55875e8Ec7a12ce36cdcf',
  '0x65b1409997826fbFff22a93e0959dC77fF0bCEa1',
  '0xafd68ffb2518117e026ad7c05c8327da2b3535e5',
  '0xA77890dcDA6De595BE130D770Ae9DB8Bb1bEA8Cc'
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

const MotionCoins = motion(Coins);

export default function MusicCoinsPage() {
  const { isConnected } = useAccount();
  const { coins, loading, error, refreshCoins, progressMessage } = useZoraEvents();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('featured');
  const [isRefreshing, setIsRefreshing] = useState(false);
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
  
  // Filter coins based on search term
  const filteredCoins = coins.filter(coin => 
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coin.artistName && coin.artistName.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Combine known coins with filtered coins, removing duplicates
  const allCoins = [...knownCoins];
  filteredCoins.forEach(coin => {
    if (!allCoins.some(knownCoin => knownCoin.coinAddress === coin.coinAddress)) {
      allCoins.push(coin);
    }
  });
  
  const toggleCreateForm = () => {
    setShowCreateForm(prev => !prev);
    
    // Reset search and tabs when toggling
    if (showCreateForm) {
      setSearchTerm('');
      setActiveTab('featured');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCoins();
    setIsRefreshing(false);
  };
  
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="gradient-text text-4xl font-bold mb-2 flex items-center gap-3">
                <MotionCoins 
                  size={32} 
                  className="text-primary"
                  animate={{ 
                    rotateY: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 2,
                    ease: "easeInOut",
                    times: [0, 0.6, 1],
                    repeat: Infinity,
                    repeatDelay: 5
                  }}
                />
                <span>Music Coins</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Create, trade, and collect coins for your favorite music artists
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleRefresh}
                className="sonic-button-outline py-2 px-4"
                disabled={isRefreshing}
              >
                <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
              
              <button 
                onClick={toggleCreateForm}
                className="sonic-button-primary py-3 px-6"
              >
                {showCreateForm ? (
                  <>
                    <GridIcon size={18} />
                    <span>Browse Coins</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Create Coin</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {!showCreateForm && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search coins by name, symbol, or artist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sonic-input pl-12 py-3 mb-6 md:mb-0"
              />
            </div>
          )}
        </motion.div>
      
        <AnimatePresence mode="wait">
          {showCreateForm ? (
            <motion.div
              key="create-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <CreateMusicCoin />
            </motion.div>
          ) : (
            <motion.div
              key="coin-listing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Information Cards */}
              <div className="sonic-glass-card p-8 mb-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles size={24} className="text-primary" />
                  <span>What are Music Coins?</span>
                </h2>
                
                <p className="text-muted-foreground mb-8 max-w-3xl">
                  Music Coins are social tokens that represent artists and their music. 
                  Create a coin for your music, build a community around your brand, and let fans 
                  invest in your success. All powered by Zora's token protocol on the blockchain.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="sonic-card p-6"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Coins size={20} className="text-primary" />
                      </div>
                      <h3 className="font-bold">For Artists</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Create a coin for your music and build a community around your brand.
                      Fans who hold your coin are invested in your success.
                    </p>
                    <div className="mt-4">
                      <button 
                        onClick={toggleCreateForm}
                        className="text-primary flex items-center text-sm hover:underline"
                      >
                        <span>Create your coin</span>
                        <ArrowRight size={14} className="ml-1" />
                      </button>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="sonic-card p-6"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <TrendingUp size={20} className="text-primary" />
                      </div>
                      <h3 className="font-bold">For Fans</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Support your favorite artists by buying their coins early.
                      As they grow more popular, so might the value of their coins.
                    </p>
                    <div className="mt-4">
                      <a href="#featured" className="text-primary flex items-center text-sm hover:underline">
                        <span>Discover artists</span>
                        <ArrowRight size={14} className="ml-1" />
                      </a>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="sonic-card p-6"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Sparkles size={20} className="text-primary" />
                      </div>
                      <h3 className="font-bold">For Traders</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Discover emerging artists and trade their coins.
                      Spot the next big thing before everyone else.
                    </p>
                    <div className="mt-4">
                      <a href="#featured" className="text-primary flex items-center text-sm hover:underline">
                        <span>Start trading</span>
                        <ArrowRight size={14} className="ml-1" />
                      </a>
                    </div>
                  </motion.div>
                </div>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-800 mb-8">
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'featured' 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-muted-foreground hover:text-white'
                  }`}
                  onClick={() => setActiveTab('featured')}
                >
                  Featured Coins
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'trending' 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-muted-foreground hover:text-white'
                  }`}
                  onClick={() => setActiveTab('trending')}
                >
                  Trending
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'newest' 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-muted-foreground hover:text-white'
                  }`}
                  onClick={() => setActiveTab('newest')}
                >
                  Newest
                </button>
              </div>
              
              {/* Coins Grid */}
              <div id="featured" className="mb-12">
                {loading && knownCoinsLoading ? (
                  <div className="sonic-card p-12 text-center">
                    <div className="spinner-md mx-auto mb-4"></div>
                    <h3 className="text-xl font-medium mb-2">Loading Music Coins</h3>
                    <p className="text-muted-foreground">
                      {progressMessage || "Fetching coins from the Zora protocol..."}
                    </p>
                  </div>
                ) : error && knownCoins.length === 0 ? (
                  <div className="sonic-card p-12 text-center">
                    <div className="text-5xl mb-4 text-red-500">
                      <AlertCircle size={64} className="mx-auto" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Error Loading Coins</h3>
                    <p className="text-muted-foreground mb-6">
                      {error.message || "There was an error fetching coins from the blockchain."}
                    </p>
                    <button
                      onClick={handleRefresh}
                      className="sonic-button-outline mx-auto"
                    >
                      <RefreshCw size={16} />
                      <span>Try Again</span>
                    </button>
                  </div>
                ) : allCoins.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {allCoins.map((coin) => (
                      <MusicCoinCard
                        key={coin.coinAddress}
                        coinAddress={coin.coinAddress}
                        name={coin.name}
                        symbol={coin.symbol}
                        description={coin.description}
                        artistName={coin.artistName}
                        artistAddress={coin.artistAddress}
                        coverArt={coin.coverArt}
                        audioUrl={coin.audioUrl}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="sonic-card p-12 text-center">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-xl font-medium mb-2">No coins found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm 
                        ? "We couldn't find any coins matching your search criteria."
                        : "No music coins have been created yet with our platform referrer."
                      }
                    </p>
                    {searchTerm ? (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="sonic-button-outline mx-auto"
                      >
                        Clear Search
                      </button>
                    ) : (
                      <button
                        onClick={toggleCreateForm}
                        className="sonic-button-primary mx-auto"
                      >
                        <Plus size={16} />
                        <span>Create First Coin</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* CTA Section */}
              <div className="text-center py-10">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-3">Ready to launch your music coin?</h3>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    Create your own token, build a community around your music, and let your fans 
                    support your journey directly.
                  </p>
                </div>
                <button 
                  onClick={toggleCreateForm}
                  className="sonic-button-primary py-3 px-8 mx-auto"
                >
                  <Plus size={18} />
                  <span>Create Your Coin</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
} 