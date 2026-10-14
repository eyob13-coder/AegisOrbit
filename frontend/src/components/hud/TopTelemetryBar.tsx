'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  FastForward, 
  ShieldAlert, 
  Video, 
  Eye, 
  EyeOff, 
  Terminal, 
  Radio, 
  Compass,
  Zap,
  Globe,
  Crosshair
} from 'lucide-react';
import { useOrbitStore } from '@/store/useOrbitStore';

export const TopTelemetryBar: React.FC = () => {
  const catalogCount = useOrbitStore((state) => state.catalogCount);
  const simSpeed = useOrbitStore((state) => state.simSpeed);
  const isSimPaused = useOrbitStore((state) => state.isSimPaused);
  const setSimSpeed = useOrbitStore((state) => state.setSimSpeed);
  const toggleSimPause = useOrbitStore((state) => state.toggleSimPause);
  const simTime = useOrbitStore((state) => state.simTime);
  const cinemaMode = useOrbitStore((state) => state.cinemaMode);
  const toggleCinemaMode = useOrbitStore((state) => state.toggleCinemaMode);
  const kesslerDemo = useOrbitStore((state) => state.kesslerDemo);
  const toggleKesslerDemo = useOrbitStore((state) => state.toggleKesslerDemo);
  const setApiModalOpen = useOrbitStore((state) => state.setApiModalOpen);
  const cameraFocus = useOrbitStore((state) => state.cameraFocus);
  const setCameraFocus = useOrbitStore((state) => state.setCameraFocus);

  const [utcClock, setUtcClock] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date(simTime);
      setUtcClock(
        d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 250);
    return () => clearInterval(interval);
  }, [simTime]);

  const speedOptions = [1, 5, 20, 60];

  return (
    <header className="fixed top-3 left-3 right-3 z-40 flex items-center justify-between px-4 py-2.5 rounded-xl glass-panel text-xs">
      {/* Brand & Mission Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-cyan-500/20">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </div>
          <span className="font-bold tracking-wider text-white text-sm">AEGIS<span className="text-cyan-400">ORBIT</span></span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            LEO DEFENSE
          </span>
        </div>

        {/* Catalog Telemetry */}
        <div className="hidden sm:flex items-center gap-4 text-slate-300 font-mono-telemetry">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-400">TRACKED:</span>
            <span className="text-cyan-300 font-bold">10,000+ SATS</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">EPOCH:</span>
            <span className="text-white font-medium">{utcClock}</span>
          </div>
        </div>
      </div>

      {/* Center: Sim Speed Controls */}
      <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
        <button
          onClick={toggleSimPause}
          className={`p-1.5 rounded transition-transform ${
            isSimPaused ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
          }`}
          title={isSimPaused ? 'Resume Simulation' : 'Pause Simulation'}
        >
          {isSimPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5 font-mono text-[11px]">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              onClick={() => setSimSpeed(speed)}
              className={`px-1.5 py-0.5 rounded transition-all ${
                simSpeed === speed && !isSimPaused
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Right Controls: Camera, Kessler, Cinema & B2B API */}
      <div className="flex items-center gap-2">
        {/* Camera Mode: Segmented Toggle [ Global | TCA Focus ] */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-[11px]">
          <button
            onClick={() => setCameraFocus('GLOBAL')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all ${
              cameraFocus === 'GLOBAL'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Switch to Full Global Earth & Catalog Orbit View"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GLOBAL</span>
          </button>
          <button
            onClick={() => setCameraFocus('CONJUNCTION')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all ${
              cameraFocus === 'CONJUNCTION'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Fly to Close-up TCA Encounter & Trajectory Inspection"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TCA FOCUS</span>
          </button>
        </div>

        {/* Trigger Kessler Demo */}
        <button
          onClick={toggleKesslerDemo}
          className={`px-2.5 py-1.5 rounded-lg border font-mono text-[11px] flex items-center gap-1.5 transition-all ${
            kesslerDemo
              ? 'bg-red-500/20 border-red-500/60 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
          title="Toggle Kessler Debris Avalanche Demo"
        >
          <Zap className={`w-3.5 h-3.5 ${kesslerDemo ? 'text-red-400 fill-red-400' : 'text-amber-400'}`} />
          <span className="hidden sm:inline">KESSLER CASCADE</span>
        </button>

        {/* Cinema Mode (Clean Recording) */}
        <button
          onClick={toggleCinemaMode}
          className={`p-1.5 rounded-lg border transition-all ${
            cinemaMode
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
          title="Cinema Mode (Hide HUD for 60-FPS video recording)"
        >
          {cinemaMode ? <EyeOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </button>

        {/* B2B API Preview Modal */}
        <button
          onClick={() => setApiModalOpen(true)}
          className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] flex items-center gap-1.5"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden md:inline">B2B API</span>
        </button>
      </div>
    </header>
  );
};
