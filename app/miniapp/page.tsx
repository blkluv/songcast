'use client';

import React, { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { Button } from '../components/ui/button';
import { Coins, Music, Share, Sparkles, User } from 'lucide-react';

const BASE_URL = 'https://jerseyclub.io';

export default function FarcasterMiniApp() {
  const [isReady, setIsReady] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const setupApp = async () => {
      try {
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
        nonce: 'sonic-' + Math.random().toString(36).substring(2, 10),
      });

      if (result) {
        setUserInfo(result);
        console.log('Signed in successfully:', result);

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
      await sdk.actions.openUrl(
        'https://warpcast.com/~/compose?text=' +
          encodeURIComponent(`Coin your Jersey Club musik directly on Farcaster! 🎵 jerseyclub.io`)
      );
    } catch (error) {
      console.error('Error sharing on Farcaster:', error);
    }
  };

  const handleViewProfile = async () => {
    try {
      // TODO: Replace 1 with actual FID
      await sdk.actions.viewProfile({ fid: 1 });
    } catch (error) {
      console.error('Error viewing profile:', error);
    }
  };

  const handleExploreCoins = () => {
    window.location.href = `${BASE_URL}/coins`;
  };

  const handleDiscoverMusic = () => {
    window.location.href = `${BASE_URL}/artists`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-black to-purple-950">
      <div className="w-full max-w-md p-8 sonic-glass-card rounded-2xl">
        <div className="inline-flex items-center px-4 py-2 mb-6 bg-black border-2 border-white shadow-woodcut">
          <Sparkles size={20} className="text-woodcut-red mr-2 stroke-[3px]" />
          <span className="text-sm font-bold tracking-wide uppercase">Introducing Musik Coins</span>
        </div>
        <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight uppercase md:text-6xl lg:text-7xl text-shadow-md">
          COIN YOUR
          <span className="block mt-2 gradient-text">MUSIK</span>
        </h1>

        <p className="max-w-xl mx-auto mb-8 text-xl font-bold uppercase lg:mx-0">
          Explore the Jersey Club miniapp
        </p>

        <div className="flex flex-col gap-4">
          <Button className="px-6 py-3 sonic-button-outline" onClick={handleSignIn}>
            <User size={20} className="mr-2 text-white" />
            <span style={{ color: 'white' }}>Sign In with Farcaster</span>
          </Button>

          <Button className="px-6 py-3 sonic-button-outline" onClick={handleShareOnFarcaster}>
            <Share size={20} className="mr-2 text-white" />
            <span style={{ color: 'white' }}>Share on Farcaster</span>
          </Button>

          <div className="flex justify-between mt-4">
            <Button variant="outline" size="sm" onClick={handleExploreCoins}>
              <Coins size={16} className="mr-2" />
              Explore Coins
            </Button>

            <Button variant="outline" size="sm" onClick={handleDiscoverMusic}>
              <Music size={16} className="mr-2" />
              Discover Musik
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
