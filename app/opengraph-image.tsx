import { ImageResponse } from 'next/og';
import { getAllKites } from '@/lib/getKites';

export const runtime = 'nodejs';
export const alt = 'FindMyKite — match your riding style to the right kite';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const kiteCount = (await getAllKites()).length;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#080D16',
          backgroundImage:
            'radial-gradient(circle at 75% 25%, rgba(0,229,255,0.12) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(255,90,48,0.08) 0%, transparent 45%)',
        }}
      >
        <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, marginBottom: 24 }}>
          <span style={{ color: '#FFFFFF' }}>find</span>
          <span style={{ color: '#00E5FF' }}>my</span>
          <span style={{ color: '#FFFFFF' }}>kite</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 110,
            fontWeight: 800,
            lineHeight: 1.02,
            color: '#FFFFFF',
            letterSpacing: '-3px',
          }}
        >
          <span>Find</span>
          <span style={{ color: '#00E5FF' }}>Your</span>
          <span>Kite.</span>
        </div>
        <div style={{ display: 'flex', marginTop: 36, fontSize: 30, color: '#9DB5CC', maxWidth: 700 }}>
          {kiteCount} kites, 13 brands — matched to your riding style. Independent reviews, zero sponsors.
        </div>
      </div>
    ),
    { ...size },
  );
}
