/**
 * Utility to help with IPFS gateway access
 * This patches the fetch and XHR APIs to intercept requests to problematic gateways
 */

const PROBLEMATIC_GATEWAY = 'magic.decentralized-content.com/ipfs/';

/**
 * Extract CID from an IPFS gateway URL
 */
function extractCidFromUrl(url: string): string | null {
  const match = url.match(/\/ipfs\/([^/?#]+)/);
  return match ? match[1] : null;
}

/**
 * Install the IPFS gateway proxy to intercept problematic gateway requests
 */
export function installIpfsGatewayProxy() {
  if (typeof window === 'undefined') return;

  console.log('[IPFS Proxy] Installing gateway interceptor');

  // Patch fetch
  const originalFetch = window.fetch;

  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url: string;

    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else {
      url = input.url;
    }

    if (url.includes(PROBLEMATIC_GATEWAY)) {
      console.log('[IPFS Proxy] Intercepting fetch:', url);
      const cid = extractCidFromUrl(url);
      if (cid) {
        const proxyUrl = `/api/metadata?cid=${cid}`;
        console.log(`[IPFS Proxy] Redirecting fetch to: ${proxyUrl}`);
        return originalFetch(proxyUrl, init);
      }
    }

    return originalFetch(input, init);
  };

  // Patch XMLHttpRequest
  const originalXhrOpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async: boolean = true,
    username?: string | null,
    password?: string | null
  ) {
    const urlString = typeof url === 'string' ? url : url.toString();

    if (urlString.includes(PROBLEMATIC_GATEWAY)) {
      console.log('[IPFS Proxy] Intercepting XHR:', urlString);
      const cid = extractCidFromUrl(urlString);
      if (cid) {
        const proxyUrl = `/api/metadata?cid=${cid}`;
        console.log(`[IPFS Proxy] Redirecting XHR to: ${proxyUrl}`);
        return originalXhrOpen.call(this, method, proxyUrl, async, username, password);
      }
    }

    return originalXhrOpen.call(this, method, url, async, username, password);
  };
}

/**
 * Store metadata in the cache for a specific CID
 */
export function cacheMetadata(cid: string, metadata: any) {
  if (typeof window === 'undefined') return;

  if (!window.ipfsMetadataCache) {
    window.ipfsMetadataCache = new Map<string, any>();
  }

  window.ipfsMetadataCache.set(cid, metadata);
  console.log(`[IPFS Proxy] Cached metadata for CID: ${cid}`);
}

// Add type declaration for the global window object
declare global {
  interface Window {
    ipfsMetadataCache?: Map<string, any>;
  }
}
