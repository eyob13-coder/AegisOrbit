import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://aegis-orbit.vercel.app'),
  title: 'AegisOrbit | Real-Time Orbital Conjunction & Autonomous Collision Avoidance',
  description: 'Production-grade, real-time 3D Low Earth Orbit Satellite Conjunction Detection & Collision Avoidance Simulator powered by SGP4 astrodynamics and SciPy spatial screening.',
  keywords: [
    'satellite',
    'conjunction detection',
    'orbital mechanics',
    'collision avoidance',
    'astrodynamics',
    'space debris',
    'SGP4',
    'aerospace',
    'WebGL',
    'Three.js'
  ],
  authors: [{ name: 'AegisOrbit Aerospace Systems' }],
  openGraph: {
    title: 'AegisOrbit | Real-Time Orbital Conjunction & Autonomous Collision Avoidance',
    description: 'High-performance 3D LEO satellite collision detection, SGP4 orbital propagation, and real-time evasive delta-V maneuver simulation.',
    url: 'https://aegis-orbit.vercel.app',
    siteName: 'AegisOrbit',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AegisOrbit 3D Satellite Conjunction & Avoidance Interface',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AegisOrbit | Real-Time Orbital Conjunction & Collision Avoidance',
    description: 'Autonomous LEO collision screening & impulsive thruster burn simulator running at locked 60 FPS in WebGL.',
    creator: '@aegisorbit',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.svg" />
      </head>
      <body className="bg-[#03050a] text-slate-100 antialiased h-screen w-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
