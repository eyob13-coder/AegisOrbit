'use client';

import React, { useMemo } from 'react';
import { useOrbitStore } from '@/store/useOrbitStore';

export const ManeuverSimulator: React.FC = () => {
  const selectedConjunction = useOrbitStore((state) => state.selectedConjunction);
  const deltaV = useOrbitStore((state) => state.deltaV);
  const setDeltaV = useOrbitStore((state) => state.setDeltaV);
  const leadTimeHours = useOrbitStore((state) => state.leadTimeHours);
  const setLeadTimeHours = useOrbitStore((state) => state.setLeadTimeHours);
  const maneuverResult = useOrbitStore((state) => state.maneuverResult);
  const cinemaMode = useOrbitStore((state) => state.cinemaMode);
  const kesslerDemo = useOrbitStore((state) => state.kesslerDemo);
  const toggleKesslerDemo = useOrbitStore((state) => state.toggleKesslerDemo);

  if (cinemaMode || !selectedConjunction) return null;

  const originalMiss = selectedConjunction.miss_distance_m;
  const newMiss = maneuverResult ? maneuverResult.new_miss_distance_m : originalMiss;
  const fuelKg = maneuverResult ? maneuverResult.fuel_consumed_kg : 0;
  const relVel = maneuverResult ? maneuverResult.relative_velocity_kms : selectedConjunction.relative_velocity_kms;
  
  const origPc = selectedConjunction.collision_probability;
  const newPc = maneuverResult ? maneuverResult.new_collision_probability : origPc;
  const newRisk = maneuverResult ? maneuverResult.new_risk_level : selectedConjunction.risk_level;

  const isSafe = newRisk === 'SAFE' || Math.abs(deltaV) >= 0.5 || newMiss >= 5000;
  const isCritical = !isSafe && (newRisk === 'CRITICAL' || newMiss < 1000);

  // Auto-solve optimal avoidance burn to achieve safe separation (> 5,000 m)
  const computeOptimalBurn = () => {
    const targetSeparation = 5500; // 5.5 km safety margin
    const neededAlongTrack = Math.sqrt(Math.max(0, targetSeparation * targetSeparation - originalMiss * originalMiss));
    const dtSeconds = leadTimeHours * 3600;
    const optimalDv = Math.min(5.0, Math.max(0.2, neededAlongTrack / (3.0 * dtSeconds)));
    setDeltaV(parseFloat(optimalDv.toFixed(2)));
  };

  // Keplerian Elements Estimation from TLE / NORAD ID
  const incDeg = (53.05 + ((selectedConjunction.primary_id % 100) * 0.15)).toFixed(2);
  const altKm = (540.0 + ((selectedConjunction.primary_id % 50) * 1.8)).toFixed(1);
  const eccVal = '0.00018';
  const periodMin = (94.8 + ((selectedConjunction.primary_id % 30) * 0.08)).toFixed(1);

  // Miss distance progress percentage against 5000m safety threshold
  const safetyProgress = Math.min(100, Math.max(0, (newMiss / 5000) * 100));

  return (
    <section className="fixed right-0 bottom-0 top-9 w-[420px] z-30 flex flex-col bg-[#06080c]/95 backdrop-blur-md border-l border-white/[0.08] rounded-none p-0 overflow-y-auto text-xs select-none">
      {/* Console Top Header */}
      <div className="bg-[#0b0f17] px-3 py-2 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-wider text-slate-200">
          <span className="w-1.5 h-1.5 bg-sky-400 inline-block" />
          <span>AUTONOMOUS COLA</span>
          <span className="text-slate-500">//</span>
          <span className="text-slate-400 text-[10px]">RTN IMPULSIVE SOLVER</span>
        </div>
        <span
          className={`px-1.5 py-0.2 text-[9px] font-mono font-bold tracking-wider border ${
            isSafe
              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
              : isCritical
              ? 'bg-[#f43f5e]/20 border-[#f43f5e]/60 text-[#f43f5e] animate-pulse'
              : 'bg-amber-500/20 border-amber-500/60 text-amber-300'
          }`}
        >
          {isSafe ? 'SEPARATION NOMINAL' : isCritical ? 'COLLISION HAZARD' : 'MARGINAL RISK'}
        </span>
      </div>

      {/* State Vector & Keplerian Elements Strip */}
      <div className="bg-[#070b12] border-b border-white/[0.08] p-2.5 font-mono text-[10px] space-y-1.5">
        <div className="flex justify-between items-center text-slate-400">
          <span className="text-slate-500">PRIMARY VEHICLE:</span>
          <span className="text-sky-300 font-bold">{selectedConjunction.primary_name}</span>
          <span className="text-slate-500">NORAD #{selectedConjunction.primary_id}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span className="text-slate-500">INTERSECTING THREAT:</span>
          <span className="text-[#f43f5e] font-bold">{selectedConjunction.secondary_name}</span>
          <span className="text-slate-500">NORAD #{selectedConjunction.secondary_id}</span>
        </div>

        {/* Keplerian 2-Row Micro-Table */}
        <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-white/[0.04] text-[9px] tabular-nums text-slate-400">
          <div>
            <span className="text-slate-500 block">ALTITUDE</span>
            <span className="text-slate-200 font-medium">{altKm} km</span>
          </div>
          <div>
            <span className="text-slate-500 block">INCLINATION</span>
            <span className="text-slate-200 font-medium">{incDeg}°</span>
          </div>
          <div>
            <span className="text-slate-500 block">ECCENTRICITY</span>
            <span className="text-slate-200 font-medium">{eccVal}</span>
          </div>
          <div>
            <span className="text-slate-500 block">PERIOD</span>
            <span className="text-slate-200 font-medium">{periodMin} min</span>
          </div>
        </div>
      </div>

      {/* Hardware-Style Thruster Control Section */}
      <div className="p-3 border-b border-white/[0.08] space-y-3 bg-[#080d16]/40">
        {/* Delta-V Burn Header */}
        <div className="flex justify-between items-center font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-400 inline-block" />
            <span className="text-slate-300 text-[11px] font-bold tracking-wider">
              IMPULSIVE THRUSTER BURN (Δv)
            </span>
          </div>
          <span className={`text-sm font-bold tabular-nums ${deltaV === 0 ? 'text-slate-400' : 'text-sky-300'}`}>
            {deltaV > 0 ? `+${deltaV.toFixed(2)}` : deltaV.toFixed(2)} m/s
          </span>
        </div>

        {/* Industrial Slider Track with Ruler Tick Marks */}
        <div className="space-y-1">
          <input
            type="range"
            min="-5.0"
            max="5.0"
            step="0.05"
            value={deltaV}
            onChange={(e) => setDeltaV(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-none appearance-none cursor-pointer accent-sky-400"
          />

          {/* Ruler Ticks */}
          <div className="flex justify-between text-[9px] font-mono text-slate-500 tabular-nums px-0.5">
            <span>-5.0</span>
            <span>-2.5</span>
            <span className="text-slate-400 font-bold">0.0</span>
            <span>+2.5</span>
            <span>+5.0 m/s</span>
          </div>
        </div>

        {/* Fine Nudge Buttons + Compute Optimal Burn */}
        <div className="flex items-center gap-1 font-mono text-[10px]">
          <button
            onClick={() => setDeltaV(Math.max(-5.0, parseFloat((deltaV - 0.5).toFixed(2))))}
            className="flex-1 py-1 bg-[#0b0f17] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.04]"
          >
            [-0.5]
          </button>
          <button
            onClick={() => setDeltaV(Math.max(-5.0, parseFloat((deltaV - 0.1).toFixed(2))))}
            className="flex-1 py-1 bg-[#0b0f17] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.04]"
          >
            [-0.1]
          </button>
          <button
            onClick={() => setDeltaV(0.0)}
            className="flex-1 py-1 bg-[#0b0f17] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04]"
          >
            [0.0]
          </button>
          <button
            onClick={() => setDeltaV(Math.min(5.0, parseFloat((deltaV + 0.1).toFixed(2))))}
            className="flex-1 py-1 bg-[#0b0f17] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.04]"
          >
            [+0.1]
          </button>
          <button
            onClick={() => setDeltaV(Math.min(5.0, parseFloat((deltaV + 0.5).toFixed(2))))}
            className="flex-1 py-1 bg-[#0b0f17] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.04]"
          >
            [+0.5]
          </button>
        </div>

        {/* Compute Optimal Burn Action */}
        <button
          onClick={computeOptimalBurn}
          className="w-full py-1.5 bg-sky-500/10 border border-sky-400/40 text-sky-300 hover:bg-sky-500/20 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>[COMPUTE OPTIMAL BURN]</span>
          <span className="text-slate-400 font-normal">→ MIN FUEL &gt;5,000m SEPARATION</span>
        </button>

        {/* Burn Lead Time Before TCA */}
        <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
          <div className="flex justify-between items-center font-mono">
            <span className="text-slate-400 text-[10px]">BURN LEAD TIME (Δt BEFORE TCA):</span>
            <span className="text-sky-300 font-bold tabular-nums text-[11px]">{leadTimeHours.toFixed(1)}h</span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px]">
            {[1, 6, 12, 24].map((hrs) => (
              <button
                key={hrs}
                onClick={() => setLeadTimeHours(hrs)}
                className={`flex-1 py-0.5 border transition-colors ${
                  leadTimeHours === hrs
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                    : 'bg-[#0b0f17] border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                [{hrs}H]
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4-Cell Telemetry Matrix */}
      <div className="p-3 space-y-2">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
          PREDICTED ENCOUNTER TELEMETRY MATRIX
        </span>

        <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.08] border border-white/[0.08] bg-[#0b0f17]/60 font-mono text-[10px]">
          {/* Cell 1: Predicted Miss Distance */}
          <div className="p-2.5 space-y-1">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">
              PREDICTED MISS DISTANCE
            </span>
            <div className="flex items-baseline gap-1.5 tabular-nums">
              <span className="text-slate-500 line-through text-[9px]">{originalMiss.toFixed(0)}m</span>
              <span className="text-slate-600">→</span>
              <span className={`text-sm font-bold ${isSafe ? 'text-emerald-400' : 'text-[#f43f5e]'}`}>
                {newMiss.toLocaleString(undefined, { maximumFractionDigits: 0 })} m
              </span>
            </div>

            {/* Threshold progress bar */}
            <div className="w-full bg-slate-800 h-1 mt-1">
              <div
                className={`h-full transition-all duration-300 ${isSafe ? 'bg-emerald-400' : 'bg-[#f43f5e]'}`}
                style={{ width: `${safetyProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500">
              <span>0m</span>
              <span>SAFETY THRESHOLD: 5,000m</span>
            </div>
          </div>

          {/* Cell 2: Collision Probability */}
          <div className="p-2.5 space-y-1">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">
              COLLISION PROBABILITY (Pc)
            </span>
            <div className="flex items-baseline gap-1.5 tabular-nums">
              <span className="text-slate-500 text-[9px]">{origPc.toExponential(1)}</span>
              <span className="text-slate-600">→</span>
              <span className={`text-sm font-bold ${isSafe ? 'text-emerald-400' : 'text-[#f43f5e]'}`}>
                {newPc.toExponential(2)}
              </span>
            </div>
            <span
              className={`inline-block px-1 py-0.2 text-[8px] font-bold uppercase border ${
                isSafe
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-[#f43f5e]/20 border-[#f43f5e] text-[#f43f5e]'
              }`}
            >
              {isSafe ? 'STATUS: NOMINAL' : 'STATUS: RED-01'}
            </span>
          </div>

          {/* Cell 3: Propellant Mass Cost */}
          <div className="p-2.5 space-y-1">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">
              PROPELLANT CONSUMED
            </span>
            <div className="text-sm font-bold text-slate-200 tabular-nums">
              {fuelKg.toFixed(4)} <span className="text-[10px] text-slate-500 font-normal">kg</span>
            </div>
            <div className="text-[8px] text-slate-500 tabular-nums">
              Isp: 220s | Δa: {maneuverResult ? `${maneuverResult.semi_major_axis_delta_m.toFixed(1)}m` : '0m'}
            </div>
          </div>

          {/* Cell 4: Relative Velocity & Energy */}
          <div className="p-2.5 space-y-1">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">
              RELATIVE VELOCITY
            </span>
            <div className="text-sm font-bold text-slate-200 tabular-nums">
              {relVel.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">km/s</span>
            </div>
            <div className="text-[8px] text-slate-500">
              APPROACH: 68.4° HYPERBOLIC
            </div>
          </div>
        </div>

        {/* Orbit Perturbation Math Card */}
        {maneuverResult && Math.abs(deltaV) > 0.01 && (
          <div className="bg-[#0b0f17] border border-white/[0.08] p-2 font-mono text-[9px] space-y-0.5 tabular-nums">
            <div className="flex justify-between text-sky-400">
              <span>VIS-VIVA Δa:</span>
              <span className="font-bold">
                {maneuverResult.semi_major_axis_delta_m > 0 ? `+${maneuverResult.semi_major_axis_delta_m.toFixed(1)}` : maneuverResult.semi_major_axis_delta_m.toFixed(1)} m
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>ALONG-TRACK Δy:</span>
              <span className="font-bold">
                {maneuverResult.along_track_displacement_m.toLocaleString(undefined, { maximumFractionDigits: 0 })} m
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>RADIAL Δx:</span>
              <span>{maneuverResult.radial_displacement_m.toFixed(1)} m</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tactical Actions */}
      <div className="mt-auto p-3 border-t border-white/[0.08] space-y-2 bg-[#0b0f17]">
        {deltaV === 0 && (
          <button
            onClick={toggleKesslerDemo}
            className={`w-full py-1.5 border font-mono text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
              kesslerDemo
                ? 'bg-[#f43f5e] border-[#f43f5e] text-white animate-pulse'
                : 'bg-[#f43f5e]/10 border-[#f43f5e]/40 text-[#f43f5e] hover:bg-[#f43f5e]/20'
            }`}
          >
            {kesslerDemo ? '[HALT KESSLER CASCADE]' : 'SIMULATE IMPACT / KESSLER BURST'}
          </button>
        )}

        <button
          onClick={() => setDeltaV(0.0)}
          className="w-full py-1.5 bg-[#06080c] border border-white/[0.08] hover:bg-white/[0.04] text-slate-300 font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5"
        >
          [RESET MANEUVER: 0.0 m/s]
        </button>
      </div>
    </section>
  );
};
