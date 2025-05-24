'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { Address, parseEther } from 'viem';
import { Music, Upload, Trash2, Info, Clock, Disc, AudioLines, Coins, Play, Pause, FileText, ChevronDown, CheckSquare, LogIn } from 'lucide-react';
import { useZoraCoins, CoinData } from '../hooks/useZoraCoins';
import { uploadFileToIPFS, uploadJSONToIPFS } from '../services/pinataService';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { installIpfsGatewayProxy, cacheMetadata } from '../utils/ipfsGatewayProxy';

// Music genres for the dropdown - updated with Jersey Club genres
const MUSIC_GENRES = [
  "Jersey Club", "New Jersey Club", "Baltimore Club", "Philly Club",
  "Jersey Club House", "Jersey Club Remix", "Jersey Club Edit",
  "Jersey Club Mashup", "Jersey Club VIP", "Jersey Club Bounce",
  "Jersey Club Flip", "Jersey Club Bootleg", "Jersey Club VIP Mix",
  "Jersey Club Anthem", "Jersey Club Banger", "Jersey Club Bop",
  "Jersey Club Slap", "Jersey Club Smash", "Jersey Club Smasher",
  "Jersey Club Smashup", "Jersey Club Smash Hit", "Jersey Club Smash Mix",
  "Jersey Club Smash Edit", "Jersey Club Smash Remix", "Jersey Club Smash Bootleg",
  "Jersey Club Smash Flip", "Jersey Club Smash VIP", "Jersey Club Smash Anthem",
  "Jersey Club Smash Banger", "Jersey Club Smash Bop", "Jersey Club Smash Slap"
];

// ClientOnly wrapper to prevent hydration errors
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : <div style={{ visibility: 'hidden' }} aria-hidden="true"></div>;
}

