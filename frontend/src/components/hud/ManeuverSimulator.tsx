'use client';

import React from 'react';
import { 
  Rocket, 
  Fuel, 
  Gauge, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Sliders, 
  RotateCcw,
  TrendingUp,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useOrbitStore } from '@/store/useOrbitStore';

export const ManeuverSimulator: React.FC = () => {
  const selectedConjunction = useOrbitStore((state) => state.selectedConjunction);
  const deltaV = useOrbitStore((state) => state.deltaV);
  const setDeltaV = useOrbitStore((state) => state.setDeltaV);
  const leadTimeHours = useOrbitStore((state) => state.leadTimeHours);
  const setLeadTimeHours = useOrbitStore((state) => state.setLeadTimeHours);
  const maneuverResult = useOrbitStore((state) => state.maneuverResult);
  const isSimulatingManeuver = useOrbitStore((state) => state.isSimulatingManeuver);
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

  const isSafe = newRisk === 'SAFE';
  const isCritical = newRisk === 'CRITICAL';

  const riskBadgeClass = isSafe
    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
    : isCritical
    ? 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse'
    : 'bg-amber-500/20 border-amber-500/50 text-amber-300';

  const presets = [
    { label: '0.0 m/s', value: 0.0 },
    { label: '+0.5 m/s', value: 0.5 },
    { label: '+1.5 m/s', value: 1.5 },
    { label: '+3.0 m/s', value: 3.0 },
    { label: '-1.5 m/s', value: -1.5 },
  ];

  return (
    <section className="fixed right-3 top-16 bottom-3 w-96 z-30 flex flex-col rounded-xl glass-panel p-3.5 text-xs overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-cyan-400" />
          <span className="font-bold tracking-wider text-white text-xs uppercase">Evasion Maneuver Solver</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${riskBadgeClass}`}>
          {newRisk}
        </span>
      </div>

      {/* Target Satellite Header */}
      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 mb-3 font-mono text-[11px]">
        <div className="flex justify-between items-center text-slate-400">
          <span>PRIMARY BUS:</span>
          <span className="text-cyan-300 font-bold">{selectedConjunction.primary_name}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400 mt-1">
          <span>THREAT OBJECT:</span>
          <span className="text-red-400 font-bold">{selectedConjunction.secondary_name}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400 mt-1 border-t border-slate-800/80 pt-1">
          <span>TCA EPOCH:</span>
          <span className="text-white">{new Date(selectedConjunction.tca_utc).toISOString().substring(0, 19)} UTC</span>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="space-y-3.5 mb-4">
        {/* Delta-V Slider */}
        <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center mb-1.5 font-mono">
            <span className="text-slate-300 flex items-center gap-1.5 font-sans font-medium">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Impulsive Thruster Burn (Δv):
            </span>
            <span className={`font-bold text-sm ${deltaV === 0 ? 'text-slate-400' : 'text-cyan-300'}`}>
              {deltaV > 0 ? `+${deltaV.toFixed(2)}` : deltaV.toFixed(2)} m/s
            </span>
          </div>

          <input
            type="range"
            min="-5.0"
            max="5.0"
            step="0.05"
            value={deltaV}
            onChange={(e) => setDeltaV(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
            <span>-5.0 m/s (Retrograde)</span>
            <span>0.0 m/s</span>
            <span>+5.0 m/s (Prograde)</span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 mt-2">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => setDeltaV(p.value)}
                className={`flex-1 py-1 rounded font-mono text-[10px] transition-all ${
                  deltaV === p.value
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Burn Lead Time Slider */}
        <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center mb-1.5 font-mono">
            <span className="text-slate-300 flex items-center gap-1.5 font-sans font-medium">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Burn Lead Time Before TCA (Δt):
            </span>
            <span className="text-cyan-300 font-bold text-sm">
              {leadTimeHours.toFixed(1)} hrs
            </span>
          </div>

          <input
            type="range"
            min="1.0"
            max="24.0"
            step="0.5"
            value={leadTimeHours}
            onChange={(e) => setLeadTimeHours(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
            <span>1.0 hr</span>
            <span>12.0 hrs</span>
            <span>24.0 hrs</span>
          </div>
        </div>
      </div>

      {/* Real-time Astrodynamics Telemetry Cards */}
      <div className="space-y-2 mb-3">
        <h3 className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-0.5">
          Predicted Encounter Telemetry
        </h3>

        {/* Miss Distance Card */}
        <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="flex justify-between text-slate-400 text-[10px] font-mono mb-1">
            <span>MISS DISTANCE AT TCA</span>
            <span className="text-slate-500">{originalMiss.toFixed(0)}m nominal</span>
          </div>
          <div className="flex items-baseline justify-between font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">ORIG: {originalMiss.toFixed(0)}m</span>
              <span className="text-slate-600">→</span>
              <span className={`text-base font-bold ${isSafe ? 'text-emerald-400' : isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                {newMiss.toLocaleString(undefined, { maximumFractionDigits: 0 })} m
              </span>
            </div>
            {newMiss > originalMiss && (
              <span className="text-[10px] text-emerald-400 font-bold">
                +{(newMiss - originalMiss).toLocaleString(undefined, { maximumFractionDigits: 0 })} m
              </span>
            )}
          </div>
        </div>

        {/* Collision Probability (Pc) Card */}
        <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="flex justify-between text-slate-400 text-[10px] font-mono mb-1">
            <span>COLLISION PROBABILITY (Pc)</span>
            <span>2D B-PLANE ENCOUNTER</span>
          </div>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-xs text-slate-500">
              {origPc.toExponential(2)}
            </span>
            <span className="text-slate-600">→</span>
            <span className={`text-sm font-bold ${newPc < 1e-5 ? 'text-emerald-400' : 'text-red-400'}`}>
              {newPc.toExponential(2)}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase border ${riskBadgeClass}`}>
              {newRisk}
            </span>
          </div>
        </div>

        {/* Propellant & Relative Velocity Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800 font-mono">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <Fuel className="w-3 h-3 text-cyan-400" />
              <span>FUEL CONSUMED</span>
            </div>
            <div className="text-sm font-bold text-white">
              {fuelKg.toFixed(4)} <span className="text-[10px] text-slate-400 font-normal">kg</span>
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">Isp=220s, m=260kg</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800 font-mono">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <Gauge className="w-3 h-3 text-amber-400" />
              <span>RELATIVE VEL</span>
            </div>
            <div className="text-sm font-bold text-white">
              {relVel.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">km/s</span>
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">Impact energy ~{((0.5 * 10 * relVel * relVel * 1e6) / 1e6).toFixed(0)}MJ</div>
          </div>
        </div>

        {/* Orbit Perturbation Math Card */}
        {maneuverResult && Math.abs(deltaV) > 0.01 && (
          <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30 font-mono text-[10px] space-y-1">
            <div className="flex justify-between text-cyan-300">
              <span>VIS-VIVA Δa:</span>
              <span className="font-bold">{maneuverResult.semi_major_axis_delta_m > 0 ? `+${maneuverResult.semi_major_axis_delta_m.toFixed(1)}` : maneuverResult.semi_major_axis_delta_m.toFixed(1)} m</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>ALONG-TRACK Δy:</span>
              <span className="font-bold">{maneuverResult.along_track_displacement_m.toLocaleString(undefined, { maximumFractionDigits: 0 })} m</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>RADIAL Δx:</span>
              <span>{maneuverResult.radial_displacement_m.toFixed(1)} m</span>
            </div>
          </div>
        )}

        {/* Dynamic Safe Separation Banner */}
        {Math.abs(deltaV) >= 0.5 && (
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/50 flex items-center gap-2 text-emerald-300 font-mono text-[10px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">SAFE SEPARATION ACHIEVED</span>
              <div className="text-[9px] text-emerald-400/80">
                Miss distance expanded to {newMiss.toLocaleString(undefined, { maximumFractionDigits: 0 })}m. Collision risk resolved.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto pt-2 space-y-2">
        {deltaV === 0 && (
          <button
            onClick={toggleKesslerDemo}
            className={`w-full py-1.5 rounded-lg border font-mono text-[11px] flex items-center justify-center gap-1.5 transition-all ${
              kesslerDemo
                ? 'bg-red-500/30 border-red-500 text-red-200 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'bg-red-950/40 border-red-500/50 hover:bg-red-900/40 text-red-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-red-400" />
            {kesslerDemo ? 'HALT KESSLER CASCADE' : 'SIMULATE IMPACT / KESSLER BURST'}
          </button>
        )}

        <button
          onClick={() => {
            setDeltaV(0.0);
          }}
          className="w-full py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-mono text-[11px] flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3 h-3" />
          RESET MANEUVER (0 m/s)
        </button>
      </div>
    </section>
  );
};
