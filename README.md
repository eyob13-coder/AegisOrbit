# AegisOrbit 🛰️⚡

[![Status](https://img.shields.io/badge/status-production--ready-06b6d4.svg)](#)
[![Frontend](https://img.shields.io/badge/frontend-Next.js%2016%20%7C%20React%2019%20%7C%20R3F-22d3ee.svg)](#)
[![Backend](https://img.shields.io/badge/backend-FastAPI%20%7C%20Python%203.11+-0ea5e9.svg)](#)
[![Astrodynamics](https://img.shields.io/badge/astrodynamics-SGP4%20%7C%20SciPy%20cKDTree-38bdf8.svg)](#)
[![Deployment](https://img.shields.io/badge/deploy-Vercel%20%2B%20Render%20%2F%20Docker-10b981.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#)

> **Real-Time 3D Low Earth Orbit (LEO) Satellite Conjunction Screening & Autonomous Collision Avoidance Console.**

AegisOrbit renders **15,000+ real-world active satellites and space debris objects** directly in the browser at a locked 60 FPS using GPU instanced meshes and Web Workers. Behind the 3D telemetry workstation sits an analytical astrodynamics backend performing $O(N \log N)$ spatial collision screening, golden-section sub-millisecond TCA refinement, 2D B-plane encounter probability calculation, and impulsive thruster maneuver simulation.

---

## 🛰️ System Architecture

```
                              +---------------------------------------+
                              |      CelesTrak / Space-Track API      |
                              |  (15,000+ Real-World Satellite TLEs)  |
                              +-------------------+-------------------+
                                                  |
                                                  v
+-------------------------------+  HTTP/JSON  +---------------------------------------+
|  Frontend: Next.js 16 + R3F   | <=========> |       Backend: FastAPI Engine         |
|  - Three.js / R3F Canvas      |             |  - Vectorized SGP4 Tensor Propagation |
|  - Procedural Satellite Model |             |  - SciPy cKDTree 3D Spatial Screening |
|  - Evasive Orbit Ribbons      |             |  - Golden-Section TCA Refinement      |
|  - Palantir/SpaceX Flight Deck|             |  - Foster (1992) Collision Pc Solver  |
+---------------+---------------+             |  - CW & Vis-Viva Maneuver Optimizer   |
                |                             +---------------------------------------+
         Zero-Copy Transfer
                v
+---------------+---------------+
|       orbital.worker.ts       |
|  60 FPS SGP4 Physics Engine   |
+-------------------------------+
```

---

## 🚀 Quick Deployment Guide

You can deploy AegisOrbit in minutes using **Vercel** (Frontend) and **Render** (Backend), or run the complete multi-container stack with **Docker Compose**.

### Option 1: Deploy Backend to Render (Free / Pro)

1. Sign in to [Render](https://render.com) and click **New + > Web Service**.
2. Connect your GitHub repository: `https://github.com/eyob13-coder/AegisOrbit.git`.
3. Configure the service settings:
   - **Name:** `aegisorbit-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
4. Add the following **Environment Variables**:
   | Variable | Value | Description |
   |---|---|---|
   | `PYTHON_VERSION` | `3.11.8` | Recommended Python runtime |
   | `ENVIRONMENT` | `production` | Production mode toggle |
   | `REDIS_URL` | *(leave blank or supply Redis URI)* | In-memory 3-tier cache is enabled automatically if empty |
   | `CONJUNCTION_THRESHOLD_KM` | `10.0` | Spatial screening radius (km) |
   | `SCREENING_HORIZON_HOURS` | `24.0` | Lookahead window for conjunctions |
5. Click **Create Web Service**. Once deployed, copy your service URL (e.g., `https://aegisorbit-api.onrender.com`).

*(Note: A pre-configured [`render.yaml`](file:///C:/Users/User/.gemini/antigravity-ide/scratch/aegis-orbit/render.yaml) is included in the repository root for automatic blueprint deploys).*

---

### Option 2: Deploy Frontend to Vercel

1. Sign in to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Import the `AegisOrbit` repository.
3. In the project setup screen, configure:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click *Edit* and select **`frontend`**
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
4. Expand **Environment Variables** and add:
   | Variable | Value | Description |
   |---|---|---|
   | `NEXT_PUBLIC_API_URL` | `https://aegisorbit-api.onrender.com` | Your deployed backend URL (omit trailing slash) |
5. Click **Deploy**. Vercel will build and launch the Next.js 16 frontend with global CDN acceleration.

---

### Option 3: Full Stack with Docker Compose

Deploy the frontend, backend, and optional Redis caching layer with a single command:

```bash
# Clone the repository
git clone https://github.com/eyob13-coder/AegisOrbit.git
cd AegisOrbit

# Launch multi-container stack
docker-compose up --build
```

- **Frontend HUD:** `http://localhost:3000`
- **Backend API & Swagger Docs:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

---

## 💻 Local Development Setup

### 1. Backend (FastAPI + Astrodynamics)

```bash
cd backend

# Create and activate Python virtual environment
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start local ASGI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API docs will be accessible at `http://127.0.0.1:8000/docs`.

### 2. Frontend (Next.js 16 + React 19)

```bash
cd frontend

# Install Node dependencies
npm install

# Run local development server
npm run dev
```
Open `http://localhost:3000` in Chrome, Brave, or Edge.

---

## 🌟 Key Features

### 1. High-Throughput Screening Engine (Backend)
- **Vectorized SGP4 Tensor Propagation:** Rapidly computes 4D positions across thousands of satellites using `sgp4.api.SatrecArray`.
- **$O(N \log N)$ Spatial Collision Screening:** Employs `scipy.spatial.cKDTree` to screen bounding sphere pairs within 10 km thresholds in milliseconds.
- **Sub-Millisecond TCA Minimization:** Employs Golden-Section 1D minimization to pinpoint the exact millisecond Time of Closest Approach.
- **Foster (1992) Collision Probability:** Computes 2D B-plane encounter collision probabilities ($P_c$) using 3D covariance error ellipsoids.
- **Station-Keeping Filter:** Automatically recognizes and filters co-orbiting physically docked modules (e.g., ISS and Tiangong docked craft) to prevent false-positive alarms.
- **Impulsive Thruster Burn Solver:** Computes $\Delta a$ orbit perturbation, along-track separation $\delta y(t)$, and hydrazine/krypton fuel consumption via the Tsiolkovsky rocket equation.

### 2. Tactical Aerospace Flight Console (Frontend)
- **Locked 60 FPS WebGL Rendering:** Single-draw-call `THREE.InstancedMesh` rendering 10,000+ active satellites simultaneously.
- **Zero Main-Thread Blocking:** Dedicated Web Worker (`orbital.worker.ts`) handles physics propagation and transfers zero-copy `Float32Array` buffers to the GPU.
- **Procedural 3D Spacecraft & Debris Models:** High-detail satellite bus with rotatable dual solar panels, Earth-pointing dish, pulsing ion thruster plume, and jagged tumbling debris fragments.
- **Interactive Maneuver Simulator HUD:** Live along-track $\Delta v_T$ slider ($-5\text{ m/s}$ to $+5\text{ m/s}$) with real-time recalculation of miss distance, risk level, and ribbon divergence.
- **Hardware-Style Camera Controls:**
  - `[GLOBAL]`: Full Earth orbit overview.
  - `[TCA-LOCK]`: Focus on the impending encounter intersection with collision risk sphere.
  - `[SAT-CHASE]`: Cockpit chase camera following the primary satellite along its velocity vector.
- **Cinema Mode (`[C]`):** Dismisses all HUD overlays for clean video recording.
- **Kessler Cascade Demo:** Simulates an explosive orbital collision generating 400 high-velocity tumbling fragments.

---

## 📐 Astrodynamics & Mathematical Models

### 1. Vis-Viva Orbit Perturbation
$$\Delta a \approx \frac{2 a^2 v}{\mu} \Delta v_T$$

### 2. Clohessy-Wiltshire Along-Track Drift
$$\delta y(t) \approx -3 \Delta v_T \Delta t$$

### 3. Tsiolkovsky Rocket Fuel Equation
$$\Delta m = m_{\text{wet}} \left(1 - \exp\left(-\frac{\Delta v}{I_{sp} \cdot g_0}\right)\right)$$

### 4. Foster (1992) 2D B-Plane Collision Probability
$$P_c = \frac{1}{2\pi \sigma_x \sigma_y \sqrt{1 - \rho_{xy}^2}} \iint_{x^2 + y^2 \le R_c^2} \exp\left( -\frac{1}{2(1 - \rho_{xy}^2)} \left[ \frac{x^2}{\sigma_x^2} - \frac{2\rho_{xy} x y}{\sigma_x \sigma_y} + \frac{y^2}{\sigma_y^2} \right] \right) dx\, dy$$

---

## 📡 B2B Ephemeris Screening API

Satellite operators can screen planned mission profiles or custom TLE sets against the active catalog:

```bash
curl -X POST "https://your-backend-service.onrender.com/api/v1/b2b/screen-ephemeris" \
  -H "Content-Type: application/json" \
  -d '{
    "satellite_name": "MISSION-ALPHA",
    "line1": "1 44713U 19074A   24080.50000000  .00001245  00000+0  98421-4 0  9993",
    "line2": "2 44713  53.0541 210.1256 0001428  85.2341 274.8912 15.06412584234512",
    "screening_horizon_hours": 24.0,
    "conjunction_threshold_km": 10.0
  }'
```

---

## ⚙️ Environment Variables Reference

### Backend (`backend/`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | Port for the ASGI server |
| `ENVIRONMENT` | `development` | `production` disables debug endpoints and enables strict caching |
| `REDIS_URL` | `""` | Optional Redis connection string (in-memory cache used if empty) |
| `TLE_CACHE_TTL` | `7200` | Seconds to cache CelesTrak TLE catalog (2 hours) |
| `CONJUNCTION_CACHE_TTL` | `900` | Seconds to cache spatial screening results (15 mins) |
| `CONJUNCTION_THRESHOLD_KM` | `10.0` | Maximum separation for conjunction detection |

### Frontend (`frontend/`)
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Base URL of the deployed FastAPI backend |

---

## 🛡️ License

Distributed under the **MIT License**. Built for real-time aerospace situational awareness, orbital debris mitigation, and autonomous space flight safety.
