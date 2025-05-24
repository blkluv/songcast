'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { useAccount } from 'wagmi';
import { Music, Search, Menu, X, User, LogOut, Disc, Headphones } from 'lucide-react';

// ClientOnly component to prevent hydration errors
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : null;
}

export default function Header() {
  const { address, isConnected } = useAccount();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [truncatedAddress, setTruncatedAddress] = useState<string>('');

  // Truncate wallet address for display
  useEffect(() => {
    if (address) {
      setTruncatedAddress(
        `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
      );
    }
  }, [address]);

  // Update header style on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-black border-b-2 border-white py-3 shadow-woodcut'
          : 'bg-black py-5'
      }`}
    >
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 border-2 border-white bg-woodcut-red">
              <Music className="w-7 h-7 text-white stroke-[3px]" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white uppercase">JERSEY CLUB</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="items-center hidden gap-8 md:flex">
            <Link 
              href="/marketplace"
              className="font-bold tracking-wide text-white uppercase transition-colors hover:text-woodcut-red"
            >
              Marketplace
            </Link>
            <Link 
              href="/artists"
              className="font-bold tracking-wide text-white uppercase transition-colors hover:text-woodcut-red"
            >
              Artists
            </Link>
            <Link 
              href="/marketplace/publish"
              className="font-bold tracking-wide text-white uppercase transition-colors hover:text-woodcut-red"
            >
              Publish
            </Link>
          </nav>

          {/* Desktop Buttons */}
          <div className="items-center hidden gap-4 md:flex">
            <ClientOnly>
              <div className="wallet-container">
                <Wallet className="wallet-container">
                  <ConnectWallet className="bg-woodcut-red border-2 border-white text-white font-bold uppercase tracking-wide px-5 py-2.5 text-white shadow-woodcut hover:bg-woodcut-orange transition-colors duration-300 flex items-center justify-center gap-2">
                    <Name address={address}/>
                  </ConnectWallet>
                  <WalletDropdown>
                    <div className="p-4 bg-black border-2 border-white shadow-woodcut">
                      <div className="pb-2 mb-2 text-lg font-bold text-white uppercase border-b-2 border-white">
                        <span>Wallet Details</span>
                      </div>
                      <div>
                        <Identity className="px-2 py-2" hasCopyAddressOnClick>
                          <Avatar />
                          <Name address={address}/>
                          <Address />
                          <EthBalance />
                        </Identity>
                        <WalletDropdownLink
                          icon="wallet"
                          href="https://keys.coinbase.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-2 mt-2 font-bold text-center text-white uppercase transition-colors border border-white bg-woodcut-red shadow-woodcut"
                        >
                          Wallet
                        </WalletDropdownLink>
                        <WalletDropdownDisconnect className="w-full px-4 py-2 mt-2 font-bold text-center text-white uppercase transition-colors bg-black border-2 border-white shadow-woodcut hover:bg-woodcut-red" />
                      </div>
                    </div>
                  </WalletDropdown>
                </Wallet>
              </div>
            </ClientOnly>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="text-white md:hidden"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? 
              <X size={28} className="stroke-[3px]" /> : 
              <Menu size={28} className="stroke-[3px]" />
            }
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 pt-20 bg-black border-2 border-white md:hidden shadow-woodcut-lg">
          <div className="container px-4 mx-auto">
            <nav className="flex flex-col gap-6 py-8">
              <Link
                href="/"
                className="flex items-center gap-3 py-2 text-xl font-bold text-white uppercase"
                onClick={closeMenu}
              >
                <Music size={28} className="text-woodcut-red stroke-[3px]" />
                <span>Home</span>
              </Link>

              <Link
                href="/marketplace"
                className="flex items-center gap-3 py-2 text-xl font-bold text-white uppercase"
                onClick={closeMenu}
              >
                <Disc size={28} className="text-woodcut-red stroke-[3px]" />
                <span>Marketplace</span>
              </Link>

              <Link
                href="/artists"
                className="flex items-center gap-3 py-2 text-xl font-bold text-white uppercase"
                onClick={closeMenu}
              >
                <User size={28} className="text-woodcut-red stroke-[3px]" />
                <span>Artists</span>
              </Link>

              <Link
                href="/marketplace/publish"
                className="flex items-center gap-3 py-2 text-xl font-bold text-white uppercase"
                onClick={closeMenu}
              >
                <Headphones size={28} className="text-woodcut-red stroke-[3px]" />
                <span>Publish Music</span>
              </Link>

              <div className="pt-4 mt-4 border-t-2 border-white">
                <ClientOnly>
                  <div className="wallet-container">
                    <Wallet className="wallet-container">
                      <ConnectWallet className="flex items-center justify-center w-full gap-2 px-5 py-3 font-bold tracking-wide text-white uppercase transition-colors duration-300 border-2 border-white bg-woodcut-red shadow-woodcut">
                        <Name address={address}/>
                      </ConnectWallet>
                    </Wallet>
                  </div>
                </ClientOnly>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
} 