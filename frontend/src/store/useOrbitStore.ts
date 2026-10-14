import { create } from 'zustand';
import { FALLBACK_CATALOG, FALLBACK_CONJUNCTIONS } from '@/data/fallbackSnapshot';

export interface TLERecord {
  norad_id: number;
  name: string;
  line1: string;
  line2: string;
}

export interface Waypoint {
  time: string;
  timestamp: number;
  eci: [number, number, number];
  scene: [number, number, number];
}

export interface ConjunctionEvent {
  conjunction_id: string;
  primary_id: number;
  primary_name: string;
  primary_tle: TLERecord;
  secondary_id: number;
  secondary_name: string;
  secondary_tle: TLERecord;
  tca_utc: string;
  tca_timestamp: number;
  miss_distance_m: number;
  relative_velocity_kms: number;
  collision_probability: number;
  risk_level: 'CRITICAL' | 'WARNING' | 'SAFE';
  primary_position_eci: [number, number, number];
  secondary_position_eci: [number, number, number];
  primary_position_scene: [number, number, number];
  secondary_position_scene: [number, number, number];
  primary_path: Waypoint[];
  secondary_path: Waypoint[];
}

export interface ManeuverResult {
  conjunction_id: string;
  delta_v_ms: number;
  lead_time_hours: number;
  original_miss_distance_m: number;
  new_miss_distance_m: number;
  miss_distance_delta_m: number;
  fuel_consumed_kg: number;
  relative_velocity_kms: number;
  original_risk_level: 'CRITICAL' | 'WARNING' | 'SAFE';
  new_risk_level: 'CRITICAL' | 'WARNING' | 'SAFE';
  original_collision_probability: number;
  new_collision_probability: number;
  semi_major_axis_delta_m: number;
  along_track_displacement_m: number;
  radial_displacement_m: number;
  perturbed_path: Waypoint[];
  maneuvered_position_scene: [number, number, number];
}

interface OrbitState {
  // Catalog & Conjunction Data
  catalog: TLERecord[];
  catalogCount: number;
  conjunctions: ConjunctionEvent[];
  selectedConjunction: ConjunctionEvent | null;
  isLoading: boolean;
  error: string | null;

  // Maneuver State
  deltaV: number;
  leadTimeHours: number;
  maneuverResult: ManeuverResult | null;
  isSimulatingManeuver: boolean;

  // Simulation Controls
  simSpeed: number;
  isSimPaused: boolean;
  simTime: number; // Unix timestamp in ms
  cameraFocus: 'GLOBAL' | 'CONJUNCTION' | 'SAT_CHASE';
  liveSatPosition: [number, number, number] | null;

  // HUD & Recording Options
  cinemaMode: boolean;
  kesslerDemo: boolean;
  isApiModalOpen: boolean;

  // Actions
  fetchCatalog: () => Promise<void>;
  fetchConjunctions: () => Promise<void>;
  selectConjunction: (event: ConjunctionEvent) => void;
  setDeltaV: (val: number) => void;
  setLeadTimeHours: (val: number) => void;
  runManeuverSimulation: (deltaV?: number, leadHours?: number) => Promise<void>;
  setSimSpeed: (speed: number) => void;
  toggleSimPause: () => void;
  advanceSimTime: (deltaSeconds: number) => void;
  setCameraFocus: (focus: 'GLOBAL' | 'CONJUNCTION' | 'SAT_CHASE') => void;
  setLiveSatPosition: (pos: [number, number, number]) => void;
  toggleCinemaMode: () => void;
  toggleKesslerDemo: () => void;
  setApiModalOpen: (open: boolean) => void;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://aegisorbit-api.onrender.com'
    : 'http://localhost:8000');
let syncTimer: NodeJS.Timeout | null = null;

const initialConjunction = FALLBACK_CONJUNCTIONS[0];
const initialResult: ManeuverResult = {
  conjunction_id: initialConjunction.conjunction_id,
  delta_v_ms: 0.0,
  lead_time_hours: 6.0,
  original_miss_distance_m: initialConjunction.miss_distance_m,
  new_miss_distance_m: initialConjunction.miss_distance_m,
  miss_distance_delta_m: 0.0,
  fuel_consumed_kg: 0.0,
  relative_velocity_kms: initialConjunction.relative_velocity_kms,
  original_risk_level: initialConjunction.risk_level,
  new_risk_level: initialConjunction.risk_level,
  original_collision_probability: initialConjunction.collision_probability,
  new_collision_probability: initialConjunction.collision_probability,
  semi_major_axis_delta_m: 0.0,
  along_track_displacement_m: 0.0,
  radial_displacement_m: 0.0,
  perturbed_path: initialConjunction.primary_path,
  maneuvered_position_scene: initialConjunction.primary_position_scene,
};

