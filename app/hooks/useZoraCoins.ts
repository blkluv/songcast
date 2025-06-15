import { useState, useCallback } from 'react';
import {
  createCoin,
  createCoinCall,
  tradeCoin,
  tradeCoinCall,
  simulateBuy
} from '@zoralabs/coins-sdk';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import axios from 'axios';

// Prefetch IPFS metadata from common gateways
async function prefetchMetadata(metadataURI: string): Promise<boolean> {
  const cid = metadataURI.replace('ipfs://', '');

  const gateways = [
    `https://ipfs.io/ipfs/${cid}`,
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://xrp.mypinata.cloud/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://ipfs.filebase.io/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`
  ];

  console.log('Prefetching metadata from IPFS gateways...');
  for (const gateway of gateways) {
    try {
      console.log(`Trying ${gateway}`);
      const res = await axios.get(gateway, { timeout: 5000 });
      if (res.status === 200 && res.data) {
        console.log('Metadata fetched from:', gateway);
        return true;
      }
    } catch (err) {
      console.warn(`Failed to fetch from ${gateway}`, err);
    }
  }

  console.error('Metadata fetch failed across all gateways');
  return false;
}

export interface CoinData {
  name: string;
  symbol: string;
  uri: string;
  payoutRecipient: Address;
  platformReferrer: '0x32C8ACD3118766CBE5c3E45a44BCEDde953EF627';
  initialPurchaseWei?: bigint;
}

export interface ExclusiveCoinData {
  name: string;
  symbol: string;
  uri: string;
  payoutRecipient: Address;
  platformReferrer: '0x41f35485Dea9e5e7C683d1C6CA650e8179c606ba';
  initialPurchaseWei?: bigint;
}

export interface TradeParams {
  direction: 'sell' | 'buy';
  target: Address;
  args: {
    recipient: Address;
    orderSize: bigint;
    minAmountOut?: bigint;
    sqrtPriceLimitX96?: bigint;
    tradeReferrer?: Address;
  };
}

export function useZoraCoins() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [isCreatingCoin, setIsCreatingCoin] = useState(false);
  const [createCoinSuccess, setCreateCoinSuccess] = useState(false);
  const [createCoinError, setCreateCoinError] = useState<Error | null>(null);
  const [createdCoinAddress, setCreatedCoinAddress] = useState<Address | null>(null);

  const [isTrading, setIsTrading] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);
  const [tradeError, setTradeError] = useState<Error | null>(null);
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | null>(null);

  const createMusicCoin = useCallback(
    async (coinData: CoinData | ExclusiveCoinData) => {
      if (!walletClient || !publicClient || !isConnected) {
        setCreateCoinError(new Error('Wallet not connected'));
        return;
      }

      setIsCreatingCoin(true);
      setCreateCoinSuccess(false);
      setCreateCoinError(null);
      setCreatedCoinAddress(null);

      try {
        console.log('Creating coin with data:', {
          ...coinData,
          uri: coinData.uri.slice(0, 50) + '...'
        });

        if (!coinData.uri.startsWith('ipfs://')) {
          throw new Error('Invalid URI: must start with ipfs://');
        }

        const metadataOK = await prefetchMetadata(coinData.uri);
        if (!metadataOK) {
          console.warn('Trying proxy fallback for metadata...');
          const cid = coinData.uri.replace('ipfs://', '');
          try {
            const proxyRes = await axios.get(`/api/metadata?cid=${cid}`);
            if (proxyRes.status !== 200) {
              throw new Error('Metadata not accessible even via proxy.');
            }
            console.log('Proxy metadata fetched:', proxyRes.data);
          } catch (proxyError) {
            throw new Error('Metadata is not accessible. Try uploading again.');
          }
        }

        const result = await createCoin(coinData, walletClient, publicClient);

        if (result.address) {
          setCreatedCoinAddress(result.address);
        }
        if (result.hash) {
          setLastTxHash(result.hash);
        }

        setCreateCoinSuccess(true);
        return result;
      } catch (error: any) {
        console.error('Coin creation error:', error);
        setCreateCoinError(
          error?.message?.includes('Metadata')
            ? new Error('Metadata validation failed: ensure format and accessibility.')
            : error
        );
        throw error;
      } finally {
        setIsCreatingCoin(false);
      }
    },
    [walletClient, publicClient, isConnected]
  );

  const getCreateCoinCallParams = useCallback(
    (coinData: CoinData | ExclusiveCoinData) => {
      return createCoinCall(coinData);
    },
    []
  );

  const tradeMusicCoin = useCallback(
    async (tradeParams: TradeParams) => {
      if (!walletClient || !publicClient || !isConnected) {
        setTradeError(new Error('Wallet not connected'));
        return;
      }

      setIsTrading(true);
      setTradeSuccess(false);
      setTradeError(null);

      try {
        const result = await tradeCoin(tradeParams, walletClient, publicClient);

        if (result.hash) {
          setLastTxHash(result.hash);
        }

        setTradeSuccess(true);
        return result;
      } catch (error: any) {
        console.error('Trade error:', error);
        setTradeError(error);
        throw error;
      } finally {
        setIsTrading(false);
      }
    },
    [walletClient, publicClient, isConnected]
  );

  const getTradeCallParams = useCallback((tradeParams: TradeParams) => {
    return tradeCoinCall(tradeParams);
  }, []);

  const simulateBuyCoin = useCallback(
    async (target: Address, orderSizeEth: string) => {
      if (!publicClient) {
        throw new Error('Missing public client');
      }

      try {
        const result = await simulateBuy({
          target,
          requestedOrderSize: parseEther(orderSizeEth),
          publicClient
        });

        return {
          ...result,
          formattedAmountOut: formatEther(result.amountOut)
        };
      } catch (error) {
        console.error('Simulation error:', error);
        throw error;
      }
    },
    [publicClient]
  );

  return {
    // States
    isCreatingCoin,
    createCoinSuccess,
    createCoinError,
    createdCoinAddress,

    isTrading,
    tradeSuccess,
    tradeError,
    lastTxHash,

    // Functions
    createMusicCoin,
    getCreateCoinCallParams,
    tradeMusicCoin,
    getTradeCallParams,
    simulateBuyCoin
  };
}
