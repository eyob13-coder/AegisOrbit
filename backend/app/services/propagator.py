from datetime import datetime, timezone
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
from sgp4.api import Satrec, jday, SatrecArray

from app.config import settings
from app.services.celestrak import TLERecord

def datetime_to_jd_fr(dt: datetime) -> Tuple[float, float]:
    """Convert a UTC datetime to Julian Date (jd, fr) for SGP4."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    
    sec = dt.second + dt.microsecond * 1e-6
    jd, fr = jday(dt.year, dt.month, dt.day, dt.hour, dt.minute, sec)
    return jd, fr

def eci_to_threejs(eci_coords: np.ndarray) -> np.ndarray:
    """
    Map ECI (x, y, z) in km to Three.js coordinates:
      sceneX =  eci.x / EARTH_RADIUS_KM
      sceneY =  eci.z / EARTH_RADIUS_KM  (Z is polar north in ECI, Y is up in Three.js)
      sceneZ = -eci.y / EARTH_RADIUS_KM
    """
    eci = np.asarray(eci_coords)
    out = np.zeros_like(eci, dtype=np.float32)
    r = settings.EARTH_RADIUS_KM
    out[..., 0] = eci[..., 0] / r
    out[..., 1] = eci[..., 2] / r
    out[..., 2] = -eci[..., 1] / r
    return out

def threejs_to_eci(threejs_coords: np.ndarray) -> np.ndarray:
    """Inverse mapping from Three.js scene coordinates back to ECI km."""
    coords = np.asarray(threejs_coords)
    out = np.zeros_like(coords, dtype=np.float64)
    r = settings.EARTH_RADIUS_KM
    out[..., 0] = coords[..., 0] * r
    out[..., 1] = -coords[..., 2] * r
    out[..., 2] = coords[..., 1] * r
    return out


class PropagatorService:
    def __init__(self, tles: List[TLERecord]):
        self.tles = tles
        self.valid_indices: List[int] = []
        self.valid_tles: List[TLERecord] = []
        self.satrecs: List[Satrec] = []

        for idx, item in enumerate(tles):
            try:
                s = Satrec.twoline2rv(item.line1, item.line2)
                self.satrecs.append(s)
                self.valid_indices.append(idx)
                self.valid_tles.append(item)
            except Exception:
                continue

        if self.satrecs:
            self.satrec_array = SatrecArray(self.satrecs)
        else:
            self.satrec_array = None

    def propagate_times(
        self, 
        dts: List[datetime]
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Propagate all valid satellites across given datetimes in vector mode.
        Returns:
            errors: np.ndarray shape (N_sats, N_times)
            positions: np.ndarray shape (N_sats, N_times, 3) in km (ECI)
            velocities: np.ndarray shape (N_sats, N_times, 3) in km/s (ECI)
        """
        if not self.satrecs or self.satrec_array is None:
            return np.empty((0, len(dts))), np.empty((0, len(dts), 3)), np.empty((0, len(dts), 3))

        jd_list = []
        fr_list = []
        for dt in dts:
            jd, fr = datetime_to_jd_fr(dt)
            jd_list.append(jd)
            fr_list.append(fr)

        jd_arr = np.array(jd_list, dtype=np.float64)
        fr_arr = np.array(fr_list, dtype=np.float64)

        errors, positions, velocities = self.satrec_array.sgp4(jd_arr, fr_arr)
        return errors, positions, velocities

    def propagate_single(
        self,
        tle: TLERecord,
        start_time: datetime,
        duration_minutes: float = 90.0,
        step_seconds: float = 60.0
    ) -> List[Dict[str, Any]]:
        """
        Propagates a single satellite for ribbon rendering waypoints.
        Returns a list of waypoint dicts containing UTC time, ECI coords, and ThreeJS coords.
        """
        satrec = Satrec.twoline2rv(tle.line1, tle.line2)
        total_steps = int((duration_minutes * 60) / step_seconds) + 1
        start_ts = start_time.timestamp()
        
        waypoints = []
        for i in range(total_steps):
            cur_dt = datetime.fromtimestamp(start_ts + i * step_seconds, tz=timezone.utc)
            jd, fr = datetime_to_jd_fr(cur_dt)
            err, r, v = satrec.sgp4(jd, fr)
            if err == 0:
                eci_vec = np.array(r, dtype=np.float64)
                three_vec = eci_to_threejs(eci_vec)
                waypoints.append({
                    "time": cur_dt.isoformat(),
                    "eci": [round(float(x), 3) for x in r],
                    "velocity": [round(float(x), 4) for x in v],
                    "scene": [round(float(x), 5) for x in three_vec]
                })
        return waypoints
