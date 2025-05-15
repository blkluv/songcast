'use client';

import React, { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { Button } from '../components/ui/button';
import { Coins, Music, Share, Sparkles, User } from 'lucide-react';

// Get the base URL from environment or use a fallback for local development
const BASE_URL = 'https://songcast.vercel.app';

export default function FarcasterMiniApp() {
  const [isReady, setIsReady] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // Hide splash screen when component is mounted
    const setupApp = async () => {
      try {
        // Signal the app is ready to display
        await sdk.actions.ready();
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing mini app:', error);
      }
    };

    setupApp();
  }, []);

  const handleSignIn = async () => {
    try {
      const result = await sdk.actions.signIn({
        nonce: 'sonic-' + Math.random().toString(36).substring(2, 10), // Generate a random nonce
      });
      
      if (result) {
        setUserInfo(result);
        console.log('Signed in successfully:', result);
        
        // You could make a request to your backend to verify the signature
        // and establish a session for the user
        try {
          const response = await fetch(`${BASE_URL}/api/auth/verify-siwf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: result.message,
              signature: result.signature,
            }),
          });
          
          const data = await response.json();
          if (data.success) {
            // Store user data or token as needed
            console.log('Authentication successful:', data);
          }
        } catch (authError) {
          console.error('Error verifying authentication:', authError);
        }
      }
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleShareOnFarcaster = async () => {
    try {
      // Open a URL to share content instead of using composeCast
      await sdk.actions.openUrl('https://warpcast.com/~/compose?text=' + 
        encodeURIComponent(`Coin your music directly on Farcaster! 🎵 songcast.vercel.app`));
    } catch (error) {
      console.error('Error sharing on Farcaster:', error);
    }
  };

  const handleViewProfile = async () => {
    try {
      // Replace with a real FID when you have one
      await sdk.actions.viewProfile({ fid: 1 }); 
    } catch (error) {
      console.error('Error viewing profile:', error);
    }
  };

  const handleExploreCoins = () => {
    // Navigate to the coins page
    window.location.href = `https://songcast.vercel.app/coins`;
  };

  const handleDiscoverMusic = () => {
    // Navigate to the music discovery page
    window.location.href = `https://songcast.vercel.app/artists`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-black to-purple-950">
      <div className="sonic-glass-card p-8 rounded-2xl w-full max-w-md">
      <div className="inline-flex items-center bg-black border-2 border-white shadow-woodcut px-4 py-2 mb-6">
                <Sparkles size={20} className="text-woodcut-red mr-2 stroke-[3px]" />
                <span className="text-sm uppercase font-bold tracking-wide">Introducing Music Coins</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase mb-6 leading-tight tracking-tight text-shadow-md">
                COIN YOUR
                <span className="gradient-text block mt-2">MUSIC</span>
              </h1>
              
              <p className="text-xl mb-8 max-w-xl mx-auto lg:mx-0 uppercase font-bold">
                Explore the SongCast miniapp
              </p>
      
        
        <div className="flex flex-col gap-4">
  
          
          <Button 
            className="sonic-button-outline py-3 px-6"
            onClick={handleShareOnFarcaster}
          >
            <Share size={20} className="mr-2 text-white" />
            <span style={{color:'white'}}>Share on Farcaster</span>
          </Button>
          
   
          
          <div className="flex justify-between mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExploreCoins}
            >
              <Coins size={16} className="mr-2" />
              Explore Coins
            </Button>
            
          </div>
        </div>
      </div>
    </div>
  );
} 