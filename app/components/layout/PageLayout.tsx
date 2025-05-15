'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Music, Coins, Home, ChevronDown, User, LogIn, LogOut, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAccount, useDisconnect, useConnect } from 'wagmi';

// Client-only wrapper to prevent hydration errors
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : <div style={{ visibility: 'hidden', height: 0, overflow: 'hidden' }}></div>;
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  const toggleProfileMenu = () => setIsProfileMenuOpen(prev => !prev);
  
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Define navigation items
  const navItems = [
    { label: 'Home', href: '/', icon: <Home size={24} className="stroke-[3px]" /> },
    { label: 'Music Coins', href: '/coins', icon: <Coins size={24} className="stroke-[3px]" /> },
    { label: 'Artists', href: '/artists', icon: <User size={24} className="stroke-[3px]" /> },
  ];
  
  // Handle connecting with MetaMask

  
  return (
    <div className="flex flex-col min-h-screen bg-black diagonal-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-white bg-black">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-12 h-12 bg-woodcut-red border-2 border-white flex items-center justify-center">
                <span className="text-white font-black text-lg">SC</span>
              </div>
              <span className="font-black text-xl uppercase tracking-tight pr-2">SONGCAST</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`flex items-center gap-1.5 py-1 px-2 uppercase font-bold tracking-wide transition-colors ${
                    pathname === item.href 
                      ? 'text-woodcut-red' 
                      : 'text-white hover:text-woodcut-orange'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            
            {/* Right Side - Auth */}
            <div className="flex items-center gap-4">
              <ClientOnly>
                {isConnected && address ? (
                  <div className="relative">
                    <button 
                      onClick={toggleProfileMenu}
                      className="flex items-center gap-2 py-1.5 px-3 border-2 border-white bg-black hover:bg-woodcut-red transition-colors uppercase font-bold shadow-woodcut-white"
                    >
                      <div className="w-6 h-6 flex items-center justify-center">
                        <User size={18} className="text-white stroke-[3px]" />
                      </div>
                      <span className="hidden sm:inline">{shortenAddress(address)}</span>
                      <ChevronDown size={16} className={`stroke-[3px] transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 py-2 bg-black border-2 border-white shadow-woodcut-lg z-40">
                        <div className="border-b-2 border-white pb-2 mb-2 px-4">
                          <div className="text-sm font-bold uppercase">Wallet</div>
                          <div className="text-xs text-white">{shortenAddress(address)}</div>
                        </div>
                        <a 
                          href={`https://basescan.org/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 text-sm uppercase font-bold hover:bg-woodcut-red transition-colors"
                        >
                          <span>View on Explorer</span>
                        </a>
                        <button 
                          onClick={() => {
                            disconnect();
                            setIsProfileMenuOpen(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-white uppercase font-bold hover:bg-woodcut-red transition-colors w-full text-left"
                        >
                          <LogOut size={16} className="stroke-[3px]" />
                          <span>Disconnect</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={toggleProfileMenu}
                      className="sonic-button-primary py-1.5 px-3 text-xs"
                    >
                      <LogIn size={18} className="stroke-[3px]" />
                      <span>Connect Wallet</span>
                    </button>
                    
                    {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-black border-2 border-white shadow-woodcut-lg z-40">
                        <div className="border-b-2 border-white p-3">
                          <h3 className="text-white font-bold uppercase text-sm text-center">Select Wallet</h3>
                        </div>
                        <div className="p-4 space-y-3">
                          <button 
                            type="button"
                            onClick={() => {
                              connect({ connector: connectors[0] });
                              setIsProfileMenuOpen(false);
                            }}
                            className="flex items-center gap-3 p-2 w-full border-2 border-white hover:bg-woodcut-red transition-colors"
                          >
                            <LogIn size={18} className="stroke-[3px]" />
                            <span className="font-bold">Warpcast</span>
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => {
                              connect({ connector: connectors[1] });
                              setIsProfileMenuOpen(false);
                            }}
                            className="flex items-center gap-3 p-2 w-full border-2 border-white hover:bg-woodcut-red transition-colors"
                          >
                            <LogIn size={18} className="stroke-[3px]" />
                            <span className="font-bold">Coinbase Wallet</span>
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => {
                              connect({ connector: connectors[2] });
                              setIsProfileMenuOpen(false);
                            }}
                            className="flex items-center gap-3 p-2 w-full border-2 border-white hover:bg-woodcut-red transition-colors"
                          >
                            <LogIn size={18} className="stroke-[3px]" />
                            <span className="font-bold">Injected</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ClientOnly>
              
              {/* Mobile Menu Button */}
              <button 
                onClick={toggleMenu}
                className="inline-flex md:hidden items-center justify-center p-2 text-white"
              >
                {isMenuOpen ? 
                  <X size={28} className="stroke-[3px]" /> : 
                  <Menu size={28} className="stroke-[3px]" />
                }
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-black m-2 border-2 border-white shadow-woodcut">
            <nav className="flex flex-col py-2">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-2 py-3 px-4 uppercase font-bold ${
                    pathname === item.href 
                      ? 'text-woodcut-red' 
                      : 'text-white hover:text-woodcut-orange'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t-2 border-white bg-black">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-woodcut-red border-2 border-white flex items-center justify-center">
                  <span className="text-white font-black text-sm">SC</span>
                </div>
                <span className="font-black text-xl uppercase tracking-tight">SONGCAST</span>
              </div>
              <p className="text-sm mb-4 uppercase font-bold">
                Bold music ownership through social tokens.
              </p>
            </div>
            
            <div>
              <h3 className="font-black uppercase mb-4 text-xl tracking-tight">Navigation</h3>
              <ul className="space-y-3">
                {navItems.map(item => (
                  <li key={item.href}>
                    <Link 
                      href={item.href}
                      className="uppercase font-bold tracking-wide hover:text-woodcut-red transition-colors flex items-center gap-2"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-black uppercase mb-4 text-xl tracking-tight">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/faq" 
                    className="uppercase font-bold tracking-wide hover:text-woodcut-red transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/terms" 
                    className="uppercase font-bold tracking-wide hover:text-woodcut-red transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://docs.zora.co/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="uppercase font-bold tracking-wide hover:text-woodcut-red transition-colors"
                  >
                    Zora Docs
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-black uppercase mb-4 text-xl tracking-tight">Connect</h3>
              <div className="flex gap-3">
                <a 
                  href="https://twitter.com/dabusthebuilder" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 border-2 border-white bg-black hover:bg-woodcut-red transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.4 5.6c-.8.3-1.6.6-2.5.7.9-.5 1.6-1.4 1.9-2.4-.8.5-1.8.9-2.7 1.1-.8-.8-1.9-1.3-3.1-1.3-2.3 0-4.2 1.9-4.2 4.2 0 .3 0 .6.1.9-3.5-.1-6.6-1.8-8.7-4.3-.4.6-.6 1.4-.6 2.1 0 1.5.7 2.7 1.9 3.5-.7 0-1.4-.2-2-.5v.1c0 2 1.4 3.7 3.4 4.1-.4.1-.7.1-1.1.1-.3 0-.5 0-.8-.1.5 1.7 2.1 2.9 3.9 2.9-1.4 1.1-3.2 1.8-5.2 1.8-.3 0-.7 0-1-.1 1.8 1.2 4 1.8 6.3 1.8 7.6 0 11.8-6.3 11.8-11.8v-.5c.8-.6 1.5-1.3 2.1-2.2z" />
                  </svg>
                </a>
                <a 
                  href="https://warpcast.com/dabus.eth" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 border-2 border-white bg-black hover:bg-woodcut-red transition-colors flex items-center justify-center"
                >
                  <Image src="/fc.png" alt='Farcaster' width={24} height={24}></Image>
                </a>
                
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                © {new Date().getFullYear()} SongCast. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 