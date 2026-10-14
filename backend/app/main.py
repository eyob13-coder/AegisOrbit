import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import api_router, refresh_catalog_and_screen

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("aegis.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AegisOrbit Astrodynamics Engine...")
    logger.info("Pre-warming NORAD TLE catalog and running spatial cKDTree screener...")
    try:
        await refresh_catalog_and_screen()
        logger.info("Startup screening complete. AegisOrbit ready for 60 FPS client telemetry.")
    except Exception as e:
        logger.error(f"Startup warning (screening deferred to first request): {e}")
    yield
    logger.info("Shutting down AegisOrbit backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade real-time 3D Low Earth Orbit Satellite Conjunction Screening & Avoidance API",
    lifespan=lifespan
)

# Enable CORS for local Next.js frontend (port 3000) and remote deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "system": "AegisOrbit",
        "tagline": "Astrodynamics Screening & Collision Avoidance Engine",
        "status": "OPERATIONAL",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
