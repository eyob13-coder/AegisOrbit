'use client';

import React, { useState } from 'react';
import { useOrbitStore } from '@/store/useOrbitStore';

export const ApiModal: React.FC = () => {
  const isApiModalOpen = useOrbitStore((state) => state.isApiModalOpen);
  const setApiModalOpen = useOrbitStore((state) => state.setApiModalOpen);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'curl' | 'python'>('curl');

  if (!isApiModalOpen) return null;

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? 'https://aegisorbit-api.onrender.com'
      : 'http://localhost:8000');

  const curlSnippet = `curl -X POST "${apiBase}/api/v1/b2b/screen-ephemeris" \\
  -H "Content-Type: application/json" \\
  -d '{
    "satellite_name": "STARLINK-MISSION-BUS",
    "line1": "1 44713U 19074A   24080.50000000  .00001245  00000+0  98421-4 0  9993",
    "line2": "2 44713  53.0541 210.1256 0001428  85.2341 274.8912 15.06412584234512",
    "screening_horizon_hours": 24.0,
    "conjunction_threshold_km": 10.0
  }'`;

  const pythonSnippet = `import requests

API_URL = "${apiBase}/api/v1/b2b/screen-ephemeris"
payload = {
    "satellite_name": "STARLINK-MISSION-BUS",
    "line1": "1 44713U 19074A   24080.50000000  .00001245  00000+0  98421-4 0  9993",
    "line2": "2 44713  53.0541 210.1256 0001428  85.2341 274.8912 15.06412584234512",
    "screening_horizon_hours": 24.0,
    "conjunction_threshold_km": 10.0
}

response = requests.post(API_URL, json=payload)
data = response.json()
print(f"Screened against {data['screened_against_objects']} objects.")
print(f"Detected {data['conjunctions_found']} close approaches.")`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#06080c] border border-white/[0.12] rounded-none overflow-hidden select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08] bg-[#0b0f17]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-sky-400 inline-block" />
            <h2 className="font-mono font-bold tracking-wider text-xs text-white uppercase">
              AEGIS // B2B TELEMETRY &amp; EPHEMERIS INGESTION API
            </h2>
          </div>
          <button
            onClick={() => setApiModalOpen(false)}
            className="h-6 px-2 text-[10px] font-mono border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04]"
          >
            [CLOSE ESC]
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 text-xs">
          <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
            Commercial satellite operators submit custom TLE ephemeris vectors to screen against the real-time NORAD catalog via vectorized <code className="text-sky-300">scipy.spatial.cKDTree</code> and SGP4 astrodynamics.
          </p>

          {/* Endpoints List */}
          <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
            <div className="p-2 bg-[#0b0f17] border border-white/[0.08]">
              <span className="text-emerald-400 font-bold block mb-0.5">POST /api/v1/b2b/screen-ephemeris</span>
              <span className="text-slate-400 text-[9px]">Screen custom TLE against active catalog</span>
            </div>
            <div className="p-2 bg-[#0b0f17] border border-white/[0.08]">
              <span className="text-sky-400 font-bold block mb-0.5">POST /api/v1/simulate-maneuver</span>
              <span className="text-slate-400 text-[9px]">Solve Clohessy-Wiltshire Δv burn &amp; fuel</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pt-1">
            <div className="flex gap-1 font-mono text-[11px]">
              <button
                onClick={() => setActiveTab('curl')}
                className={`px-3 py-1 border-t border-l border-r transition-colors ${
                  activeTab === 'curl'
                    ? 'bg-[#0b0f17] border-white/[0.12] text-sky-400 font-bold'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                }`}
              >
                cURL INGESTION
              </button>
              <button
                onClick={() => setActiveTab('python')}
                className={`px-3 py-1 border-t border-l border-r transition-colors ${
                  activeTab === 'python'
                    ? 'bg-[#0b0f17] border-white/[0.12] text-sky-400 font-bold'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                }`}
              >
                PYTHON SDK
              </button>
            </div>

            <button
              onClick={() => handleCopy(activeTab === 'curl' ? curlSnippet : pythonSnippet)}
              className="px-2 py-0.5 border border-white/[0.08] hover:bg-white/[0.04] text-slate-300 font-mono text-[10px] mb-1 transition-colors"
            >
              {copied ? '[COPIED TO CLIPBOARD]' : '[COPY CODE]'}
            </button>
          </div>

          {/* Code Block */}
          <pre className="p-3 bg-[#030407] border border-white/[0.08] font-mono text-[10px] text-sky-200 overflow-x-auto leading-relaxed select-text">
            {activeTab === 'curl' ? curlSnippet : pythonSnippet}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.08] bg-[#0b0f17] text-[10px] font-mono text-slate-400">
          <span>LATENCY: &lt;50ms // THREADPOOL ISOLATED</span>
          <a
            href={`${apiBase}/docs`}
            target="_blank"
            rel="noreferrer"
            className="text-sky-400 hover:underline"
          >
            [OPEN OPENAPI SPEC]
          </a>
        </div>
      </div>
    </div>
  );
};
