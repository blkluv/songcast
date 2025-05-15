import { ImageResponse } from 'next/og';
 
// Route segment config
export const runtime = 'edge';
 
// Image metadata
export const alt = 'SongCast | Music Social Tokens';
export const size = {
  width: 1200,
  height: 630,
};
 
export const contentType = 'image/png';
 
// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #FFF 0%,#0000FF 100%)',
          padding: 50,
          color: 'white',
          fontFamily: '"Inter", sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative Elements */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 0, 0, 0.1) 0%, transparent 50%)',
            filter: 'blur(100px)',
          }}
        />
        
        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
            fontSize: 72,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              background: 'radial-gradient(circle, rgba(255, 0, 0, 0.2) 0%, transparent 70%)',
              filter: 'blur(40px)',
              zIndex: 0,
            }}
          />
          <img 
            src="https://songcast.xyz/icon copy.png" 
            alt="SongCast" 
            width={200} 
            height={200}
            style={{
              position: 'relative',
              zIndex: 0,
            }}
          />
        </div>
        
        <div
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 20,
            color: 'white',
            textShadow: '0 0 20px rgba(255, 0, 0, 0.5)',
            letterSpacing: '-2px',
            background: 'linear-gradient(90deg, #ffffff 0%, #ff0000 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            padding: '20px 40px',
            border: '4px solid rgba(255, 0, 0, 0.3)',
            borderRadius: '16px',
            boxShadow: '0 0 30px rgba(255, 0, 0, 0.2)',
          }}
        >
          SongCast
        </div>
        
        <div
          style={{
            fontSize: 36,
            textAlign: 'center',
            color: 'white',
            maxWidth: 800,
            lineHeight: 1.4,
            marginBottom: 40,
            padding: '20px 40px',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '2px solid rgba(255, 0, 0, 0.3)',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 30px rgba(255, 0, 0, 0.1)',
          }}
        >
          Create and trade music coins
        </div>
        
        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            display: 'flex',
            alignItems: 'center',
            fontSize: 24,
            color: '#000',
            padding: '24px 32px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
          }}
        >
          songcast.xyz
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
} 