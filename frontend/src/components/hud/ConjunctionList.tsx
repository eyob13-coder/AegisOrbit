'use client';

import React, { useState, useMemo } from 'react';
import { useOrbitStore, ConjunctionEvent } from '@/store/useOrbitStore';

export const ConjunctionList: React.FC = () => {
  const conjunctions = useOrbitStore((state) => state.conjunctions);
  const selectedConjunction = useOrbitStore((state) => state.selectedConjunction);
  const selectConjunction = useOrbitStore((state) => state.selectConjunction);
  const cinemaMode = useOrbitStore((state) => state.cinemaMode);

  const [filter, setFilter] = useState<'ALL' | 'CRIT' | 'WARN'>('ALL');

  const filteredConjunctions = useMemo(() => {
    if (filter === 'CRIT') {
      return conjunctions.filter((c) => c.risk_level === 'CRITICAL' || c.miss_distance_m < 1000);
    }
    if (filter === 'WARN') {
      return conjunctions.filter((c) => c.risk_level === 'WARNING' || c.miss_distance_m < 5000);
    }
    return conjunctions;
  }, [conjunctions, filter]);

  if (cinemaMode) return null;

  return (
    <aside className="fixed left-0 top-9 bottom-0 w-[340px] z-30 flex flex-col bg-[#06080c]/95 backdrop-blur-md border-r border-white/[0.08] rounded-none p-0 overflow-hidden text-xs select-none">
      {/* Top Console Bar */}
      <div className="bg-[#0b0f17] px-3 py-2 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-wider text-slate-200">
          <span className="w-1.5 h-1.5 bg-sky-400 inline-block" />
          <span>CDM SCREENING QUEUE</span>
          <span className="text-slate-500">//</span>
          <span className="text-slate-400 text-[10px]">24H HORIZON</span>
        </div>
        <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 border border-sky-500/30 px-1 py-0.2">
          {conjunctions.length} TRACKED
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center bg-[#070b12] border-b border-white/[0.08] text-[10px] font-mono px-3 py-1.5 gap-1.5">
        <span className="text-slate-500 mr-1">FILTER:</span>
        <button
          onClick={() => setFilter('ALL')}
          className={`px-2 py-0.5 border transition-colors ${
            filter === 'ALL'
              ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
              : 'border-white/[0.08] text-slate-400 hover:text-white'
          }`}
        >
          ALL [{conjunctions.length}]
        </button>
        <button
          onClick={() => setFilter('CRIT')}
          className={`px-2 py-0.5 border transition-colors ${
            filter === 'CRIT'
              ? 'bg-[#f43f5e]/20 border-[#f43f5e] text-[#f43f5e] font-bold'
              : 'border-white/[0.08] text-slate-400 hover:text-[#f43f5e]'
          }`}
        >
          CRIT &lt;1KM
        </button>
        <button
          onClick={() => setFilter('WARN')}
          className={`px-2 py-0.5 border transition-colors ${
            filter === 'WARN'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
              : 'border-white/[0.08] text-slate-400 hover:text-amber-300'
          }`}
        >
          WARN &lt;5KM
        </button>
      </div>

      {/* Dense Tabular Aerospace Log */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.06]">
        {filteredConjunctions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-[11px]">
            [NO DETECTED CONJUNCTIONS MATCHING FILTER]
          </div>
        ) : (
          filteredConjunctions.map((event, idx) => {
            const isSelected = selectedConjunction?.conjunction_id === event.conjunction_id;
            const isCritical = event.risk_level === 'CRITICAL';
            const isWarning = event.risk_level === 'WARNING';

            const statusColor = isCritical ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981';
            const cdmCode = `CDM-${event.conjunction_id.replace(/\D/g, '').slice(-4) || (8840 + idx)}`;

            // Formatted countdown or relative TCA
            const tcaDate = new Date(event.tca_utc);
            const tcaTimeStr = tcaDate.toISOString().substring(11, 19);

            return (
              <div
                key={event.conjunction_id}
                onClick={() => selectConjunction(event)}
                className={`py-2 px-3 transition-colors cursor-pointer relative font-mono text-[11px] ${
                  isSelected
                    ? 'bg-[#0e1626]'
                    : 'bg-transparent hover:bg-white/[0.02]'
                }`}
              >
                {/* 2px Status indicator bar on the left */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{ backgroundColor: isSelected ? '#38bdf8' : statusColor }}
                />

                {/* Line 1: CDM ID, Targets & Risk Tag */}
                <div className="flex items-center justify-between mb-1 pl-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-500 text-[10px] font-semibold">{cdmCode}</span>
                    <span className="text-slate-200 font-bold text-[11px] truncate">
                      {event.primary_name}
                    </span>
                    <span className="text-slate-500 text-[10px]">×</span>
                    <span className="text-slate-400 text-[10px] truncate">
                      {event.secondary_name}
                    </span>
                  </div>

                  {/* Status Badge */}
                  {isSelected ? (
                    <span className="px-1 py-0.2 text-[9px] bg-sky-500 text-slate-950 font-bold tracking-wider">
                      LOCKED
                    </span>
                  ) : isCritical ? (
                    <span className="px-1 py-0.2 text-[9px] bg-[#f43f5e]/20 border border-[#f43f5e]/50 text-[#f43f5e] font-bold animate-pulse">
                      CRIT
                    </span>
                  ) : (
                    <span className="px-1 py-0.2 text-[9px] bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold">
                      WARN
                    </span>
                  )}
                </div>

                {/* Line 2: 4-Column Micro-Grid Readout */}
                <div className="grid grid-cols-4 gap-1 pl-1 pt-1 border-t border-white/[0.04] text-[10px] tabular-nums">
                  <div>
                    <span className="text-slate-500 block text-[8px] uppercase tracking-wider">TCA UTC</span>
                    <span className="text-slate-300 font-medium" suppressHydrationWarning>
                      {tcaTimeStr}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px] uppercase tracking-wider">MISS DIST</span>
                    <span className={`font-bold ${isCritical ? 'text-[#f43f5e]' : 'text-amber-400'}`}>
                      {event.miss_distance_m.toLocaleString(undefined, { maximumFractionDigits: 0 })}m
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px] uppercase tracking-wider">V_REL</span>
                    <span className="text-slate-300">{event.relative_velocity_kms.toFixed(1)} km/s</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px] uppercase tracking-wider">Pc</span>
                    <span className={`font-medium ${event.collision_probability > 1e-4 ? 'text-[#f43f5e]' : 'text-slate-300'}`}>
                      {event.collision_probability.toExponential(1)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Subsystem Status */}
      <div className="bg-[#0b0f17] p-2 border-t border-white/[0.08] text-[9px] font-mono text-slate-500 flex items-center justify-between">
        <span>ASTRODYNAMICS FILTER: SPATIAL cKDTREE</span>
        <span className="text-slate-400">J2000 ECI</span>
      </div>
    </aside>
  );
};
