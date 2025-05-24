# API Setup Guide

This document explains how to set up the required API keys and environment variables for the Jersey Club application.

## Required API Keys

The application uses several external services that require API keys:

1. **RPC Provider for Base Network**
   - You need a reliable RPC endpoint for connecting to the Base blockchain
   - Recommended providers:
     - [Alchemy](https://www.alchemy.com/) - Free tier supports up to 300M compute units/month
     - [Infura](https://www.infura.io/) - Free tier supports up to 100K requests/day
     - Public endpoint: `https://mainnet.base.org` (may have rate limits)

2. **Pinata IPFS Service**
   - Required for storing music files and metadata
   - Sign up at [Pinata](https://www.pinata.cloud/)
   - Free tier offers 500MB storage

3. **Optional: Zora API Key**
   - For enhanced NFT metadata
   - Sign up at [Zora Developer Portal](https://zora.co/developers)

## Setting Up Environment Variables

1. Create a `.env.local` file in the root directory by copying the `env.example` file:
   ```bash
   cp env.example .env.local
   ```

2. Add your API keys to the `.env.local` file:
   ```
   # Base network RPC URL - Required for blockchain interactions
   NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
   
   # Secondary/fallback RPC URL (get from Alchemy, Infura, etc.)
   FALLBACK_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
   
   # Pinata IPFS Storage (Required for music and image uploads)
   PINATA_API_KEY=your_pinata_api_key
   PINATA_SECRET_KEY=your_pinata_secret_key
   
   # Optional: Zora API Key
   NEXT_PUBLIC_ZORA_API_KEY=your_zora_api_key
   
   # Optional: OnchainKit API Key
   NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key
   ```

3. Restart your development server after updating the environment variables:
   ```bash
   npm run dev
   ```

## Testing API Connectivity

After setting up your environment variables, you can test the API connectivity:

1. **Base RPC Endpoint**
   - The app includes a test endpoint at `/api/rpc/test` that checks if your RPC connection is working
   - Navigate to http://localhost:3000/api/rpc/test in your browser

2. **Pinata IPFS**
   - The app includes a test endpoint at `/api/pinata/test` that validates your Pinata API keys
   - Navigate to http://localhost:3000/api/pinata/test in your browser

If you encounter any issues, check your API keys and make sure they are correctly added to your `.env.local` file.

## Production Deployment

When deploying to production (e.g., Vercel, Netlify), make sure to add all environment variables to your hosting platform.

For Vercel deployments:
1. Go to your project settings
2. Navigate to the "Environment Variables" section
3. Add all required environment variables from your `.env.local` file
4. Trigger a redeployment 