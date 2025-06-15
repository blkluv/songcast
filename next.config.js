/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'xrp.mypinata.cloud',
      'gateway.pinata.cloud',
      'ipfs.io',
      'cloudflare-ipfs.com',
      'dweb.link',
      'ipfs.filebase.io',
      'gateway.ipfs.io',
      'ipfs.infura.io',
    ],
    unoptimized: true,
  },
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://jerseyclub.io',
  },
  async headers() {
    return [
      {
        source: '/api/frame/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      {
        source: '/miniapp',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
    ];
  },
};

module.exports = nextConfig;
