import type { Metadata } from "next";

interface CoinLayoutProps {
  children: React.ReactNode;
  params: {
    address: string;
  };
}

// Get the base URL from environment or fallback to the vercel deployment URL
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://jerseyclub.io";

export async function generateMetadata({ params }: CoinLayoutProps): Promise<Metadata> {
  const address = params.address;

  // Define Farcaster frame content for this specific coin
  const frameContent = JSON.stringify({
    version: "next",
    imageUrl: `${BASE_URL}/coins/${address}/opengraph-image`,
    button: {
      title: "🎵 Listen & Trade",
      action: {
        type: "launch_frame",
        name: "Jersey Club",
        url: `${BASE_URL}/coins/${address}`,
        splashImageUrl: `${BASE_URL}/logo.png`,
        splashBackgroundColor: "#0c0116"
      }
    }
  });

  return {
    title: "Musik Coin - Jersey Club",
    description: "View and trade musik social tokens on Jersey Club",
    openGraph: {
      title: "Musik Coin - Jersey Club",
      description: "View and trade musik social tokens on Jersey Club",
      images: [
        {
          url: `${BASE_URL}/coins/${address}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "Musik Coin Details",
        },
      ],
    },
    // Farcaster frame metadata
    other: {
      "fc:frame": frameContent,
      "fc:frame:image": `${BASE_URL}/coins/${address}/opengraph-image`,
      "fc:frame:post_url": `${BASE_URL}/api/frame`,
      "fc:frame:button:1": "🎵 Listen & Trade",
    },
  };
}

export default function CoinLayout({ children }: CoinLayoutProps) {
  return <>{children}</>;
} 