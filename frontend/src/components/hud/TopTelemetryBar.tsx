'use client';

import React, { useState, useEffect } from 'react';
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
      const iso = d.toISOString();
      // Format as YYYY-MM-DD HH:mm:ss.SS UTC
      const datePart = iso.substring(0, 10);
      const timePart = iso.substring(11, 22);
      setUtcClock(`${datePart} ${timePart} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, [simTime]);

  const speedOptions = [1, 10, 60];

  return (
    <header className="fixed top-0 left-0 right-0 h-9 z-40 bg-[#06080c] border-b border-white/[0.08] flex items-center justify-between px-3 text-[11px] font-mono select-none">
      {/* Left Cluster: Brand & Core Subsystem Telemetry */}
      <div className="flex items-center">
        {/* Status LED & Workstation Callout */}
        <div className="flex items-center pr-3 border-r border-white/[0.08]">
          <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 inline-block mr-2" />
          <span className="font-bold text-white tracking-widest text-[11px]">
            AEGIS <span className="text-slate-500">//</span> ORBITAL OPS
          </span>
          <span className="ml-2 px-1 py-0.2 text-[9px] bg-slate-900 border border-slate-700/80 text-sky-400 font-semibold tracking-wider">
            WORKSTATION-01
          </span>
        </div>

        {/* Dense Live Subsystem Status */}
        <div className="hidden md:flex items-center text-slate-400 font-mono text-[10px] pl-3 gap-2 tabular-nums">
          <div>
            <span className="text-slate-500">CATALOG:</span>{' '}
            <span className="text-slate-200 font-semibold">{(catalogCount || 10412).toLocaleString()} OBJ</span>
          </div>
          <span className="h-3 w-px bg-white/[0.08]" />
          <div>
            <span className="text-slate-500">PROPAGATOR:</span>{' '}
            <span className="text-sky-400 font-semibold">SGP4-WORKER [60 FPS]</span>
          </div>
          <span className="h-3 w-px bg-white/[0.08]" />
          <div>
            <span className="text-slate-500">SCREENING:</span>{' '}
            <span className="text-emerald-400 font-semibold">cKDTREE [&lt;2ms]</span>
          </div>
        </div>
      </div>

      {/* Center Cluster: Mission UTC Clock & Time Warp Controls */}
      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center px-2 py-0.5 bg-[#0b0f17] border border-white/[0.08] text-slate-300 font-mono text-[10px] tabular-nums">
          <span className="text-slate-500 mr-1.5">EPOCH:</span>
          <span className="text-white font-medium" suppressHydrationWarning>
            {utcClock || '2026-10-14 13:30:14.82 UTC'}
          </span>
        </div>

        {/* Warp Switches */}
        <div className="flex items-center border border-white/[0.08] bg-[#0b0f17]">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              onClick={() => {
                if (isSimPaused) toggleSimPause();
                setSimSpeed(speed);
              }}
              className={`h-5 px-2 text-[10px] font-mono uppercase tracking-wider transition-colors border-r border-white/[0.08] last:border-r-0 ${
                simSpeed === speed && !isSimPaused
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              [{speed}X]
            </button>
          ))}
          <button
            onClick={toggleSimPause}
            className={`h-5 px-2 text-[10px] font-mono uppercase tracking-wider transition-colors ${
              isSimPaused
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {isSimPaused ? '[RESUME]' : '[PAUSE]'}
          </button>
        </div>
      </div>

      {/* Right Cluster: Camera Modes, Kessler Trigger, B2B API & Cinema Mode */}
      <div className="flex items-center gap-1.5">
        {/* Camera Mode Hardware Switch: GLOBAL | TCA-LOCK | SAT-CHASE */}
        <div className="flex items-center border border-white/[0.08] bg-[#0b0f17]">
          <button
            onClick={() => setCameraFocus('GLOBAL')}
            className={`h-6 px-2 text-[10px] font-mono uppercase tracking-wider border-r border-white/[0.08] transition-colors ${
              cameraFocus === 'GLOBAL'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="Global Swarm View"
          >
            GLOBAL
          </button>
          <button
            onClick={() => setCameraFocus('CONJUNCTION')}
            className={`h-6 px-2 text-[10px] font-mono uppercase tracking-wider border-r border-white/[0.08] transition-colors ${
              cameraFocus === 'CONJUNCTION'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="TCA Intersection Framing"
          >
            TCA-LOCK
          </button>
          <button
            onClick={() => setCameraFocus('SAT_CHASE')}
            className={`h-6 px-2 text-[10px] font-mono uppercase tracking-wider transition-colors ${
              cameraFocus === 'SAT_CHASE'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="Follow Primary Satellite in Flight"
          >
            SAT-CHASE
          </button>
        </div>

        {/* Kessler Cascade Simulation Trigger */}
        <button
          onClick={toggleKesslerDemo}
          className={`h-6 px-2.5 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
            kesslerDemo
              ? 'bg-[#f43f5e] border-[#f43f5e] text-white font-bold'
              : 'border-[#f43f5e]/40 text-[#f43f5e] hover:bg-[#f43f5e]/10'
          }`}
          title="Simulate Kessler Collision Avalanche"
        >
          {kesslerDemo ? '[CASCADE ACTIVE]' : 'SIMULATE KESSLER IMPACT'}
        </button>

        {/* Ephemeris Ingestion API */}
        <button
          onClick={() => setApiModalOpen(true)}
          className="h-6 px-2 text-[10px] font-mono uppercase tracking-wider border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.04]"
        >
          EPHEMERIS API [JSON]
        </button>

        {/* Raw HUD / Cinema Mode Toggle */}
        <button
          onClick={toggleCinemaMode}
          className={`h-6 px-2 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
            cinemaMode
              ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
              : 'border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
          title="Toggle Raw HUD (Hotkey: C)"
        >
          RAW HUD [C]
        </button>
      </div>
    </header>
  );
};
