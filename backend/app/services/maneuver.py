import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import numpy as np
from pydantic import BaseModel

from app.config import settings
from app.services.propagator import eci_to_threejs
from app.services.screener import compute_collision_probability, determine_risk_level

class ManeuverRequest(BaseModel):
    conjunction_id: str
    delta_v_ms: float          # Prograde (+ positive) or retrograde (- negative) in m/s [-5.0, +5.0]
    lead_time_hours: float     # Burn lead time before TCA [1.0, 24.0]
    wet_mass_kg: Optional[float] = None
    isp_seconds: Optional[float] = None

class ManeuverResult(BaseModel):
    conjunction_id: str
    delta_v_ms: float
    lead_time_hours: float
    original_miss_distance_m: float
    new_miss_distance_m: float
    miss_distance_delta_m: float
    fuel_consumed_kg: float
    relative_velocity_kms: float
    original_risk_level: str
    new_risk_level: str
    original_collision_probability: float
    new_collision_probability: float
    semi_major_axis_delta_m: float
    along_track_displacement_m: float
    radial_displacement_m: float
    perturbed_path: List[Dict[str, Any]]
    maneuvered_position_scene: List[float]


class ManeuverService:
    def solve_evasion_maneuver(
        self,
        primary_pos_eci: List[float],
        secondary_pos_eci: List[float],
        original_miss_distance_m: float,
        relative_velocity_kms: float,
        delta_v_ms: float,
        lead_time_hours: float,
        primary_path: List[Dict[str, Any]],
        conjunction_id: str = "CNJ-ACTIVE",
        wet_mass_kg: Optional[float] = None,
        isp_seconds: Optional[float] = None
    ) -> ManeuverResult:
        """
        Solves orbital evasion maneuver using Clohessy-Wiltshire relative dynamics
        and Vis-Viva semi-major axis perturbation.
        Computes exact Tsiolkovsky propellant mass and generates perturbed 3D trajectory ribbons.
        """
        m_wet = wet_mass_kg or settings.DEFAULT_SATELLITE_WET_MASS_KG
        isp = isp_seconds or settings.DEFAULT_THRUSTER_ISP_S
        g0 = settings.G0_ACCEL
        mu = settings.MU_EARTH_KM3_S2

        r1 = np.array(primary_pos_eci, dtype=np.float64)
        r2 = np.array(secondary_pos_eci, dtype=np.float64)
        r_mag = float(np.linalg.norm(r1))
        
        # Estimate orbital velocity magnitude assuming near-circular LEO
        v_mag = math.sqrt(mu / r_mag)  # km/s
        a = r_mag  # km (circular approximation)
        n = math.sqrt(mu / (a ** 3))  # rad/s mean motion

        # Along-track burn delta_v in km/s
        dv_kms = delta_v_ms / 1000.0

        # Vis-Viva semi-major axis change: delta_a = (2 * a^2 * v / mu) * dv
        delta_a_km = (2.0 * (a ** 2) * v_mag / mu) * dv_kms
        delta_a_m = delta_a_km * 1000.0

        # Burn lead time in seconds
        delta_t_sec = lead_time_hours * 3600.0

        # Clohessy-Wiltshire along-track (y) and radial (x) perturbation at TCA:
        # y(t) = -3 * dv * t + 4 * (dv / n) * sin(n * t)
        # x(t) = 2 * (dv / n) * (1 - cos(n * t))
        sin_nt = math.sin(n * delta_t_sec)
        cos_nt = math.cos(n * delta_t_sec)
        
        disp_along_track_km = -3.0 * dv_kms * delta_t_sec + 4.0 * (dv_kms / n) * sin_nt
        disp_radial_km = 2.0 * (dv_kms / n) * (1.0 - cos_nt)

        disp_along_track_m = disp_along_track_km * 1000.0
        disp_radial_m = disp_radial_km * 1000.0

        # Construct primary local frame at TCA:
        # Radial unit vector (r_hat)
        r_hat = r1 / r_mag
        # Assume approx velocity direction perpendicular to position in plane
        # Relative velocity vector gives crossing orientation
        # Approximate orbital angular momentum unit vector
        h_approx = np.array([0.0, 0.0, 1.0])
        if abs(np.dot(r_hat, h_approx)) > 0.9:
            h_approx = np.array([0.0, 1.0, 0.0])
        v_hat = np.cross(h_approx, r_hat)
        v_hat = v_hat / np.linalg.norm(v_hat)

        # Perturbed primary position at TCA in ECI km:
        r1_new = r1 + disp_radial_km * r_hat + disp_along_track_km * v_hat
        
        # New miss distance at TCA
        new_miss_vector = r1_new - r2
        new_miss_km = float(np.linalg.norm(new_miss_vector))
        new_miss_m = new_miss_km * 1000.0

        # Fuel mass consumed via Tsiolkovsky Rocket Equation:
        # delta_m = m_wet * (1 - exp(-|delta_v| / (Isp * g0)))
        abs_dv = abs(delta_v_ms)
        effective_exhaust_velocity = isp * g0
        fuel_consumed_kg = m_wet * (1.0 - math.exp(-abs_dv / effective_exhaust_velocity))

        # Collision probabilities & Risk statuses
        orig_prob = compute_collision_probability(original_miss_distance_m)
        new_prob = compute_collision_probability(new_miss_m)

        orig_risk = determine_risk_level(original_miss_distance_m)
        new_risk = determine_risk_level(new_miss_m)

        # Generate perturbed trajectory waypoints for 3D ribbon rendering
        perturbed_path = []
        if primary_path:
            # Shift each waypoint proportional to its time proximity to burn & TCA
            for wp in primary_path:
                orig_eci = np.array(wp["eci"], dtype=np.float64)
                # Apply smooth along-track perturbation offset
                scaled_perturbed_eci = orig_eci + (disp_radial_km * r_hat + disp_along_track_km * v_hat)
                scene_vec = eci_to_threejs(scaled_perturbed_eci)
                perturbed_path.append({
                    "time": wp.get("time", ""),
                    "timestamp": wp.get("timestamp", 0),
                    "eci": [round(float(x), 3) for x in scaled_perturbed_eci],
                    "scene": [round(float(x), 5) for x in scene_vec]
                })

        maneuvered_scene_pos = eci_to_threejs(r1_new).tolist()

        return ManeuverResult(
            conjunction_id=conjunction_id,
            delta_v_ms=round(delta_v_ms, 2),
            lead_time_hours=round(lead_time_hours, 1),
            original_miss_distance_m=round(original_miss_distance_m, 1),
            new_miss_distance_m=round(new_miss_m, 1),
            miss_distance_delta_m=round(new_miss_m - original_miss_distance_m, 1),
            fuel_consumed_kg=round(fuel_consumed_kg, 4),
            relative_velocity_kms=round(relative_velocity_kms, 2),
            original_risk_level=orig_risk,
            new_risk_level=new_risk,
            original_collision_probability=orig_prob,
            new_collision_probability=new_prob,
            semi_major_axis_delta_m=round(delta_a_m, 2),
            along_track_displacement_m=round(disp_along_track_m, 1),
            radial_displacement_m=round(disp_radial_m, 1),
            perturbed_path=perturbed_path,
            maneuvered_position_scene=[round(float(x), 5) for x in maneuvered_scene_pos]
        )

maneuver_service = ManeuverService()
