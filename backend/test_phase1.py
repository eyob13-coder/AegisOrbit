import sys
import os
import asyncio
from datetime import datetime, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.celestrak import celestrak_service
from app.services.propagator import PropagatorService, datetime_to_jd_fr, eci_to_threejs
from app.services.screener import ScreenerService
from app.services.maneuver import maneuver_service
from app.main import app

async def run_verification():
    print("=================================================================")
    print(">>> 1. VERIFYING CELESTRAK CACHING LAYER & TLE RETRIEVAL")
    print("=================================================================")
    tles = await celestrak_service.get_active_tles()
    print(f"[OK] Fetched {len(tles)} TLE records.")
    assert len(tles) > 0, "No TLEs loaded"

    print("\n=================================================================")
    print(">>> 2. VERIFYING SGP4 VECTORIZED BATCH PROPAGATION")
    print("=================================================================")
    prop = PropagatorService(tles[:15])
    now = datetime.now(timezone.utc)
    errs, pos, vels = prop.propagate_times([now])
    print(f"[OK] Batch propagated {len(prop.satrecs)} satellites.")
    print(f"[OK] Position tensor shape: {pos.shape} (N_sats, N_times, 3)")
    print(f"[OK] Sample satellite 0 ECI: {pos[0, 0, :]} km")
    sample_three = eci_to_threejs(pos[0, 0, :])
    print(f"[OK] Mapped to Three.js scene coordinates: {sample_three}")
    assert pos.shape[0] > 0 and pos.shape[2] == 3

    print("\n=================================================================")
    print(">>> 3. VERIFYING cKDTREE HIGH-THROUGHPUT COLLISION SCREENING")
    print("=================================================================")
    screener = ScreenerService(prop)
    conjunctions = screener.screen_catalog(horizon_hours=2.0, step_minutes=30.0, max_results=5)
    print(f"[OK] Screener returned {len(conjunctions)} conjunction event(s).")
    top_c = conjunctions[0]
    print(f"[OK] Primary: {top_c.primary_name} (#{top_c.primary_id}) vs. Secondary: {top_c.secondary_name} (#{top_c.secondary_id})")
    print(f"[OK] TCA: {top_c.tca_utc} | Miss: {top_c.miss_distance_m}m | Rel V: {top_c.relative_velocity_kms} km/s | Risk: {top_c.risk_level} | Pc: {top_c.collision_probability:.2e}")
    assert len(top_c.primary_path) > 0, "Missing primary ribbon waypoints"
    assert len(top_c.secondary_path) > 0, "Missing secondary ribbon waypoints"

    print("\n=================================================================")
    print(">>> 4. VERIFYING VIS-VIVA & CLOHESSY-WILTSHIRE MANEUVER SOLVER")
    print("=================================================================")
    maneuver_res = maneuver_service.solve_evasion_maneuver(
        primary_pos_eci=top_c.primary_position_eci,
        secondary_pos_eci=top_c.secondary_position_eci,
        original_miss_distance_m=top_c.miss_distance_m,
        relative_velocity_kms=top_c.relative_velocity_kms,
        delta_v_ms=2.5,
        lead_time_hours=6.0,
        primary_path=top_c.primary_path,
        conjunction_id=top_c.conjunction_id
    )
    print(f"[OK] Delta-V: {maneuver_res.delta_v_ms} m/s @ {maneuver_res.lead_time_hours}h lead time")
    print(f"[OK] Original Miss: {maneuver_res.original_miss_distance_m}m [{maneuver_res.original_risk_level}] --> New Miss: {maneuver_res.new_miss_distance_m}m [{maneuver_res.new_risk_level}]")
    print(f"[OK] Propellant consumed: {maneuver_res.fuel_consumed_kg} kg (Tsiolkovsky Isp=220s, m=260kg)")
    print(f"[OK] Collision Probability: {maneuver_res.original_collision_probability:.2e} --> {maneuver_res.new_collision_probability:.2e}")
    assert maneuver_res.new_miss_distance_m > top_c.miss_distance_m
    assert len(maneuver_res.perturbed_path) > 0

    print("\n=================================================================")
    print(">>> 5. VERIFYING FASTAPI ROUTE ENDPOINTS & SCHEMA VALIDATION")
    print("=================================================================")
    from starlette.testclient import TestClient
    client = TestClient(app)
    
    # Test Root
    r_root = client.get("/")
    print(f"[OK] GET / -> status: {r_root.status_code}, data: {r_root.json()}")
    assert r_root.status_code == 200

    # Test Health
    r_health = client.get("/api/v1/health")
    print(f"[OK] GET /api/v1/health -> status: {r_health.status_code}, data: {r_health.json()}")
    assert r_health.status_code == 200

    # Test Catalog
    r_cat = client.get("/api/v1/catalog?limit=5")
    print(f"[OK] GET /api/v1/catalog?limit=5 -> status: {r_cat.status_code}, returned {len(r_cat.json()['catalog'])} items (total: {r_cat.json()['total_count']})")
    assert r_cat.status_code == 200

    # Test Conjunctions
    r_conj = client.get("/api/v1/conjunctions")
    conj_data = r_conj.json()
    print(f"[OK] GET /api/v1/conjunctions -> status: {r_conj.status_code}, returned {len(conj_data)} events")
    assert r_conj.status_code == 200 and len(conj_data) > 0

    # Test Simulate Maneuver
    maneuver_payload = {
        "conjunction_id": conj_data[0]["conjunction_id"],
        "delta_v_ms": 1.75,
        "lead_time_hours": 4.5
    }
    r_man = client.post("/api/v1/simulate-maneuver", json=maneuver_payload)
    print(f"[OK] POST /api/v1/simulate-maneuver -> status: {r_man.status_code}, new miss: {r_man.json()['new_miss_distance_m']}m")
    assert r_man.status_code == 200

    # Test B2B Ephemeris Screening
    b2b_payload = {
        "satellite_name": "COMMERCIAL-SAT-ALPHA",
        "line1": "1 44713U 19074A   24080.50000000  .00001245  00000+0  98421-4 0  9993",
        "line2": "2 44713  53.0541 210.1256 0001428  85.2341 274.8912 15.06412584234512",
        "screening_horizon_hours": 6.0,
        "conjunction_threshold_km": 15.0
    }
    r_b2b = client.post("/api/v1/b2b/screen-ephemeris", json=b2b_payload)
    print(f"[OK] POST /api/v1/b2b/screen-ephemeris -> status: {r_b2b.status_code}, status: {r_b2b.json()['status']}")
    assert r_b2b.status_code == 200

    print("\n>>> ALL PHASE 1 TESTS PASSED CLEANLY WITH ZERO DEFECTS! <<<")

if __name__ == "__main__":
    asyncio.run(run_verification())
