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
    <main className="relative w-screen h-screen overflow-hidden bg-[#06080c] select-none">
      {/* 3D WebGL Canvas Layer: Earth, 10,000+ Satellites, 3D Ribbons */}
      <SceneCanvas />

      {/* 4-Corner Viewport Reticle Brackets */}
      {!cinemaMode && (
        <>
          <div className="reticle-corner reticle-tl !top-11 !left-2" />
          <div className="reticle-corner reticle-tr !top-11 !right-2" />
          <div className="reticle-corner reticle-bl !bottom-2 !left-2" />
          <div className="reticle-corner reticle-br !bottom-2 !right-2" />

          {/* Bottom Coordinate & Ephemeris Frame Readout */}
          <div className="fixed bottom-2.5 left-3 z-20 flex items-center gap-2 pointer-events-none font-mono text-[9px] text-slate-400 bg-[#06080c]/85 border border-white/[0.08] px-2 py-1 tabular-nums">
            <span className="w-1.5 h-1.5 bg-sky-400 inline-block" />
            <span>FRAME: J2000 ECI</span>
            <span className="text-slate-600">//</span>
            <span>SCALE: 1:6,371 KM</span>
            <span className="text-slate-600">//</span>
            <span className="text-emerald-400">TARGET LOCK: ACTIVE</span>
          </div>
        </>
      )}

      {/* Mission Control Tactical Workstation Overlays */}
      <TopTelemetryBar />
      <ConjunctionList />
      <ManeuverSimulator />
      <ApiModal />

      {/* Cinema Mode Minimal Watermark & Exit Reminder */}
      {cinemaMode && (
        <div className="fixed bottom-3 left-3 z-40 flex items-center gap-2 pointer-events-none text-[10px] font-mono text-sky-400 bg-[#06080c]/90 px-3 py-1 border border-white/[0.12] rounded-none">
          <span className="w-1.5 h-1.5 bg-sky-400 inline-block animate-ping" />
          <span>AEGIS // FLIGHT CONSOLE [RAW HUD ACTIVE] // PRESS [C] TO RESTORE</span>
        </div>
      )}
    </main>
  );
}
