import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AegisOrbit | 3D LEO Satellite Conjunction & Avoidance Simulator',
  description: 'Production-grade, real-time 3D Low Earth Orbit Satellite Conjunction Detection & Collision Avoidance Simulator powered by SGP4 and SciPy cKDTree.',
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
