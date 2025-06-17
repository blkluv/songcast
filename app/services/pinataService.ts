import axios, { AxiosError } from "axios"; // Import AxiosError for better typing
import { generateTrackMetadata } from "../utils/metadataGenerator";

// Get environment variables - will need to be set by the user
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || '';

// Define default gateways with the primary one first, and others as fallbacks
const DEFAULT_PINATA_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://xrp.mypinata.cloud/ipfs/', // Your specified gateway
  'https://ppvapt.mypinata.cloud/ipfs/', // New specified gateway
  'https://tontv.mypinata.cloud/ipfs/', // New specified gateway
];

// Determine the active gateway based on environment variable or defaults
const PINATA_GATEWAY = (process.env.NEXT_PUBLIC_PINATA_GATEWAY || DEFAULT_PINATA_GATEWAYS[0]).endsWith('/')
  ? (process.env.NEXT_PUBLIC_PINATA_GATEWAY || DEFAULT_PINATA_GATEWAYS[0])
  : (process.env.NEXT_PUBLIC_PINATA_GATEWAY || DEFAULT_PINATA_GATEWAYS[0]) + '/';

/**
 * Upload a file to IPFS via Pinata
 */
export async function uploadFileToIPFS(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const isBrowser = typeof window !== 'undefined';
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error('Pinata API keys are not configured. Please set them in your environment variables.');
  }

  const formData = new FormData();
  formData.append('file', file); // Use 'file' as the field name as per Pinata API

  // Common Axios config for Pinata uploads
  const commonPinataConfig = {
    headers: {
      'Content-Type': 'multipart/form-data',
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY
    },
    onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percentCompleted);
      }
    },
    maxBodyLength: Infinity, // Important for large files
    maxContentLength: Infinity, // Important for large files
    timeout: 120000 // Increased timeout to 120 seconds (2 minutes) for uploads
  };

  // Determine which API path to use: direct Pinata or proxy
  let targetUrl = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  let useProxy = false;

  // Use proxy only in production browser environment for smaller files
  const fileSizeMB = file.size / (1024 * 1024);
  const isSmallFileForProxy = fileSizeMB <= 10; // Files under or equal to 10MB can try proxy

  if (isBrowser && !isDevelopment && isSmallFileForProxy) {
      useProxy = true;
      targetUrl = '/api/pinata/upload'; // Your Next.js API proxy route for file uploads
  }

  try {
    console.log(`Attempting to upload file via ${useProxy ? 'proxy' : 'direct Pinata API'} to ${targetUrl}`);

    const response = await axios.post(
      targetUrl,
      formData,
      useProxy ? { // If using proxy, omit Pinata keys from headers
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: commonPinataConfig.onUploadProgress,
        maxBodyLength: commonPinataConfig.maxBodyLength,
        maxContentLength: commonPinataConfig.maxContentLength,
        timeout: commonPinataConfig.timeout // Proxy should also have a decent timeout
      } : commonPinataConfig // If direct, use common Pinata config including API keys
    );

    return `ipfs://${response.data.IpfsHash}`;
  } catch (error: any) {
    console.error(`Error during file upload attempt via ${useProxy ? 'proxy' : 'direct Pinata API'}:`, error.response?.data || error.message);

    // Fallback logic for proxy failures (e.g., 413, or if proxy fails for other reasons)
    if (useProxy && (error.response?.status === 413 || error.code === 'ECONNABORTED' || error.message === 'timeout exceeded')) {
      console.warn('Proxy failed or timed out, falling back to direct Pinata API for file upload.');
      try {
        const fallbackResponse = await axios.post(
          'https://api.pinata.cloud/pinning/pinFileToIPFS',
          formData,
          commonPinataConfig // Use full Pinata config for fallback
        );
        return `ipfs://${fallbackResponse.data.IpfsHash}`;
      } catch (fallbackError: any) {
        console.error('Fallback direct Pinata API upload also failed:', fallbackError.response?.data || fallbackError.message);
        throw new Error(`Failed to upload to IPFS after fallback: ${fallbackError.message}`);
      }
    }
    
    throw new Error(`Failed to upload file to IPFS: ${error.message}`);
  }
}

