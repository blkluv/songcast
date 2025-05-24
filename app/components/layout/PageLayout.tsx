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
    { label: 'Musik Coins', href: '/coins', icon: <Coins size={24} className="stroke-[3px]" /> },
    { label: 'Artists', href: '/artists', icon: <User size={24} className="stroke-[3px]" /> },
  ];
  
  // Handle connecting with MetaMask

  
  return (
    <div className="flex flex-col min-h-screen bg-black diagonal-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black border-b-2 border-white">
        <div className="container px-4 py-3 mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-12 h-12 border-2 border-white bg-woodcut-red">
                <span className="text-lg font-black text-white">JC</span>
              </div>
              <span className="pr-2 text-xl font-black tracking-tight uppercase">JERSEY CLUB</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="items-center hidden gap-6 md:flex">
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
                      <div className="flex items-center justify-center w-6 h-6">
                        <User size={18} className="text-white stroke-[3px]" />
                      </div>
                      <span className="hidden sm:inline">{shortenAddress(address)}</span>
                      <ChevronDown size={16} className={`stroke-[3px] transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isProfileMenuOpen && (
                      <div className="absolute right-0 z-40 w-48 py-2 mt-2 bg-black border-2 border-white shadow-woodcut-lg">
                        <div className="px-4 pb-2 mb-2 border-b-2 border-white">
                          <div className="text-sm font-bold uppercase">Wallet</div>
                          <div className="text-xs text-white">{shortenAddress(address)}</div>
                        </div>
                        <a 
                          href={`https://basescan.org/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors hover:bg-woodcut-red"
                        >
                          <span>View on Explorer</span>
                        </a>
                        <button 
                          onClick={() => {
                            disconnect();
                            setIsProfileMenuOpen(false);
                          }}
                          className="flex items-center w-full gap-2 px-4 py-2 text-sm font-bold text-left text-white uppercase transition-colors hover:bg-woodcut-red"
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
                      <div className="absolute right-0 z-40 w-64 mt-2 bg-black border-2 border-white shadow-woodcut-lg">
                        <div className="p-3 border-b-2 border-white">
                          <h3 className="text-sm font-bold text-center text-white uppercase">Select Wallet</h3>
                        </div>
                        <div className="p-4 space-y-3">
                          <button 
                            type="button"
                            onClick={() => {
                              connect({ connector: connectors[0] });
                              setIsProfileMenuOpen(false);
                            }}
                            className="flex items-center w-full gap-3 p-2 transition-colors border-2 border-white hover:bg-woodcut-red"
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
                            className="flex items-center w-full gap-3 p-2 transition-colors border-2 border-white hover:bg-woodcut-red"
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
                            className="flex items-center w-full gap-3 p-2 transition-colors border-2 border-white hover:bg-woodcut-red"
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
                className="inline-flex items-center justify-center p-2 text-white md:hidden"
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
          <div className="m-2 bg-black border-2 border-white md:hidden shadow-woodcut">
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
      <footer className="bg-black border-t-2 border-white">
        <div className="container px-4 py-10 mx-auto">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-10 h-10 border-2 border-white bg-woodcut-red">
                  <span className="text-sm font-black text-white">JC</span>
                </div>
                <span className="text-xl font-black tracking-tight uppercase">JERSEY CLUB</span>
              </div>
              <p className="mb-4 text-sm font-bold uppercase">
                Bold musik ownership through social tokens.
              </p>
            </div>
            
            <div>
              <h3 className="mb-4 text-xl font-black tracking-tight uppercase">Navigation</h3>
              <ul className="space-y-3">
                {navItems.map(item => (
                  <li key={item.href}>
                    <Link 
                      href={item.href}
                      className="flex items-center gap-2 font-bold tracking-wide uppercase transition-colors hover:text-woodcut-red"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="mb-4 text-xl font-black tracking-tight uppercase">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/faq" 
                    className="font-bold tracking-wide uppercase transition-colors hover:text-woodcut-red"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/terms" 
                    className="font-bold tracking-wide uppercase transition-colors hover:text-woodcut-red"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://docs.zora.co/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-bold tracking-wide uppercase transition-colors hover:text-woodcut-red"
                  >
                    Zora Docs
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="mb-4 text-xl font-black tracking-tight uppercase">Connect</h3>
              <div className="flex gap-3">
                <a 
                  href="https://twitter.com/dabusthebuilder" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 transition-colors bg-black border-2 border-white hover:bg-woodcut-red"
                >
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.4 5.6c-.8.3-1.6.6-2.5.7.9-.5 1.6-1.4 1.9-2.4-.8.5-1.8.9-2.7 1.1-.8-.8-1.9-1.3-3.1-1.3-2.3 0-4.2 1.9-4.2 4.2 0 .3 0 .6.1.9-3.5-.1-6.6-1.8-8.7-4.3-.4.6-.6 1.4-.6 2.1 0 1.5.7 2.7 1.9 3.5-.7 0-1.4-.2-2-.5v.1c0 2 1.4 3.7 3.4 4.1-.4.1-.7.1-1.1.1-.3 0-.5 0-.8-.1.5 1.7 2.1 2.9 3.9 2.9-1.4 1.1-3.2 1.8-5.2 1.8-.3 0-.7 0-1-.1 1.8 1.2 4 1.8 6.3 1.8 7.6 0 11.8-6.3 11.8-11.8v-.5c.8-.6 1.5-1.3 2.1-2.2z" />
                  </svg>
                </a>
                <a 
                  href="https://warpcast.com/dabus.eth" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 transition-colors bg-black border-2 border-white hover:bg-woodcut-red"
                >
                  <Image src="/fc.png" alt='Farcaster' width={24} height={24}></Image>
                </a>
                
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                © {new Date().getFullYear()} Jersey Club. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 