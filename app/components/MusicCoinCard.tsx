'use client';

import React, { useState, useRef } from 'react';
import { Address } from 'viem';
import { Coins, ExternalLink, ChevronDown, ChevronUp, Info, Share2, User2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import TradeMusicCoin from './TradeMusicCoin';
import FarcasterFrameEmbed from './FarcasterFrameEmbed';
import { useRouter } from 'next/navigation';


export interface MusicCoinCardProps {
  coinAddress: Address;
  name: string;
  symbol: string;
  description: string;
  artistName: string;
  artistAddress: Address;
  coverArt: string;
  audioUrl?: string;
  isSharedPage?: boolean;
}

export default function MusicCoinCard({
  coinAddress,
  name,
  symbol,
  description,
  artistName,
  artistAddress,
  coverArt,
  audioUrl,
  isSharedPage = false
}: MusicCoinCardProps) {
  const [showTrade, setShowTrade] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toggleTrade = () => {
    setShowTrade(prev => !prev);
    
    // Scroll to the card if trading panel is opened
    if (!showTrade && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Generate absolute URL for Farcaster sharing
  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    
    const baseUrl = window.location.origin;
    return `${baseUrl}/coins/share/${coinAddress}`;
  };

  // Add Farcaster frame embed if this is a shared page
  const renderFarcasterEmbed = () => {
    if (!isSharedPage) return null;
    
    return (
      <FarcasterFrameEmbed
        coinAddress={coinAddress}
        buttonText="Trade Coin"
        appName="Jersey Club"
      />
    );
  };
  
  // Copy share URL to clipboard
  const copyShareUrl = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      alert('Share URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <motion.div 
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1]
      }}
      className="border-[4px] border-black relative transition-all duration-300 hover:translate-y-[-4px] group w-full max-w-sm mx-auto"
      style={{ backgroundImage: 'repeating-linear-gradient(-45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 2px, transparent 2px, transparent 8px)' }}
    >
      {renderFarcasterEmbed()}
      
      {/* Right vertical red border */}
      <div className="absolute top-0 bottom-0 right-0 w-2 bg-woodcut-red"></div>
      
      <div className="border-0 shadow-none woodcut-card">
        <Link href={`/coins/${coinAddress}`} className="block">
          <div className="relative aspect-square">
            {/* Cover art container with fixed dimensions */}
            <div className="relative w-full h-full">
              {coverArt ? (
                <Image 
                  src={coverArt} 
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover" 
                  priority
                  unoptimized={true}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-black">
                  <Coins size={64} className="text-white stroke-[3px]" />
                </div>
              )}
            </div>
            
            {/* Header badge */}
            <div className="absolute top-0 right-0 z-20 p-2 font-bold tracking-wide text-black uppercase bg-white">
              <span>{symbol || ""}</span>
            </div>
          </div>
        </Link>
        
        {/* Title band */}
        <div className="bg-[#2a2215] py-2 px-4 border-y-2 border-white">
          <div className="flex items-center">
            <span className="text-sm font-bold text-white">{name || ""}</span>
          </div>
        </div>
        
        {/* Wallet address strip */}
        <div className="flex items-center px-4 py-2 bg-black border-b-2 border-white">
          <div className="flex items-center justify-center w-6 h-6 mr-2 bg-black border border-white">
            <span className="text-xs text-white">⬦</span>
          </div>
          <div className="font-mono text-xs text-white truncate">
            {coinAddress || ""}
          </div>
        </div>
        
        <div className="p-4 bg-black">
          <p className="mb-8 text-sm text-white line-clamp-2">
            {description || ""}
          </p>
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                onClick={toggleTrade}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold tracking-wide text-white uppercase border-2 border-white bg-woodcut-red"
              >
                <span>Trade Coin</span>
                <ChevronDown size={16} className="stroke-[3px]" />
              </button>
              
              <button
                onClick={copyShareUrl}
                className="flex items-center gap-1 px-3 py-2 text-sm font-bold tracking-wide text-white uppercase bg-black border-2 border-white"
                title="Share to Farcaster"
              >
                <Share2 size={16} className="stroke-[3px]" />
              </button>
              <button
                onClick={() => router.push(`/artists/${artistAddress}`)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-bold tracking-wide text-white uppercase bg-black border-2 border-white"
                title="View Artist Profile"
              >
                <User2 size={16} className="stroke-[3px]" />
              </button>
            </div>
            
            <div className="flex items-center flex-shrink-0 gap-3">
              <Link
                href={`/coins/${coinAddress}`}
                aria-label="View details"
                className="flex items-center gap-1 text-sm font-bold text-white uppercase transition-colors hover:text-woodcut-orange"
              >
                Details
              </Link>
              
              <a
                href={`https://basescan.org/address/${coinAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on blockchain"
                className="flex items-center gap-1 text-sm font-bold text-white uppercase transition-colors hover:text-woodcut-orange"
              >
                <ExternalLink size={18} className="stroke-[3px] flex-shrink-0" />
              </a>
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {showTrade && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="px-5 pb-5 overflow-hidden bg-black"
            >
              <div className="pt-4 border-t-2 border-white">
                <TradeMusicCoin
                  coinAddress={coinAddress}
                  coinName={name}
                  coinSymbol={symbol}
                  artistName={artistName}
                  coverArt={coverArt}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 