/**
 * Upload JSON metadata to IPFS
 */
export async function uploadJSONToIPFS(metadata: any): Promise<string> {
  const isBrowser = typeof window !== 'undefined';
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error('Pinata API keys are not configured. Please set them in your environment variables.');
  }

  // --- Zora/NFT Metadata Validation and Formatting ---
  if (!metadata.name) throw new Error('Metadata must include a name field');
  if (!metadata.image) throw new Error('Metadata must include an image field');
  if (!metadata.description) throw new Error('Metadata must include a description field');

  // Ensure proper IPFS URI formatting (remove ipfs:// prefix if it exists before adding it back)
  if (metadata.image) {
    metadata.image = `ipfs://${metadata.image.replace(/^ipfs:\/\//, '').trim()}`;
  }
  if (metadata.animation_url) {
    metadata.animation_url = `ipfs://${metadata.animation_url.replace(/^ipfs:\/\//, '').trim()}`;
  }
  
  // Ensure we have attributes
  if (!Array.isArray(metadata.attributes) || metadata.attributes.length === 0) {
    console.warn('Adding default attributes as none were provided');
    metadata.attributes = [
      { trait_type: "Type", value: "Music" }
    ];
  }

  // Ensure the schema follows exactly what Zora expects (explicitly define top-level properties)
  const cleanedMetadata = {
    name: metadata.name,
    description: metadata.description,
    image: metadata.image,
    animation_url: metadata.animation_url || undefined, // Use undefined if not present to omit from JSON
    external_url: metadata.external_url || "",
    // properties object is part of EIP-721/1155, often empty unless specific data is nested
    properties: metadata.properties || {},
    attributes: metadata.attributes
  };
  
  console.log('Uploading metadata JSON to IPFS:', JSON.stringify(cleanedMetadata, null, 2));
  
  // Common Axios config for Pinata JSON uploads
  const commonPinataJsonConfig = {
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 60000 // 60 second timeout for JSON uploads
  };

  // Determine which API path to use: direct Pinata or proxy
  let targetUrl = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  let useProxy = false;

  const metadataSize = JSON.stringify(cleanedMetadata).length / 1024; // Size in KB
  const isSmallMetadataForProxy = metadataSize <= 100; // Files under or equal to 100KB can try proxy

  if (isBrowser && !isDevelopment && isSmallMetadataForProxy) {
      useProxy = true;
      targetUrl = '/api/pinata/json'; // Your Next.js API proxy route for JSON uploads
  }

  try {
    console.log(`Attempting to upload JSON via ${useProxy ? 'proxy' : 'direct Pinata API'} to ${targetUrl}`);

    const response = await axios.post(
      targetUrl,
      cleanedMetadata,
      useProxy ? { // If using proxy, omit Pinata keys from headers
        headers: { 'Content-Type': 'application/json' },
        maxBodyLength: commonPinataJsonConfig.maxBodyLength,
        maxContentLength: commonPinataJsonConfig.maxContentLength,
        timeout: commonPinataJsonConfig.timeout
      } : commonPinataJsonConfig // If direct, use common Pinata config including API keys
    );

    return `ipfs://${response.data.IpfsHash || response.data.cid || response.data.uri}`; // Handle various response fields
  } catch (error: any) {
    console.error(`Error during JSON upload attempt via ${useProxy ? 'proxy' : 'direct Pinata API'}:`, error.response?.data || error.message);

    // Fallback logic for proxy failures (e.g., 413, or if proxy fails for other reasons)
    if (useProxy && (error.response?.status === 413 || error.code === 'ECONNABORTED' || error.message === 'timeout exceeded')) {
      console.warn('Proxy failed or timed out, falling back to direct Pinata API for JSON upload.');
      try {
        const fallbackResponse = await axios.post(
          'https://api.pinata.cloud/pinning/pinJSONToIPFS',
          cleanedMetadata,
          commonPinataJsonConfig // Use full Pinata config for fallback
        );
        return `ipfs://${fallbackResponse.data.IpfsHash || fallbackResponse.data.cid || fallbackResponse.data.uri}`;
      } catch (fallbackError: any) {
        console.error('Fallback direct Pinata API JSON upload also failed:', fallbackError.response?.data || fallbackError.message);
        throw new Error(`Failed to upload metadata to IPFS after fallback: ${fallbackError.message}`);
      }
    }
    
    throw new Error(`Failed to upload metadata to IPFS: ${error.message}`);
  }
}

