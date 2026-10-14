import os
import tempfile
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AegisOrbit Astrodynamics & Conjunction Screening Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CelesTrak Configuration
    CELESTRAK_URL: str = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
    TLE_CACHE_TTL: int = 7200  # Strict 2-hour TTL (7,200 seconds)
    CONJUNCTION_CACHE_TTL: int = 900  # 15-minute TTL (900 seconds) for conjunction screening
    
    # Redis & File Cache Fallback
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Local fallback file paths
    TLE_CACHE_PATH: str = os.getenv(
        "TLE_CACHE_PATH", 
        str(Path(tempfile.gettempdir()) / "aegisorbit_tle_cache.json")
    )
    CONJUNCTION_CACHE_PATH: str = os.getenv(
        "CONJUNCTION_CACHE_PATH",
        str(Path(tempfile.gettempdir()) / "aegisorbit_conjunctions_cache.json")
    )
    
    # Astrodynamics & Physical Constants
    EARTH_RADIUS_KM: float = 6371.0
    MU_EARTH_KM3_S2: float = 398600.4418  # km^3/s^2 (WGS-84 gravitational parameter)
    G0_ACCEL: float = 9.80665              # m/s^2 (Standard gravity)
    DEFAULT_SATELLITE_WET_MASS_KG: float = 260.0  # kg (e.g. Starlink-class LEO bus)
    DEFAULT_THRUSTER_ISP_S: float = 220.0         # seconds (Hall-effect / cold gas)
    
    # Screening parameters
    CONJUNCTION_THRESHOLD_KM: float = 10.0   # Screen for pairs within 10 km
    CRITICAL_MISS_DISTANCE_M: float = 1000.0  # < 1 km = Critical
    WARNING_MISS_DISTANCE_M: float = 5000.0   # 1-5 km = Warning
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
