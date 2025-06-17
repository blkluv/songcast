// Prefetch IPFS metadata from common gateways
async function prefetchMetadata(metadataURI: string): Promise<boolean> {
  const cid = metadataURI.replace('ipfs://', '');

  const gateways = [
    `https://ipfs.io/ipfs/${cid}`,
    `https://xrp.mypinata.cloud/ipfs/${cid}`, // ✅ Updated from deprecated Pinata gateway
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