/**
 * Get IPFS URL from CID
 */
export function getIpfsUrl(uri: string): string {
  if (!uri) return '';
  
  // For debugging
  console.log('Original URI:', uri);
  
  // Ensure PINATA_GATEWAY ends with a slash for consistent concatenation
  const cleanGateway = PINATA_GATEWAY.endsWith('/') ? PINATA_GATEWAY : PINATA_GATEWAY + '/';
  
  let url = '';
  
  try {
    // Handle ipfs:// protocol
    if (uri.startsWith('ipfs://')) {
      // Get the CID by removing the ipfs:// prefix
      const cid = uri.substring(7).trim();
      url = `${cleanGateway}${cid}`;
    } 
    // Handle http/https URLs (assume it's already a direct gateway link)
    else if (uri.startsWith('http')) {
      url = uri;
    }
    // Handle raw CID
    else {
      url = `${cleanGateway}${uri.trim()}`;
    }
    
    console.log('Converted IPFS URL:', url);
    return url;
  } catch (error) {
    console.error('Error processing IPFS URL:', error);
    return uri; // Return original URI if we can't process it
  }
}

/**
 * Fetch track metadata from IPFS
 */
export async function fetchTrackMetadata(metadataURI: string): Promise<any> {
  try {
    // Convert IPFS URI to HTTP URL
    const url = getIpfsUrl(metadataURI);
    
    // Fetch the metadata
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}

/**
 * Upload track metadata to IPFS
 * @param trackData - Track data including title, artist, etc.
 * @param audioCID - CID of the previously uploaded audio file
 * @param imageCID - CID of the previously uploaded cover image
 * @returns The CID of the uploaded metadata
 */
export async function uploadTrackMetadata(
  trackData: {
    title: string;
    artist: string;
    description: string;
    price: string; // in ETH
    genre: string;
    duration: string;
    seller: string;
    featured: boolean;
  },
  audioCID: string,
  imageCID: string
): Promise<string> {
  try {
    // Convert price from ETH to wei
    // Ensure BigInt is used for large numbers, but parseFloat for user input string
    const priceInWei = BigInt(Math.floor(parseFloat(trackData.price) * 1e18));
    
    // Generate metadata object - assuming generateTrackMetadata is correct
    // Make sure generateTrackMetadata correctly formats CIDs with ipfs:// if necessary
    const metadata = generateTrackMetadata({
      ...trackData,
      price: priceInWei.toString(), // Price should be string representation of BigInt
      audioCID: audioCID, // Should already be ipfs://CID
      imageCID: imageCID, // Should already be ipfs://CID
      gateway: PINATA_GATEWAY // Pass gateway if metadataGenerator uses it to form URLs
    });
    
    // Use the uploadJSONToIPFS function from this module
    const metadataIpfsUri = await uploadJSONToIPFS(metadata);
    return metadataIpfsUri; // This should already be in ipfs://CID format
  } catch (error) {
    console.error('Error uploading track metadata:', error);
    throw new Error(`Failed to upload track metadata to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload a cover image to IPFS using Pinata
 * @param file - The image file to upload
 * @returns The CID of the uploaded file (ipfs://CID)
 */
export async function uploadCoverImage(file: File): Promise<string> {
  try {
    // Reuse the general uploadFileToIPFS for cover images
    const ipfsUri = await uploadFileToIPFS(file);
    return ipfsUri; // This will return ipfs://CID
  } catch (error) {
    console.error('Error uploading cover image to Pinata:', error);
    throw new Error(`Failed to upload cover image to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}