# AegisOrbit 🛰️

**An interactive 3D satellite conjunction screening and orbital maneuver simulation platform.**

[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016-000000?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[**Live Demo**](https://aegis-orbit-psi.vercel.app/) · [**GitHub Repository**](https://github.com/eyob13-coder/AegisOrbit)

AegisOrbit explores how satellite conjunction screening and orbital maneuver analysis can be presented through an interactive, browser-based 3D environment. It combines orbital propagation, spatial proximity screening, scientific computing, and GPU-accelerated visualization in one full-stack application.

> **Project status:** Active development. AegisOrbit is an engineering and simulation project, not a certified operational collision-avoidance system. Numerical results, performance figures, and operational suitability must be independently validated before use in real spacecraft operations.

---

## Overview

AegisOrbit brings together a real-time orbital visualization frontend and a Python-based astrodynamics backend.

- **3D orbital visualization:** Explore Earth, satellites, orbital trajectories, and simulated debris.
- **Conjunction screening:** Identify candidate close approaches using spatial indexing.
- **Orbital propagation:** Work with Two-Line Element (TLE) data and SGP4 propagation.
- **Maneuver simulation:** Explore how an impulsive along-track velocity change affects a simulated encounter.
- **Scientific computing:** Experiment with time-of-closest-approach refinement and encounter analysis.
- **API access:** Submit custom orbital element sets for screening through the backend API.

## Features

### Interactive 3D environment

- WebGL rendering powered by Three.js and React Three Fiber.
- Instanced rendering for efficient visualization of large object collections.
- Dedicated Web Worker for supported background calculations.
- Procedural spacecraft and debris models.
- Orbital trajectory ribbons and encounter visualization.
- Global overview, encounter-focused, and satellite-follow camera modes.
- Cinema mode for clean screen recordings.
- Simulated debris-cascade visualization.

### Astrodynamics backend

- SGP4 propagation using the Python `sgp4` package.
- Vectorized propagation where supported by the implementation.
- Spatial proximity screening using `scipy.spatial.cKDTree`.
- Time-of-closest-approach refinement.
- Experimental encounter probability calculations.
- Impulsive maneuver simulation and estimated orbital changes.
- Optional Redis integration for caching, with an in-memory fallback where configured.

### Maneuver analysis

The maneuver interface lets users explore along-track velocity changes and observe their effect on the simulated trajectory and predicted encounter geometry.

Results depend on the scenario, propagation model, assumptions, and implementation. They should not be interpreted as operational maneuver recommendations without independent validation.

---

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| 3D graphics | Three.js, React Three Fiber |
| Rendering performance | WebGL, `THREE.InstancedMesh`, Web Workers |
| Backend API | Python, FastAPI, Uvicorn |
| Orbital mechanics | SGP4 |
| Scientific computing | NumPy, SciPy, `cKDTree` |
| Caching | Optional Redis, in-memory fallback |
| Deployment | Vercel, Render, Docker Compose |

## Architecture

```text
             Orbital element data sources
              CelesTrak / Space-Track
                        |
                        v
             FastAPI astrodynamics API
             +----------------------+
             | TLE processing       |
             | SGP4 propagation     |
             | Proximity screening  |
             | Encounter refinement|
             | Maneuver simulation  |
             +----------+-----------+
                        |
                     HTTP/JSON
                        |
                        v
             Next.js / React frontend
             +----------------------+
             | Three.js / R3F       |
             | Orbital visualization|
             | Encounter interface  |
             | Maneuver controls    |
             +----------------------+
                        |
                        v
             WebGL rendering pipeline
             + Web Worker processing
```

The frontend and backend communicate through HTTP APIs. Exact processing responsibilities and data-transfer paths depend on the implementation of each feature.

---

## Live demo

**Explore AegisOrbit:** https://aegis-orbit-psi.vercel.app/

The live frontend requires a reachable backend for features that depend on server-side orbital data and calculations.

If the backend is sleeping, unavailable, or still loading its catalog, some features may take longer to become available.

---

## Getting started

### Prerequisites

Install the following before running the project:

- Git
- Node.js compatible with your frontend dependencies
- Python 3.11 or a compatible version supported by the backend dependencies
- Docker and Docker Compose, if using the containerized setup

### 1. Clone the repository

```bash
git clone https://github.com/eyob13-coder/AegisOrbit.git
cd AegisOrbit
```

### 2. Start the backend

```bash
cd backend

python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

**Linux or macOS:**

```bash
source .venv/bin/activate
```

Install the dependencies and start the API:

```bash
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend should be available at:

- API: http://127.0.0.1:8000
- Interactive API documentation: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

These endpoints assume the routes are enabled in the current backend configuration.

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

Configure the frontend to use your local backend URL if required by the current implementation.

---

## Deployment

AegisOrbit supports separate frontend and backend deployments, as well as a Docker Compose workflow.

### Frontend: Vercel

1. Import the repository into [Vercel](https://vercel.com/).
2. Set the root directory to `frontend`.
3. Select the Next.js framework preset.
4. Configure the environment variables.
5. Deploy and verify the application.

Set the following variable if the frontend reads its backend URL from this environment variable:

| Variable | Example |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-service.onrender.com` |

Use your actual backend URL, without a trailing slash if that matches the application's URL handling.

### Backend: Render

1. Create a web service in [Render](https://render.com/).
2. Connect the GitHub repository.
3. Set the root directory to `backend`.
4. Configure the Python runtime and install dependencies.
5. Set the start command and health check.
6. Configure environment variables and deploy.

Example configuration:

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Runtime | Python |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check | `/health` |

The service must bind to the port provided by the deployment platform.

### Docker Compose

From the repository root:

```bash
docker compose up --build
```

Expected local endpoints, depending on the Compose configuration:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API documentation | http://localhost:8000/docs |
| Health check | http://localhost:8000/health |

If your Docker Compose file uses different ports or service names, follow the configuration in `docker-compose.yml`.

---

## Configuration

### Backend environment variables

| Variable | Example/default | Purpose |
|---|---|---|
| `PORT` | `8000` locally | HTTP server port |
| `ENVIRONMENT` | `development` | Environment-specific behavior |
| `REDIS_URL` | Empty if optional | Redis connection string |
| `TLE_CACHE_TTL` | `7200` | TLE cache lifetime in seconds |
| `CONJUNCTION_CACHE_TTL` | `900` | Conjunction result cache lifetime in seconds |
| `CONJUNCTION_THRESHOLD_KM` | `10.0` | Candidate screening distance in kilometers |
| `SCREENING_HORIZON_HOURS` | `24.0` | Screening time horizon in hours |

These values document the intended configuration. Verify that each variable is actually read by the current backend before relying on it.

### Frontend environment variables

| Variable | Example | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never place private credentials or API secrets in them.

---

## Orbital mechanics and numerical methods

AegisOrbit brings together several established concepts from orbital mechanics and numerical computing.

### SGP4 propagation

SGP4 propagates satellite states from TLE-based orbital elements using the Simplified General Perturbations model.

TLE data has a finite validity window and associated uncertainty. Propagated positions should not be treated as exact measurements of current spacecraft locations.

### Spatial proximity screening

A spatial tree can accelerate the identification of nearby candidate objects compared with naive pairwise comparisons.

For \(N\) objects, building a spatial index is commonly associated with approximately \(O(N\log N)\) construction cost, while query performance depends on the dataset, tree configuration, and number of candidate pairs returned.

This complexity does not, by itself, guarantee a specific end-to-end screening time.

### Time of closest approach

Numerical optimization can refine the estimated time of closest approach over a defined search interval. Reliability depends on the propagation model, sampling strategy, search bounds, and convergence criteria.

### Orbital maneuver simulation

For small tangential velocity changes in an appropriate near-circular orbit, simplified orbital mechanics can help estimate changes in orbital energy and along-track separation.

A real maneuver analysis also needs to account for encounter geometry, orbital state uncertainty, maneuver execution errors, and constraints imposed by the spacecraft and mission.

### Collision probability

Collision probability estimation requires suitable relative-state uncertainty information and a clearly defined encounter model.

A probability result should only be treated as meaningful when the covariance assumptions, encounter-plane transformation, hard-body radius, and numerical method have been validated.

---

## Ephemeris screening API

The backend exposes an ephemeris-screening endpoint for submitting a custom satellite TLE, subject to the current API implementation.

Example request:

```bash
curl -X POST \
  "http://localhost:8000/api/v1/b2b/screen-ephemeris" \
  -H "Content-Type: application/json" \
  -d '{
    "satellite_name": "MISSION-ALPHA",
    "line1": "1 44713U 19074A   24080.50000000  .00001245  00000+0  98421-4 0  9993",
    "line2": "2 44713  53.0541 210.1256 0001428  85.2341 274.8912 15.06412584234512",
    "screening_horizon_hours": 24.0,
    "conjunction_threshold_km": 10.0
  }'
```

Replace the example TLE with a valid, suitably current element set for your test case. The sample above is illustrative and should not be assumed to represent a current orbit.

For a deployed service, replace `localhost:8000` with the actual backend URL.

See the interactive API documentation at `/docs` for the implemented request schema, response fields, and error behavior.

---

## Performance and validation

AegisOrbit is designed to explore efficient rendering and orbital screening at scale. Actual performance depends on hardware, browser, dataset size, data freshness, backend configuration, and workload.

Before treating the system as production-ready, validate and document:

- Rendering frame rate and object count on specified hardware.
- Backend screening latency across representative catalog sizes.
- Propagation accuracy against trusted reference implementations.
- Time-of-closest-approach calculations against known test cases.
- Collision probability calculations against validated reference scenarios.
- Maneuver simulation results against independent analytical or numerical models.
- Error handling, API limits, caching behavior, and recovery from upstream data failures.

Performance claims should be accompanied by reproducible benchmarks and the conditions under which they were measured.

---

## Roadmap

- [ ] Reproducible performance benchmarks.
- [ ] Automated backend tests for orbital propagation and encounter screening.
- [ ] Independent validation of maneuver and collision probability calculations.
- [ ] Improved telemetry, logging, and error reporting.
- [ ] Better handling of stale orbital element data.
- [ ] Documented API limits and deployment security checks.
- [ ] More comprehensive deployment and contributor documentation.

## Contributing

Contributions, bug reports, and technical feedback are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make a focused change.
4. Run the relevant checks.
5. Open a pull request describing the change and its testing.

For scientific or numerical changes, include the assumptions, test cases, and reference results used to validate the implementation.

## Disclaimer

AegisOrbit is an experimental engineering and visualization project intended for learning, research, and software development.

It is not certified for operational spacecraft control, flight safety decisions, or authoritative collision-risk assessment. Its outputs may be incomplete, inaccurate, or affected by stale input data, model assumptions, numerical limitations, or software defects.

Do not use its predictions as the sole basis for real spacecraft maneuver decisions.

## License

Released under the [MIT License](LICENSE).

---

**Built by [Eyob Geremew](https://github.com/eyob13-coder)**

Feedback, issues, and contributions are welcome.
