import logging
import time
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel, Field

from app.config import settings
from app.services.celestrak import celestrak_service, TLERecord
from app.services.propagator import PropagatorService, eci_to_threejs
from app.services.screener import ScreenerService, ConjunctionEvent
from app.services.maneuver import maneuver_service, ManeuverRequest, ManeuverResult

logger = logging.getLogger("aegis.routes")
api_router = APIRouter()

# Global in-memory screening cache for instantaneous sub-10ms response to UI
_state: Dict[str, Any] = {
    "tles": [],
    "propagator": None,
    "conjunctions": [],
    "last_screened_timestamp": 0.0,
    "is_screening": False
}

class CatalogResponse(BaseModel):
    total_count: int
    retrieved_at_utc: float
    cache_ttl_seconds: int
    catalog: List[TLERecord]

class B2BEphemerisScreenRequest(BaseModel):
    satellite_name: str = Field(..., example="SAT-ALPHA-01")
    line1: str = Field(..., example="1 44713U 19074A   24080.50000000  .00001245  00000+0  98421-4 0  9993")
    line2: str = Field(..., example="2 44713  53.0541 210.1256 0001428  85.2341 274.8912 15.06412584234512")
    screening_horizon_hours: float = Field(12.0, ge=1.0, le=48.0)
    conjunction_threshold_km: float = Field(10.0, ge=1.0, le=50.0)

class B2BEphemerisScreenResponse(BaseModel):
    status: str
    target_satellite: str
    screened_against_objects: int
    screening_horizon_hours: float
    conjunctions_found: int
    top_conjunctions: List[ConjunctionEvent]


async def refresh_catalog_and_screen(force_refresh: bool = False):
    """Refreshes active TLEs and runs all-vs-all spatial screening."""
    if _state["is_screening"]:
        return
    _state["is_screening"] = True
    try:
        tles = await celestrak_service.get_active_tles(force_refresh=force_refresh)
        _state["tles"] = tles
        propagator = PropagatorService(tles)
        _state["propagator"] = propagator
        screener = ScreenerService(propagator)
        conjunctions = screener.screen_catalog(horizon_hours=12.0, step_minutes=10.0, max_results=15)
        _state["conjunctions"] = conjunctions
        _state["last_screened_timestamp"] = time.time()
        logger.info(f"Screening complete: {len(conjunctions)} high-risk conjunctions detected across {len(tles)} objects")
    except Exception as e:
        logger.error(f"Error during catalog screening: {e}")
    finally:
        _state["is_screening"] = False


@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "engine": "AegisOrbit Astrodynamics Engine",
        "version": settings.VERSION,
        "catalog_size": len(_state["tles"]),
        "active_conjunctions": len(_state["conjunctions"]),
        "last_screened_seconds_ago": round(time.time() - _state["last_screened_timestamp"], 1) if _state["last_screened_timestamp"] > 0 else None
    }


@api_router.get("/catalog", response_model=CatalogResponse)
async def get_catalog(
    limit: Optional[int] = Query(None, description="Optional limit for initial payload, e.g. 1000 or full catalog")
):
    """
    Returns active NORAD TLE catalog for frontend Web Worker initialization.
    Zero-copy transferable buffers in frontend will propagate positions off-thread.
    """
    if not _state["tles"]:
        await refresh_catalog_and_screen()
    
    tles = _state["tles"]
    if limit and limit > 0:
        return CatalogResponse(
            total_count=len(tles),
            retrieved_at_utc=_state["last_screened_timestamp"],
            cache_ttl_seconds=settings.TLE_CACHE_TTL,
            catalog=tles[:limit]
        )

    return CatalogResponse(
        total_count=len(tles),
        retrieved_at_utc=_state["last_screened_timestamp"],
        cache_ttl_seconds=settings.TLE_CACHE_TTL,
        catalog=tles
    )


@api_router.get("/conjunctions", response_model=List[ConjunctionEvent])
async def get_conjunctions():
    """
    Returns top close approaches (< 10 km) over the screening horizon,
    including 3D orbital tube waypoints for primary and secondary tracks around TCA.
    """
    if not _state["conjunctions"]:
        await refresh_catalog_and_screen()
    return _state["conjunctions"]


@api_router.post("/simulate-maneuver", response_model=ManeuverResult)
async def simulate_maneuver(request: ManeuverRequest):
    r"""
    Simulates along-track impulsive thruster burn ($\Delta v_T$) executed prior to TCA.
    Computes Clohessy-Wiltshire trajectory separation, new miss distance,
    Tsiolkovsky fuel mass consumed, and updated 3D orbital ribbon coordinates.
    """
    # Find matching conjunction event
    event = next((c for c in _state["conjunctions"] if c.conjunction_id == request.conjunction_id), None)
    
    # If not found directly by ID, default to first event
    if not event and _state["conjunctions"]:
        event = _state["conjunctions"][0]
    elif not event:
        # Fallback to fresh screening
        await refresh_catalog_and_screen()
        if _state["conjunctions"]:
            event = _state["conjunctions"][0]
        else:
            raise HTTPException(status_code=404, detail="No active conjunction event available to maneuver")

    result = maneuver_service.solve_evasion_maneuver(
        primary_pos_eci=event.primary_position_eci,
        secondary_pos_eci=event.secondary_position_eci,
        original_miss_distance_m=event.miss_distance_m,
        relative_velocity_kms=event.relative_velocity_kms,
        delta_v_ms=request.delta_v_ms,
        lead_time_hours=request.lead_time_hours,
        primary_path=event.primary_path,
        conjunction_id=request.conjunction_id,
        wet_mass_kg=request.wet_mass_kg,
        isp_seconds=request.isp_seconds
    )
    return result


@api_router.post("/b2b/screen-ephemeris", response_model=B2BEphemerisScreenResponse)
async def screen_ephemeris(payload: B2BEphemerisScreenRequest):
    """
    B2B High-Throughput Screening Webhook API.
    Commercial satellite operators submit custom TLE / ephemeris state vectors
    to screen against the real-time active orbital catalog.
    """
    if not _state["tles"]:
        await refresh_catalog_and_screen()

    try:
        custom_tle = TLERecord(
            norad_id=99999,
            name=payload.satellite_name,
            line1=payload.line1,
            line2=payload.line2
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid TLE format: {e}")

    # Combine custom satellite with catalog
    combined_tles = [custom_tle] + _state["tles"]
    temp_propagator = PropagatorService(combined_tles)
    temp_screener = ScreenerService(temp_propagator)

    all_conjunctions = temp_screener.screen_catalog(
        horizon_hours=payload.screening_horizon_hours,
        step_minutes=10.0,
        max_results=20
    )

    # Filter conjunctions involving the custom target satellite
    target_conjunctions = [
        c for c in all_conjunctions 
        if c.primary_id == 99999 or c.secondary_id == 99999
    ]

    return B2BEphemerisScreenResponse(
        status="SCREENING_SUCCESS",
        target_satellite=payload.satellite_name,
        screened_against_objects=len(_state["tles"]),
        screening_horizon_hours=payload.screening_horizon_hours,
        conjunctions_found=len(target_conjunctions),
        top_conjunctions=target_conjunctions
    )
