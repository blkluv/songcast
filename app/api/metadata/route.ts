import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Simple in-memory cache
const metadataCache = new Map<string, any>();

function extractCidFromRequest(request: NextRequest): string | null {
  const cid = request.nextUrl.searchParams.get('cid');
  if (cid) return cid;

  const pathParts = request.nextUrl.pathname.split('/');
  const ipfsIndex = pathParts.findIndex(part => part === 'ipfs');

  if (ipfsIndex >= 0 && ipfsIndex < pathParts.length - 1) {
    return pathParts[ipfsIndex + 1];
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const cid = extractCidFromRequest(request);

    if (!cid) {
      return NextResponse.json({ error: 'Missing CID parameter' }, { status: 400 });
    }

    console.log('Proxy request for CID:', cid);

    if (metadataCache.has(cid)) {
      console.log('Serving from cache:', cid);
      return NextResponse.json(metadataCache.get(cid));
    }

    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://xrp.mypinata.cloud/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`,
    ];

    for (const gateway of gateways) {
      try {
        console.log(`Trying gateway: ${gateway}`);
        const response = await axios.get(gateway, { timeout: 5000 });

        if (response.status === 200 && response.data) {
          metadataCache.set(cid, response.data);
          return NextResponse.json(response.data);
        }
      } catch {
        console.warn(`Failed gateway: ${gateway}`);
        continue;
      }
    }

    throw new Error('All gateways failed');
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}