export default function CreateMusicCoin() {
  const { address, isConnected } = useAccount();
  const { 
    createMusicCoin, 
    isCreatingCoin, 
    createCoinSuccess, 
    createCoinError,
    createdCoinAddress
  } = useZoraCoins();
  
  const audioFileRef = useRef<HTMLInputElement>(null);
  const coverArtRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<string>('0:00');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioCID, setAudioCID] = useState<string | null>(null);
  const [imageCID, setImageCID] = useState<string | null>(null);
  const [metadataCID, setMetadataCID] = useState<string | null>(null);
  const [txPending, setTxPending] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading_audio' | 'uploading_cover' | 'uploading_metadata' | 'creating_coin'>('idle');
  
  const [formState, setFormState] = useState({
    name: '',
    symbol: '',
    description: '',
    genre: '',
    initialPurchaseWei: '0.01', // Default value of 0.01 ETH
    artist: address || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const genreDropdownRef = useRef<HTMLDivElement>(null);

  const { connect, connectors } = useConnect();
  
  // Install our IPFS gateway proxy when the component mounts
  useEffect(() => {
    installIpfsGatewayProxy();
  }, []);

  // Close the genre dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setShowGenreDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update artist field when address changes
  useEffect(() => {
    if (address && !formState.artist) {
      setFormState(prev => ({
        ...prev,
        artist: address
      }));
    }
  }, [address, formState.artist]);

  // Track transaction status
  useEffect(() => {
    setTxPending(formSubmitted && isCreatingCoin);
    setTxSuccess(createCoinSuccess);
    
    if (createCoinError) {
      setTxError(createCoinError.message);
      setFormSubmitted(false);
    }
    
    if (createCoinSuccess) {
      setFormSubmitted(false);
    }
  }, [isCreatingCoin, createCoinSuccess, createCoinError, formSubmitted]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      audioElement?.pause();
    };
  }, [audioElement]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleSelectGenre = (genre: string) => {
    setFormState(prev => ({
      ...prev,
      genre
    }));
    setShowGenreDropdown(false);
    
    // Clear error when field is edited
    if (errors.genre) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.genre;
        return newErrors;
      });
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      console.log(`Selected audio file size: ${fileSizeMB.toFixed(2)}MB`);
      
      if (fileSizeMB > 50) {
        setErrors(prev => ({
          ...prev,
          audio: `File is too large (${fileSizeMB.toFixed(2)}MB). Maximum recommended size is 50MB.`
        }));
        return;
      }
      
      // Create a preview URL
      const audioUrl = URL.createObjectURL(file);
      setPreviewAudio(audioUrl);
      
      // Load audio to get duration
      const audio = new Audio(audioUrl);
      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        setAudioDuration(`${minutes}:${seconds < 10 ? '0' + seconds : seconds}`);
      });
      
      // Clear any previous error
      if (errors.audio) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.audio;
          return newErrors;
        });
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      console.log(`Selected image file size: ${fileSizeMB.toFixed(2)}MB`);
      
      if (fileSizeMB > 10) {
        setErrors(prev => ({
          ...prev,
          image: `Image is too large (${fileSizeMB.toFixed(2)}MB). Maximum recommended size is 10MB.`
        }));
        return;
      }
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous error
      if (errors.image) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.image;
          return newErrors;
        });
      }
    }
  };

  const triggerAudioInput = () => {
    audioFileRef.current?.click();
  };

  const triggerImageInput = () => {
    coverArtRef.current?.click();
  };

  const togglePlayPause = () => {
    if (!previewAudio) return;
    
    if (isPlaying) {
      audioElement?.pause();
      setIsPlaying(false);
    } else {
      if (!audioElement) {
        const audio = new Audio(previewAudio);
        audio.play();
        setAudioElement(audio);
        setIsPlaying(true);
        
        audio.addEventListener('ended', () => {
          setIsPlaying(false);
        });
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formState.name.trim()) newErrors.name = 'Name is required';
    if (!formState.symbol.trim()) newErrors.symbol = 'Symbol is required';
    if (!formState.description.trim()) newErrors.description = 'Description is required';
    if (!audioFileRef.current?.files?.length) newErrors.audio = 'Audio file is required';
    if (!coverArtRef.current?.files?.length) newErrors.image = 'Cover art is required';
    
    // Symbol validation - up to 11 characters, no spaces
    if (formState.symbol && !/^[A-Za-z0-9_-]{1,11}$/.test(formState.symbol)) {
      newErrors.symbol = 'Symbol must be 1-11 characters (letters, numbers, _ or -)';
    }
    
    // Name validation - at least 3 characters
    if (formState.name && formState.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }
    
    // Description validation - at least 20 characters
    if (formState.description && formState.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    // Genre validation
    if (!formState.genre) {
      newErrors.genre = 'Please select a genre';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // Set form as submitted
      setFormSubmitted(true);
      
      // Start showing upload progress
      setIsUploading(true);
      setUploadProgress(0);
      setTxError(null);
      
      // Get the files
      const audioFile = audioFileRef.current?.files?.[0];
      const imageFile = coverArtRef.current?.files?.[0];
      
      if (!audioFile || !imageFile) {
        setTxError('Audio file and cover art are required');
        setIsUploading(false);
        setFormSubmitted(false);
        return;
      }
      
      // Upload audio file to IPFS
      setUploadStage('uploading_audio');
      try {
        const audioCID = await uploadFileToIPFS(audioFile, (progress) => {
          setUploadProgress(progress * 0.3); // Audio upload is 30% of total progress
        });
        setAudioCID(audioCID);
        console.log('Audio uploaded with CID:', audioCID);
      } catch (error: any) {
        if (error.response?.status === 401) {
          setTxError('Pinata API authentication failed. Please ensure NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_SECRET_KEY environment variables are set correctly.');
          setIsUploading(false);
          setFormSubmitted(false);
          return;
        }
        throw error;
      }
      
      // Upload image file to IPFS
      setUploadStage('uploading_cover');
      try {
        const imageCID = await uploadFileToIPFS(imageFile, (progress) => {
          setUploadProgress(30 + progress * 0.3); // Image upload is another 30%
        });
        setImageCID(imageCID);
        console.log('Image uploaded with CID:', imageCID);
      } catch (error: any) {
        if (error.response?.status === 401) {
          setTxError('Pinata API authentication failed. Please ensure NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_SECRET_KEY environment variables are set correctly.');
          setIsUploading(false);
          setFormSubmitted(false);
          return;
        }
        throw error;
      }
      
      // Create metadata - strictly follow Zora's requirements
      setUploadStage('uploading_metadata');
      
      // Clean CIDs - remove ipfs:// prefix if present
      const cleanAudioCID = audioCID ? audioCID.replace('ipfs://', '') : '';
      const cleanImageCID = imageCID ? imageCID.replace('ipfs://', '') : '';
      
      // Validate CIDs before proceeding
      if (!cleanAudioCID || !cleanImageCID) {
        throw new Error('Failed to get valid IPFS CIDs for audio or image');
      }

      // Validate CID format (basic check)
      if (!/^Qm[a-zA-Z0-9]{44}$/.test(cleanAudioCID) || !/^Qm[a-zA-Z0-9]{44}$/.test(cleanImageCID)) {
        throw new Error('Invalid IPFS CID format received');
      }
      
      // Convert artist address to string if not already
      const artistAddress = typeof formState.artist === 'string' 
        ? formState.artist 
        : address || '';
        
      // Create metadata object following Zora's expected format
      const metadata = {
        name: formState.name,
        description: formState.description || `Music coin for ${artistAddress}`,
        image: `ipfs://${cleanImageCID}`,
        external_url: `https://jerseyclub.io/coins/${formState.name.replace(/\s+/g, '-').toLowerCase()}`,
        animation_url: `ipfs://${cleanAudioCID}`,
        properties: {},
        attributes: [
          {
            trait_type: "Artist",
            value: formState.artist
          },
          {
            trait_type: "Genre",
            value: formState.genre
          },
          {
            trait_type: "Type",
            value: "Music"
          }
        ]
      };
      
      console.log('Uploading metadata:', JSON.stringify(metadata, null, 2));
      
      // Upload metadata to IPFS
      const metadataURI = await uploadJSONToIPFS(metadata);
      
      // Validate the returned metadata URI
      if (!metadataURI || !metadataURI.startsWith('ipfs://')) {
        throw new Error('Failed to get valid metadata URI from IPFS');
      }
      
      setMetadataCID(metadataURI);
      console.log('Metadata uploaded with URI:', metadataURI);
      
      // Store metadata in our cache for the proxy to use
      const metadataCid = metadataURI.replace('ipfs://', '');
      cacheMetadata(metadataCid, metadata);
      
      setUploadProgress(70);
      
      // Pause briefly to ensure IPFS propagation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setUploadProgress(75);
      
      // Create the coin data
      setUploadStage('creating_coin');
      const coinData: CoinData = {
        name: formState.name,
        symbol: formState.symbol,
        uri: metadataURI,
        payoutRecipient: formState.artist as Address,
        initialPurchaseWei: parseEther(formState.initialPurchaseWei || '0'),
        platformReferrer: "0x32C8ACD3118766CBE5c3E45a44BCEDde953EF627"
      };
      
      // Create the coin
      await createMusicCoin(coinData);
      
      setUploadProgress(100);
      
    } catch (error: any) {
      let errorMessage = `Failed to create coin: ${error.message}`;
      
      // Provide more helpful error messages
      if (error.message.includes('Metadata fetch failed')) {
        errorMessage = 'Failed to validate metadata. Please try again with a different audio or image file.';
      } else if (error.message.includes('rejected')) {
        errorMessage = 'Transaction was rejected by your wallet.';
      } else if (error.message.includes('user denied') || error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by the user.';
      } else if (error.message.includes('cannot estimate gas')) {
        errorMessage = 'Failed to estimate gas. The blockchain network may be congested.';
      }
      
      setTxError(errorMessage);
      setIsUploading(false);
      setFormSubmitted(false);
    }
  };

  // Wrap everything in ClientOnly to prevent hydration errors
  return (
    <ClientOnly>
      {/* Connection warning */}
      {!isConnected ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container px-4 py-16 mx-auto"
        >
          <div className="max-w-2xl mx-auto sonic-glass-card">
            <div className="p-8 text-center">
              <div className="mb-6 text-5xl text-primary/70">
                <Coins size={64} className="mx-auto" />
              </div>
              <h2 className="mb-4 text-2xl font-bold">Wallet Connection Required</h2>
              <p className="mb-6 text-muted-foreground">
                Please connect your wallet to create a musik coin on Jersey Club.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <button 
                  onClick={() => {
                    // Find the MetaMask connector and connect with it
                    const metaMaskConnector = connectors.find(c => c.name === 'MetaMask');
                    if (metaMaskConnector) {
                      connect({ connector: metaMaskConnector });
                    }
                  }} 
                  className="sonic-button-primary"
                >
                  <LogIn size={18} className="mr-1" />
                  <span>Connect Wallet</span>
                </button>
                <Link href="/coins" className="sonic-button-outline">
                  <span>Back to Coins</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="container px-4 py-8 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-10 text-center">
              <h1 className="mb-3 text-4xl font-bold gradient-text">Create Your Music Coin</h1>
              <p className="text-muted-foreground">
                Create a social token for your music that fans can trade and support your journey
              </p>
            </div>

            {txSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl mx-auto text-center sonic-glass-card"
              >
                <div className="p-8">
                  <div className="mb-6">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20">
                      <CheckSquare size={32} className="text-green-500" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold gradient-text">Coin Created Successfully!</h2>
                    <p className="mb-4 text-muted-foreground">
                      Your music coin "{formState.name}" has been created and is now available for trading.
                    </p>
                  </div>
                  
                  <div className="p-5 mb-6 sonic-card">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Coin Name</span>
                        <span className="font-medium">{formState.name}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Symbol</span>
                        <span className="font-medium">{formState.symbol}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Genre</span>
                        <span className="font-medium">{formState.genre}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Initial Purchase</span>
                        <span className="font-medium">{formState.initialPurchaseWei} ETH</span>
                      </div>
                    </div>
                    
                    {createdCoinAddress && (
                      <div className="pt-4 mt-4 border-t border-white/10">
                        <div className="flex flex-col">
                          <span className="mb-1 text-xs text-muted-foreground">Coin Address</span>
                          <a 
                            href={`https://basescan.org/address/${createdCoinAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm break-all text-primary hover:underline"
                          >
                            {createdCoinAddress}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col justify-center gap-4 sm:flex-row">
                    <Link href="/coins" className="sonic-button-primary">
                      <Music size={20} />
                      <span>Go to Coins</span>
                    </Link>
                    <button
                      onClick={() => {
                        // Reset form
                        setFormState({
                          name: '',
                          symbol: '',
                          description: '',
                          genre: '',
                          initialPurchaseWei: '0.01',
                          artist: address || '',
                        });
                        setPreviewAudio(null);
                        setPreviewImage(null);
                        setAudioDuration('0:00');
                        setIsPlaying(false);
                        setAudioElement(null);
                        setTxSuccess(false);
                        setAudioCID(null);
                        setImageCID(null);
                        setMetadataCID(null);
                      }}
                      className="sonic-button-outline"
                    >
                      <Coins size={20} />
                      <span>Create Another Coin</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
                  {/* Left column: File uploads and preview */}
                  <div className="md:col-span-2">
                    <div className="mb-6 sonic-glass-card">
                      <div className="p-5">
                        <h3 className="flex items-center gap-2 mb-4 text-lg font-medium">
                          <AudioLines size={20} className="text-primary" />
                          <span>Audio File</span>
                        </h3>
                        
                        {previewAudio ? (
                          <div className="mb-4">
                            <div className="relative mb-4 sonic-waveform">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={togglePlayPause}
                                  className="flex items-center justify-center w-12 h-12 transition-all duration-300 rounded-full bg-primary hover:bg-primary/90"
                                >
                                  {isPlaying ? (
                                    <Pause size={24} className="text-white" />
                                  ) : (
                                    <Play size={24} className="ml-1 text-white" />
                                  )}
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>{audioDuration}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewAudio(null);
                                  setAudioElement(null);
                                  setIsPlaying(false);
                                  if (audioFileRef.current) {
                                    audioFileRef.current.value = '';
                                  }
                                }}
                                className="flex items-center gap-1 text-red-500 hover:text-red-600"
                              >
                                <Trash2 size={14} />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-4">
                            <div
                              onClick={triggerAudioInput}
                              className="p-8 text-center transition-colors duration-300 border-2 border-dashed cursor-pointer border-white/10 rounded-xl hover:border-primary/30 hover:bg-primary/5"
                            >
                              <Music size={40} className="mx-auto mb-3 text-muted-foreground" />
                              <p className="mb-1 text-muted-foreground">Click to upload audio file</p>
                              <p className="text-xs text-muted-foreground/70">MP3, WAV, FLAC (max 50MB)</p>
                            </div>
                            {errors.audio && (
                              <p className="mt-2 text-sm text-red-500">{errors.audio}</p>
                            )}
                          </div>
                        )}
                        
                        <input
                          type="file"
                          ref={audioFileRef}
                          onChange={handleAudioChange}
                          accept="audio/*"
                          className="hidden"
                        />
                      </div>
                    </div>
                    
                    <div className="sonic-glass-card">
                      <div className="p-5">
                        <h3 className="flex items-center gap-2 mb-4 text-lg font-medium">
                          <Disc size={20} className="text-primary" />
                          <span>Cover Art</span>
                        </h3>
                        
                        {previewImage ? (
                          <div className="relative mb-4">
                            <div className="overflow-hidden aspect-square rounded-xl">
                              <Image
                                src={previewImage}
                                alt="Cover Preview"
                                width={500}
                                height={500}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewImage(null);
                                if (coverArtRef.current) {
                                  coverArtRef.current.value = '';
                                }
                              }}
                              className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full hover:bg-black/90 transition-colors duration-300"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="mb-4">
                            <div
                              onClick={triggerImageInput}
                              className="flex flex-col items-center justify-center p-8 text-center transition-colors duration-300 border-2 border-dashed cursor-pointer border-white/10 rounded-xl hover:border-primary/30 hover:bg-primary/5 aspect-square"
                            >
                              <Upload size={40} className="mx-auto mb-3 text-muted-foreground" />
                              <p className="mb-1 text-muted-foreground">Click to upload cover art</p>
                              <p className="text-xs text-muted-foreground/70">JPG, PNG, GIF (max 10MB)</p>
                            </div>
                            {errors.image && (
                              <p className="mt-2 text-sm text-red-500">{errors.image}</p>
                            )}
                          </div>
                        )}
                        
                        <input
                          type="file"
                          ref={coverArtRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Right column: Form fields */}
                  <div className="md:col-span-3">
                    <div className="sonic-glass-card">
                      <div className="p-6">
                        <h3 className="flex items-center gap-2 mb-6 text-lg font-medium">
                          <Coins size={20} className="text-primary" />
                          <span>Coin Information</span>
                        </h3>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="block mb-1 text-sm font-medium">Coin Name</label>
                            <input
                              type="text"
                              name="name"
                              value={formState.name}
                              onChange={handleChange}
                              className="sonic-input"
                              placeholder="My Music Coin"
                            />
                            {errors.name && (
                              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                              The name of your coin (e.g., "Artist Name Coin")
                            </p>
                          </div>
                          
                          <div>
                            <label className="block mb-1 text-sm font-medium">Coin Symbol</label>
                            <input
                              type="text"
                              name="symbol"
                              value={formState.symbol}
                              onChange={handleChange}
                              className="uppercase sonic-input"
                              placeholder="MUSIC"
                              maxLength={11}
                            />
                            {errors.symbol && (
                              <p className="mt-1 text-sm text-red-500">{errors.symbol}</p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                              Trading symbol for your coin (1-11 characters, e.g., "ARTIST")
                            </p>
                          </div>
                          
                          <div>
                            <label className="block mb-1 text-sm font-medium">Description</label>
                            <textarea
                              name="description"
                              value={formState.description}
                              onChange={handleChange}
                              className="sonic-input min-h-24"
                              placeholder="Tell fans what your music coin represents..."
                            />
                            {errors.description && (
                              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block mb-1 text-sm font-medium">Genre</label>
                            <div className="relative" ref={genreDropdownRef}>
                              <div 
                                className="flex items-center justify-between cursor-pointer sonic-input"
                                onClick={() => setShowGenreDropdown(prev => !prev)}
                              >
                                <span className={formState.genre ? "" : "text-muted-foreground/50"}>
                                  {formState.genre || "Select a genre"}
                                </span>
                                <ChevronDown size={18} className={`transition-transform duration-200 ${showGenreDropdown ? 'rotate-180' : ''}`} />
                              </div>
                              
                              {errors.genre && (
                                <p className="mt-1 text-sm text-red-500">{errors.genre}</p>
                              )}
                              
                              <AnimatePresence>
                                {showGenreDropdown && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute z-10 w-full mt-1 overflow-auto border max-h-56 sonic-glass-card border-white/10 rounded-xl"
                                  >
                                    <div className="p-1">
                                      {MUSIC_GENRES.map(genre => (
                                        <div
                                          key={genre}
                                          className={`px-3 py-2 cursor-pointer rounded-lg hover:bg-primary/20 transition-colors ${
                                            formState.genre === genre ? 'bg-primary/10 text-primary' : ''
                                          }`}
                                          onClick={() => handleSelectGenre(genre)}
                                        >
                                          {genre}
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block mb-1 text-sm font-medium">Initial Purchase (ETH)</label>
                            <input
                              type="number"
                              name="initialPurchaseWei"
                              value={formState.initialPurchaseWei}
                              onChange={handleChange}
                              className="sonic-input"
                              placeholder="0.01"
                              min="0"
                              step="0.01"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              Initial amount of ETH to purchase for liquidity (recommended: 0.01 ETH)
                            </p>
                          </div>
                          
                          <div className="pt-2">
                            <div className="flex items-start gap-3 p-4 mb-6 sonic-card">
                              <Info size={18} className="text-primary mt-0.5" />
                              <div>
                                <p className="mb-1 text-sm font-medium">About Music Coins</p>
                                <p className="text-sm text-muted-foreground">
                                  Creating a coin will deploy a new ERC20 token contract with your music metadata. 
                                  This lets fans trade your music coin and support your journey.
                                </p>
                              </div>
                            </div>
                            
                            <button
                              type="submit"
                              className="w-full py-3 sonic-button-primary"
                              disabled={isUploading || txPending}
                            >
                              {isUploading || txPending ? (
                                <div className="flex items-center justify-center">
                                  <div className="mr-3 spinner-sm"></div>
                                  {isUploading ? (
                                    <div className="flex flex-col items-start">
                                      <span className="font-medium">
                                        {uploadStage === 'uploading_audio' && 'Uploading audio...'}
                                        {uploadStage === 'uploading_cover' && 'Uploading cover art...'}
                                        {uploadStage === 'uploading_metadata' && 'Storing metadata...'}
                                        {uploadStage === 'creating_coin' && 'Creating coin...'}
                                      </span>
                                      <span className="text-xs opacity-80">{Math.round(uploadProgress)}%</span>
                                    </div>
                                  ) : (
                                    <span>Creating Coin...</span>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <Coins size={20} />
                                  <span>Create Music Coin</span>
                                </>
                              )}
                            </button>
                            
                            {txError && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4 mt-4 text-sm text-red-500 border bg-red-500/10 border-red-500/20 rounded-xl"
                              >
                                <div className="flex items-start gap-2">
                                  <div className="text-red-500 mt-0.5">
                                    <FileText size={16} />
                                  </div>
                                  <div>
                                    <p className="mb-1 font-medium">Error creating coin</p>
                                    <p>{txError}</p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </ClientOnly>
  );
}