# SongCast - Music Social Tokens Platform

SongCast is a platform that enables music artists to create their own social tokens, build communities, and allow fans to invest directly in their musical journey. This project includes full Farcaster Mini App integration for enhanced social interactions.

![SongCast Screenshot](public/screenshot.png)

## Features

- **Artist Tokens**: Create and manage music artist social tokens
- **Interactive Music Player**: Listen to music associated with tokens
- **Farcaster Integration**: Fully integrated mini app for Farcaster ecosystem
- **Web3 Authentication**: Sign in with Farcaster and other web3 wallets
- **Token Trading**: Trade music tokens with other users

## Hackathon Information

This repository has been created specifically for hackathon use. It contains a cleaned version of the SongCast application with all sensitive information removed.

**Please read the following files before getting started:**
- [HACKATHON.md](HACKATHON.md) - Overview and ideas for hackathon projects
- [API_SETUP.md](API_SETUP.md) - Instructions for setting up required API keys

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Framer Motion
- Web3 Integration with wagmi/viem
- Farcaster SDK (@farcaster/frame-sdk)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A web3 wallet (MetaMask, etc.)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/songcast.git
   cd songcast
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   # Copy the example env file
   cp env.example .env.local
   
   # Then edit .env.local with your own values
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
  ├─ api/         # API routes for backend functions
  ├─ components/  # Reusable UI components
  ├─ hooks/       # Custom React hooks
  ├─ services/    # Services for external API integration
  ├─ utils/       # Utility functions
  ├─ types/       # TypeScript type definitions
  └─ pages/       # App pages and routes
services/
  └─ pinataService.ts  # IPFS integration service
public/
  └─ ...          # Static assets
```

## Deployment

This project can be deployed on any platform that supports Next.js, but Vercel is recommended for the best experience.

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add required environment variables
4. Deploy!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Base](https://base.org/) - The L2 blockchain powering this application
- [Zora](https://zora.co/) - NFT infrastructure
- [Farcaster](https://www.farcaster.xyz/) - Decentralized social protocol 