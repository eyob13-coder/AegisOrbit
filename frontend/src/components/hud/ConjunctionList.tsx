'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Crosshair, Navigation } from 'lucide-react';
import { useOrbitStore, ConjunctionEvent } from '@/store/useOrbitStore';

export const ConjunctionList: React.FC = () => {
  const conjunctions = useOrbitStore((state) => state.conjunctions);
  const selectedConjunction = useOrbitStore((state) => state.selectedConjunction);
  const selectConjunction = useOrbitStore((state) => state.selectConjunction);
  const cinemaMode = useOrbitStore((state) => state.cinemaMode);

  if (cinemaMode) return null;

  return (
    <aside className="fixed left-3 top-16 bottom-3 w-80 z-30 flex flex-col rounded-xl glass-panel p-3 overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <span className="font-bold tracking-wider text-white text-xs uppercase">Conjunction Events</span>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono text-[10px]">
          {conjunctions.length} DETECTED
        </span>
      </div>

      <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
        cKDTree screened <span className="text-cyan-300 font-mono">10km</span> threshold encounters. Select an event to inspect and simulate avoidance burns.
      </p>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {conjunctions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-mono text-xs">
            Scanning orbital catalog...
          </div>
        ) : (
          conjunctions.map((event) => {
            const isSelected = selectedConjunction?.conjunction_id === event.conjunction_id;
            const isCritical = event.risk_level === 'CRITICAL';
            const isWarning = event.risk_level === 'WARNING';

            const riskBg = isCritical
              ? 'bg-red-500/10 border-red-500/40 text-red-400'
              : isWarning
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400';

            return (
              <div
                key={event.conjunction_id}
                onClick={() => selectConjunction(event)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                {/* Top: Objects and Risk Badge */}
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0"></span>
                      <span className="font-bold text-white truncate text-[11px]">
                        {event.primary_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
                      <span className="text-slate-400 truncate text-[10px]">
                        vs {event.secondary_name}
                      </span>
                    </div>
                  </div>

                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${riskBg}`}>
                    {event.risk_level}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-800/60 font-mono text-[10px]">
                  <div>
                    <span className="text-slate-500 block text-[9px]">MISS DIST</span>
                    <span className={`font-bold ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {event.miss_distance_m.toLocaleString(undefined, { maximumFractionDigits: 0 })} m
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">REL VELOCITY</span>
                    <span className="text-slate-300">
                      {event.relative_velocity_kms} km/s
                    </span>
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1">
                  <span>TCA: {new Date(event.tca_utc).toISOString().substring(11, 19)} UTC</span>
                  <span className="text-cyan-400 flex items-center gap-0.5">
                    <Crosshair className="w-2.5 h-2.5" /> INSPECT
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
