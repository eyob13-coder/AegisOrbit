'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code2, Globe } from 'lucide-react';
import { useOrbitStore } from '@/store/useOrbitStore';

export const ApiModal: React.FC = () => {
  const isApiModalOpen = useOrbitStore((state) => state.isApiModalOpen);
  const setApiModalOpen = useOrbitStore((state) => state.setApiModalOpen);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'curl' | 'python'>('curl');

  if (!isApiModalOpen) return null;

  const curlSnippet = `curl -X POST "http://localhost:8000/api/v1/b2b/screen-ephemeris" \\
  -H "Content-Type: application/json" \\
  -d '{
    "satellite_name": "STARLINK-MISSION-BUS",
    "line1": "1 44713U 19074A   24080.50000000  .00001245  00000+0  98421-4 0  9993",
    "line2": "2 44713  53.0541 210.1256 0001428  85.2341 274.8912 15.06412584234512",
    "screening_horizon_hours": 24.0,
    "conjunction_threshold_km": 10.0
  }'`;

  const pythonSnippet = `import requests

API_URL = "http://localhost:8000/api/v1/b2b/screen-ephemeris"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-xl glass-panel border border-cyan-500/30 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold tracking-wider text-sm text-white">
              AEGIS<span className="text-cyan-400">ORBIT</span> B2B ASTRODYNAMICS API
            </h2>
          </div>
          <button
            onClick={() => setApiModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Commercial satellite operators and launch providers submit custom TLE ephemeris vectors to screen against the real-time CelesTrak NORAD catalog via high-throughput <code className="text-cyan-300 font-mono">scipy.spatial.cKDTree</code> and SGP4.
          </p>

          {/* Endpoints List */}
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-0.5">POST /api/v1/b2b/screen-ephemeris</span>
              <span className="text-slate-400 text-[10px]">Screen custom TLE against active catalog</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-0.5">POST /api/v1/simulate-maneuver</span>
              <span className="text-slate-400 text-[10px]">Solve Clohessy-Wiltshire Δv burn & fuel</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pt-1">
            <div className="flex gap-2 font-mono text-xs">
              <button
                onClick={() => setActiveTab('curl')}
                className={`pb-2 px-1 border-b-2 transition-all ${
                  activeTab === 'curl'
                    ? 'border-cyan-400 text-cyan-300 font-bold'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                cURL Webhook
              </button>
              <button
                onClick={() => setActiveTab('python')}
                className={`pb-2 px-1 border-b-2 transition-all ${
                  activeTab === 'python'
                    ? 'border-cyan-400 text-cyan-300 font-bold'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Python SDK
              </button>
            </div>

            <button
              onClick={() => handleCopy(activeTab === 'curl' ? curlSnippet : pythonSnippet)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] mb-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Code Block */}
          <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-200 overflow-x-auto leading-relaxed">
            {activeTab === 'curl' ? curlSnippet : pythonSnippet}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-800 bg-slate-950/60 text-[11px] font-mono text-slate-400">
          <span>Sub-50ms Screening Latency</span>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-1"
          >
            <Globe className="w-3 h-3" /> Swagger Docs
          </a>
        </div>
      </div>
    </div>
  );
};