export const useOrbitStore = create<OrbitState>((set, get) => ({
  catalog: FALLBACK_CATALOG,
  catalogCount: 10000,
  conjunctions: FALLBACK_CONJUNCTIONS,
  selectedConjunction: initialConjunction,
  isLoading: false,
  error: null,

  deltaV: 0.0,
  leadTimeHours: 6.0,
  maneuverResult: initialResult,
  isSimulatingManeuver: false,

  simSpeed: 1,
  isSimPaused: false,
  simTime: Date.now(),
  cameraFocus: 'CONJUNCTION',
  liveSatPosition: initialConjunction.primary_position_scene,

  cinemaMode: false,
  kesslerDemo: false,
  isApiModalOpen: false,

  fetchCatalog: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await fetch(`${API_BASE}/api/v1/catalog`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load catalog`);
      const data = await res.json();
      if (data.catalog && data.catalog.length > 0) {
        set({
          catalog: data.catalog,
          catalogCount: data.total_count || data.catalog.length,
          isLoading: false,
        });
      }
    } catch (err: any) {
      console.warn('Backend catalog API offline, preserving fallback catalog sample:', err);
      set({ isLoading: false });
    }
  },

  fetchConjunctions: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/conjunctions`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load conjunctions`);
      const data: ConjunctionEvent[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        set({
          conjunctions: data,
          selectedConjunction: data[0],
        });
        get().runManeuverSimulation(0.0, 6.0);
      }
    } catch (err: any) {
      console.warn('Backend conjunctions API offline, preserving fallback events:', err);
    }
  },

  selectConjunction: (event: ConjunctionEvent) => {
    set({
      selectedConjunction: event,
      cameraFocus: 'CONJUNCTION',
      deltaV: 0.0,
      kesslerDemo: false,
      maneuverResult: null,
    });
    get().setDeltaV(0.0);
  },

  setDeltaV: (val: number) => {
    // 1. Instantaneous 60-FPS Client-Side Vis-Viva & CW displacement
    const current = get().selectedConjunction;
    const lead = get().leadTimeHours;

    if (current) {
      const origMiss = current.miss_distance_m;
      // Along-track separation delta_y approx -3 * deltaV * dt
      const alongTrackM = Math.abs(-3.0 * val * (lead * 3600.0));
      const newMissM = Math.sqrt(origMiss * origMiss + alongTrackM * alongTrackM);
      const fuel = 260.0 * (1.0 - Math.exp(-Math.abs(val) / (220.0 * 9.80665)));
      const deltaA = (2.0 * (6800.0 ** 2) * 7.6 / 398600.4418) * (val / 1000.0) * 1000.0;
      const radialDisp = (2.0 * Math.abs(val) / 0.0011) * 0.1;

      // 60-FPS 3D Ribbon Separation: Shift primary waypoints outward
      const perturbedPath = current.primary_path.map((wp, idx) => {
        const factor = Math.sin((idx / Math.max(1, current.primary_path.length - 1)) * Math.PI);
        const shiftScale = (val / 5.0) * 0.045 * factor;
        const normX = wp.scene[0];
        const normY = wp.scene[1];
        const normZ = wp.scene[2];
        const len = Math.hypot(normX, normY, normZ) || 1.0;
        return {
          ...wp,
          scene: [
            wp.scene[0] + (normX / len) * shiftScale,
            wp.scene[1] + (normY / len) * shiftScale,
            wp.scene[2] + (normZ / len) * shiftScale,
          ] as [number, number, number],
        };
      });

      const pTca = current.primary_position_scene;
      const tcaLen = Math.hypot(pTca[0], pTca[1], pTca[2]) || 1.0;
      const tcaShift = (val / 5.0) * 0.045;
      const maneuveredPosScene: [number, number, number] = [
        pTca[0] + (pTca[0] / tcaLen) * tcaShift,
        pTca[1] + (pTca[1] / tcaLen) * tcaShift,
        pTca[2] + (pTca[2] / tcaLen) * tcaShift,
      ];

      const instantResult: ManeuverResult = {
        conjunction_id: current.conjunction_id,
        delta_v_ms: val,
        lead_time_hours: lead,
        original_miss_distance_m: origMiss,
        new_miss_distance_m: newMissM,
        miss_distance_delta_m: newMissM - origMiss,
        fuel_consumed_kg: fuel,
        relative_velocity_kms: current.relative_velocity_kms,
        original_risk_level: current.risk_level,
        new_risk_level: newMissM < 1000 ? 'CRITICAL' : newMissM < 5000 ? 'WARNING' : 'SAFE',
        original_collision_probability: current.collision_probability,
        new_collision_probability: Math.max(1e-12, current.collision_probability * Math.exp(-Math.abs(val) * 2.8)),
        semi_major_axis_delta_m: deltaA,
        along_track_displacement_m: alongTrackM,
        radial_displacement_m: radialDisp,
        perturbed_path: perturbedPath,
        maneuvered_position_scene: maneuveredPosScene,
      };

      set({
        deltaV: val,
        maneuverResult: instantResult,
        kesslerDemo: Math.abs(val) >= 0.5 ? false : get().kesslerDemo,
      });
    } else {
      set({ deltaV: val });
    }

    // Debounce background backend sync (120ms)
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      get().runManeuverSimulation(val, lead);
    }, 120);
  },

  setLeadTimeHours: (val: number) => {
    set({ leadTimeHours: val });
    get().setDeltaV(get().deltaV);
  },

  runManeuverSimulation: async (deltaVOverride?: number, leadHoursOverride?: number) => {
    const current = get().selectedConjunction;
    if (!current) return;

    const dv = deltaVOverride !== undefined ? deltaVOverride : get().deltaV;
    const lead = leadHoursOverride !== undefined ? leadHoursOverride : get().leadTimeHours;

    set({ isSimulatingManeuver: true });

    try {
      const res = await fetch(`${API_BASE}/api/v1/simulate-maneuver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conjunction_id: current.conjunction_id,
          delta_v_ms: dv,
          lead_time_hours: lead,
        }),
      });

      if (res.ok) {
        const result: ManeuverResult = await res.json();
        set({ maneuverResult: result, isSimulatingManeuver: false });
      } else {
        // Client-side instantaneous Clohessy-Wiltshire fallback if API unreachable
        const r1 = current.primary_position_scene;
        const r2 = current.secondary_position_scene;
        const origMiss = current.miss_distance_m;
        // Displacement: -3 * dv * t
        const alongTrackSeparationM = Math.abs(-3.0 * dv * (lead * 3600.0));
        const newMissM = Math.sqrt(origMiss * origMiss + alongTrackSeparationM * alongTrackSeparationM);
        const fuel = 260.0 * (1.0 - Math.exp(-Math.abs(dv) / (220.0 * 9.80665)));

        const fallbackResult: ManeuverResult = {
          conjunction_id: current.conjunction_id,
          delta_v_ms: dv,
          lead_time_hours: lead,
          original_miss_distance_m: origMiss,
          new_miss_distance_m: newMissM,
          miss_distance_delta_m: newMissM - origMiss,
          fuel_consumed_kg: fuel,
          relative_velocity_kms: current.relative_velocity_kms,
          original_risk_level: current.risk_level,
          new_risk_level: newMissM < 1000 ? 'CRITICAL' : newMissM < 5000 ? 'WARNING' : 'SAFE',
          original_collision_probability: current.collision_probability,
          new_collision_probability: current.collision_probability * Math.exp(-Math.abs(dv) * 2),
          semi_major_axis_delta_m: (2 * 6800000 * 7.5 / 398600.4418) * dv,
          along_track_displacement_m: alongTrackSeparationM,
          radial_displacement_m: (2 * dv / 0.0011) * 0.1,
          perturbed_path: current.primary_path,
          maneuvered_position_scene: [r1[0] + 0.01 * (dv / 5), r1[1], r1[2]],
        };
        set({ maneuverResult: fallbackResult, isSimulatingManeuver: false });
      }
    } catch (e) {
      set({ isSimulatingManeuver: false });
    }
  },

  setSimSpeed: (speed: number) => set({ simSpeed: speed }),
  toggleSimPause: () => set((state) => ({ isSimPaused: !state.isSimPaused })),
  advanceSimTime: (deltaSeconds: number) =>
    set((state) => ({
      simTime: state.isSimPaused ? state.simTime : state.simTime + deltaSeconds * 1000 * state.simSpeed,
    })),

  setCameraFocus: (focus: 'GLOBAL' | 'CONJUNCTION' | 'SAT_CHASE') => set({ cameraFocus: focus }),
  setLiveSatPosition: (pos: [number, number, number]) => set({ liveSatPosition: pos }),
  toggleCinemaMode: () => set((state) => ({ cinemaMode: !state.cinemaMode })),
  toggleKesslerDemo: () => set((state) => ({ kesslerDemo: !state.kesslerDemo })),
  setApiModalOpen: (open: boolean) => set({ isApiModalOpen: open }),
}));
