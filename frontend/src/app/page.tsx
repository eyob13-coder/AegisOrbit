'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useOrbitStore } from '@/store/useOrbitStore';
import { TopTelemetryBar } from '@/components/hud/TopTelemetryBar';
import { ConjunctionList } from '@/components/hud/ConjunctionList';
import { ManeuverSimulator } from '@/components/hud/ManeuverSimulator';
import { ApiModal } from '@/components/hud/ApiModal';

// Dynamically import SceneCanvas to avoid SSR WebGL canvas mismatches
const SceneCanvas = dynamic(
  () => import('@/components/canvas/SceneCanvas').then((mod) => mod.SceneCanvas),
  { ssr: false }
);

export default function AegisOrbitDashboard() {
  const fetchCatalog = useOrbitStore((state) => state.fetchCatalog);
  const fetchConjunctions = useOrbitStore((state) => state.fetchConjunctions);
  const cinemaMode = useOrbitStore((state) => state.cinemaMode);
  const toggleCinemaMode = useOrbitStore((state) => state.toggleCinemaMode);

  useEffect(() => {
    // Initial fetch of active NORAD TLEs and cKDTree screened conjunctions
    fetchCatalog();
    fetchConjunctions();

    // Hotkey 'C' for toggling Cinema Mode
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        toggleCinemaMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchCatalog, fetchConjunctions, toggleCinemaMode]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#03050a] select-none">
      {/* 3D WebGL Canvas Layer: Earth, 10,000+ Satellites, 3D Ribbons */}
      <SceneCanvas />

      {/* Mission Control Tactical HUD Overlays */}
      <TopTelemetryBar />
      <ConjunctionList />
      <ManeuverSimulator />
      <ApiModal />

      {/* Cinema Mode Minimal Watermark & Exit Reminder */}
      {cinemaMode && (
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 pointer-events-none text-[11px] font-mono text-cyan-400/80 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-cyan-500/20 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>AEGISORBIT // CINEMA RECORDING MODE // PRESS [C] TO UNHIDE HUD</span>
        </div>
      )}
    </main>
  );
}
