'use client';

import React, { useEffect, useState, useRef } from 'react';
import { getIpfsUrl } from '../services/pinataService';
import { Play, Pause } from 'lucide-react';

interface IPFSAudioProps {
  src: string;
  className?: string;
  onPlayError?: () => void;
}

export function IPFSAudio({ src, className = '', onPlayError }: IPFSAudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ipfsUrl = getIpfsUrl(src);
  
  useEffect(() => {
    // Clean up audio when component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  const handlePlay = () => {
    if (!audioRef.current) {
      console.log("Creating new audio element for:", ipfsUrl);
      audioRef.current = new Audio(ipfsUrl);
      
      audioRef.current.addEventListener('error', (e) => {
        console.error(`Audio playback error for: ${ipfsUrl} (original: ${src})`, e);
        setError(true);
        setIsPlaying(false);
        if (onPlayError) onPlayError();
      });
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(err => {
            console.error("Playback failed:", err);
            setError(true);
            setIsPlaying(false);
            if (onPlayError) onPlayError();
          });
      }
    }
  };
  
  return (
    <button 
      onClick={handlePlay}
      disabled={error}
      className={`w-14 h-14 rounded-full bg-primary flex items-center justify-center z-10 hover:bg-primary/80 transition-transform duration-300 hover:scale-110 ${className} ${error ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isPlaying ? (
        <Pause size={24} className="text-white" />
      ) : (
        <Play size={24} className="text-white ml-1" />
      )}
    </button>
  );
}

export default IPFSAudio; 