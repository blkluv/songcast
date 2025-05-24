'use client';

import React, { useState, useEffect } from 'react';
import { useZoraEvents } from '../hooks/useZoraEvents';
import { motion } from 'framer-motion';
import { Search, User, Music, Coins } from 'lucide-react';
import MusicCoinCard from '../components/MusicCoinCard';
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

// Create a public client
const publicClient = createPublicClient({
  chain: base,
  transport: custom({
    async request({ method, params }) {
      try {
        const response = await axios.post('/api/rpc', {
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params,
        });
        
        if (response.data.error) {
          throw new Error(response.data.error.message || 'RPC request failed');
        }
        
        return response.data.result;
      } catch (error) {
        console.error('Error with proxy transport:', error);
        throw error;
      }
    },
  }),
});

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

// Function to fetch token metadata from IPFS
async function fetchTokenMetadata(uri: string) {
  try {
    let fetchUri = uri;
    if (uri.startsWith('ipfs://')) {
      fetchUri = getIpfsUrl(uri);
    }
    
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
    
    const metadata = await fetchTokenMetadata(tokenUri as string);
    
    if (!metadata) {
      throw new Error('Failed to fetch token metadata');
    }
    
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
    
    return {
      coinAddress: address,
      name: name as string,
      symbol: symbol as string,
      description,
      artistName: artistName as string,
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

interface ArtistCoins {
  artistAddress: Address;
  artistName: string;
  coins: any[];
}

interface Coin {
  coinAddress: string;
  name: string;
  symbol: string;
  description: string;
  artistName: string;
  artistAddress: Address;
  coverArt: string;
  audioUrl: string;
  metadata: any;
}

export default function ArtistsPage() {
  const { coins, loading, error, progressMessage } = useZoraEvents();
  const [searchTerm, setSearchTerm] = useState('');
  const [artistCoins, setArtistCoins] = useState<ArtistCoins[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
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

        // Group known coins by artist immediately
        const grouped = validCoins.reduce((acc: Record<string, ArtistCoins>, coin: any) => {
          if (!coin) return acc;
          const key = coin.artistAddress.toLowerCase();
          if (!acc[key]) {
            acc[key] = {
              artistAddress: coin.artistAddress,
              artistName: coin.artistName,
              coins: []
            };
          }
          acc[key].coins.push(coin);
          return acc;
        }, {});

        setArtistCoins(Object.values(grouped));
      } catch (error) {
        console.error('Error fetching known coins:', error);
      } finally {
        setKnownCoinsLoading(false);
      }
    };
    
    fetchKnownCoins();
  }, []);

  // Update artist coins when new coins are fetched
  useEffect(() => {
    if (!coins) return;

    const allCoins = [...knownCoins];
    coins.forEach(coin => {
      if (!allCoins.some(knownCoin => knownCoin.coinAddress === coin.coinAddress)) {
        allCoins.push(coin);
      }
    });

    const grouped = allCoins.reduce((acc: Record<string, ArtistCoins>, coin: any) => {
      if (!coin) return acc;
      const key = coin.artistAddress.toLowerCase();
      if (!acc[key]) {
        acc[key] = {
          artistAddress: coin.artistAddress,
          artistName: coin.artistName,
          coins: []
        };
      }
      acc[key].coins.push(coin);
      return acc;
    }, {});

    setArtistCoins(Object.values(grouped));
  }, [coins, knownCoins]);

  // Filter artists based on search term
  const filteredArtists = artistCoins.filter(artist => 
    artist.artistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.artistAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen">
      <div className="container px-4 py-8 mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="flex items-center gap-3 mb-2 text-4xl font-bold gradient-text">
            <User size={32} className="text-primary" />
            <span>Musik Artists</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover artists and their musik coins
          </p>

          {/* Search Bar */}
          <div className="relative mt-6">
            <input
              type="text"
              placeholder="Search artists by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 pl-12 sonic-input"
            />
            <Search className="absolute transform -translate-y-1/2 left-4 top-1/2 text-muted-foreground" size={20} />
          </div>
        </motion.div>

        {/* Content */}
        {(loading || knownCoinsLoading) ? (
          <div className="p-12 text-center sonic-card">
            <div className="mx-auto mb-4 spinner-md"></div>
            <h3 className="mb-2 text-xl font-medium">Loading Artists</h3>
            <p className="text-muted-foreground">
              {progressMessage || "Fetching artists and their coins..."}
            </p>
          </div>
        ) : error ? (
          <div className="p-12 text-center sonic-card">
            <div className="mb-4 text-5xl text-red-500">⚠️</div>
            <h3 className="mb-2 text-xl font-medium">Error Loading Artists</h3>
            <p className="text-muted-foreground">
              {error.message || "There was an error fetching artists data."}
            </p>
          </div>
        ) : filteredArtists.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredArtists.map((artist) => (
              <motion.div
                key={artist.artistAddress}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="p-6 sonic-card"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
                    <Music size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold"><ShortAddressLink address={artist.coins[0].artistAddress}/></h3>
                    <p className="text-sm text-muted-foreground">
                      {artist.coins.length} {artist.coins.length === 1 ? 'coin' : 'coins'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {artist.coins.map((coin) => (
                    <div key={coin.coinAddress} className="p-4 sonic-card">
                      <div className="flex items-center gap-3">
                        <Coins size={20} className="text-primary" />
                        <div>
                          <h4 className="font-medium">{coin.name}</h4>
                          <p className="text-sm text-muted-foreground">{coin.symbol}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm line-clamp-2">{coin.description}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedArtist(selectedArtist === artist.artistAddress ? null : artist.artistAddress)}
                  className="w-full mt-4 sonic-button-outline"
                >
                  {selectedArtist === artist.artistAddress ? 'Hide Details' : 'View Details'}
                </button>

                {selectedArtist === artist.artistAddress && (
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    {artist.coins.map((coin) => (
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
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center sonic-card">
            <div className="mb-4 text-5xl">🔍</div>
            <h3 className="mb-2 text-xl font-medium">No artists found</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "We couldn't find any artists matching your search criteria."
                : "No artists have created music coins yet."
              }
            </p>
          </div>
        )}
      </div>
    </main>
  );
} 