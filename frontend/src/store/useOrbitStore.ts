import { create } from 'zustand';

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
  cameraFocus: 'GLOBAL' | 'CONJUNCTION';

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
  setCameraFocus: (focus: 'GLOBAL' | 'CONJUNCTION') => void;
  toggleCinemaMode: () => void;
  toggleKesslerDemo: () => void;
  setApiModalOpen: (open: boolean) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const useOrbitStore = create<OrbitState>((set, get) => ({
  catalog: [],
  catalogCount: 0,
  conjunctions: [],
  selectedConjunction: null,
  isLoading: false,
  error: null,

  deltaV: 0.0,
  leadTimeHours: 6.0,
  maneuverResult: null,
  isSimulatingManeuver: false,

  simSpeed: 1,
  isSimPaused: false,
  simTime: Date.now(),
  cameraFocus: 'GLOBAL',

  cinemaMode: false,
  kesslerDemo: false,
  isApiModalOpen: false,

  fetchCatalog: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await fetch(`${API_BASE}/api/v1/catalog`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load catalog`);
      const data = await res.json();
      set({
        catalog: data.catalog || [],
        catalogCount: data.total_count || (data.catalog ? data.catalog.length : 0),
        isLoading: false,
      });
    } catch (err: any) {
      console.warn('Backend catalog API offline, using fallback catalog sample:', err);
      set({ isLoading: false });
    }
  },

  fetchConjunctions: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/conjunctions`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load conjunctions`);
      const data: ConjunctionEvent[] = await res.json();
      set({
        conjunctions: data,
        selectedConjunction: data.length > 0 ? data[0] : null,
      });
      if (data.length > 0) {
        // Automatically trigger initial 0 m/s maneuver calculation
        get().runManeuverSimulation(0.0, 6.0);
      }
    } catch (err: any) {
      console.warn('Backend conjunctions API error:', err);
    }
  },

  selectConjunction: (event: ConjunctionEvent) => {
    set({
      selectedConjunction: event,
      cameraFocus: 'CONJUNCTION',
      deltaV: 0.0,
      maneuverResult: null,
    });
    get().runManeuverSimulation(0.0, get().leadTimeHours);
  },

  setDeltaV: (val: number) => {
    set({ deltaV: val });
    get().runManeuverSimulation(val, get().leadTimeHours);
  },

  setLeadTimeHours: (val: number) => {
    set({ leadTimeHours: val });
    get().runManeuverSimulation(get().deltaV, val);
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

  setCameraFocus: (focus: 'GLOBAL' | 'CONJUNCTION') => set({ cameraFocus: focus }),
  toggleCinemaMode: () => set((state) => ({ cinemaMode: !state.cinemaMode })),
  toggleKesslerDemo: () => set((state) => ({ kesslerDemo: !state.kesslerDemo })),
  setApiModalOpen: (open: boolean) => set({ isApiModalOpen: open }),
}));
