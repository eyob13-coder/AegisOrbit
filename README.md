# AegisOrbit 🛰️⚡

[![Status](https://img.shields.io/badge/status-active-06b6d4.svg)](#)
[![Stack](https://img.shields.io/badge/astrodynamics-SGP4%20%7C%20SciPy%20cKDTree-38bdf8.svg)](#)
[![Frontend](https://img.shields.io/badge/frontend-Next.js%2014%20%7C%20R3F%20%7C%20Three.js-22d3ee.svg)](#)
[![Backend](https://img.shields.io/badge/backend-FastAPI%20%7C%20Python%203.11+-0ea5e9.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#)

> **Real-Time 3D Low Earth Orbit (LEO) Satellite Conjunction Detection & Collision Avoidance Simulator paired with a High-Throughput Astrodynamics Screening Engine.**

AegisOrbit simulates over **10,000+ real-time orbiting satellites and orbital debris objects** in the browser at a locked 60 FPS using GPU instanced meshes and background Web Workers, combined with an analytical astrodynamics backend performing $O(N \log N)$ spatial collision screening and real-time evasive thruster maneuver simulation.

---

## 🌟 Key Capabilities

### 1. High-Throughput Screening Engine (Backend)
- **Vectorized SGP4 Tensor Propagation:** Rapidly propagates thousands of space objects across 4D spatial-temporal windows using `sgp4.api.SatrecArray`.
- **$O(N \log N)$ Spatial Collision Screening:** Employs `scipy.spatial.cKDTree` to screen bounding sphere pairs within 10 km thresholds in milliseconds.
- **Sub-Millisecond TCA Minimization:** Employs Golden-Section 1D minimization to pinpoint the exact millisecond Time of Closest Approach (TCA).
- **Foster (1992) Collision Probability:** Computes 2D B-plane encounter plane collision probabilities ($P_c$) using 3D covariance error ellipsoids.
- **Impulsive Thruster Burn Solver:**
  - **Vis-Viva Orbit Perturbation:** Solves semi-major axis perturbation $\Delta a \approx \frac{2 a^2 v}{\mu} \Delta v_T$.
  - **Clohessy-Wiltshire (CW) Equations:** Evaluates along-track separation drift $\delta y(t) \approx -3 \Delta v_T \Delta t$.
  - **Tsiolkovsky Rocket Equation:** Computes exact hydrazine/krypton propellant mass consumption $\Delta m = m_{wet} (1 - e^{-\Delta v / (I_{sp} g_0)})$.
- **Rate-Limit Resilient TLE Ingestion:** Multi-tiered caching (2-hr TTL Redis cache + local JSON fallback) protecting against CelesTrak / Space-Track rate limits.

### 2. Viral Visual Engine (Frontend)
- **Locked 60 FPS WebGL Rendering:** Single-draw-call `THREE.InstancedMesh` rendering 10,000+ satellites simultaneously.
- **Zero Main-Thread Blocking:** Dedicated Web Worker (`orbital.worker.ts`) handles propagation physics and transfers zero-copy `Float32Array` buffers to the GPU.
- **Interactive Maneuver Simulator HUD:** Live along-track $\Delta v_T$ slider ($-5\text{ m/s}$ to $+5\text{ m/s}$) with real-time recalculation of miss distance, collision probability, fuel cost, and ribbon separation.
- **Cinematic 3D Trajectory Ribbons:** Glowing cyan evasive trajectory, crimson debris path, dynamic distance separation vector, and pulsating TCA proximity spheres.
- **Segmented Camera Controller:** Seamlessly toggle between full Global Earth orbit overview and close-up TCA encounter inspection.
- **Cinema Mode (`[C]`):** One-key HUD dismiss for clean high-resolution screen recordings.
- **Kessler Cascade Demo:** Interactive cascade trigger modeling debris runaway dispersion.

---

## 📐 Astrodynamics & Mathematical Models

$$\Delta a \approx \frac{2 a^2 v}{\mu} \Delta v_T$$

$$\delta y(t) \approx -3 \Delta v_T \Delta t$$

$$\Delta m = m_{\text{wet}} \left(1 - \exp\left(-\frac{\Delta v}{I_{sp} \cdot g_0}\right)\right)$$

$$P_c = \frac{1}{2\pi \sigma_x \sigma_y \sqrt{1 - \rho_{xy}^2}} \iint_{x^2 + y^2 \le R_c^2} \exp\left( -\frac{1}{2(1 - \rho_{xy}^2)} \left[ \frac{x^2}{\sigma_x^2} - \frac{2\rho_{xy} x y}{\sigma_x \sigma_y} + \frac{y^2}{\sigma_y^2} \right] \right) dx\, dy$$

---

## 🏗️ Architecture

```
                                  +------------------------------+
                                  |     CelesTrak / Space-Track  |
                                  +--------------+---------------+
                                                 | (2-hr TTL)
                                                 v
+-----------------------+         +--------------+---------------+
|     Next.js 14 HUD    | <=====> |   FastAPI Screening Engine   |
| (React Three Fiber)   |  JSON   |   - SGP4 Vectorized Tensors  |
+-----------+-----------+         |   - SciPy cKDTree 3D Pairs   |
            |                     |   - Foster 2D B-Plane Pc     |
     Shared | ArrayBuffer         |   - Vis-Viva & CW Solver     |
            v                     +------------------------------+
+-----------+-----------+
|    orbital.worker.ts  |
| 10k Sat SGP4 Physics  |
+-----------------------+
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- (Optional) Docker & Docker Compose

### 1. Run with Docker Compose
```bash
docker-compose up --build
```
Open **http://localhost:3000** to view the application.

---

### 2. Manual Local Setup

#### Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: **http://127.0.0.1:8000/docs**

#### Frontend (Next.js 14)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 📡 B2B Ephemeris Screening API

Satellite operators can screen planned mission profiles or custom TLEs against the active catalog:

```bash
curl -X POST "http://localhost:8000/api/v1/b2b/screen-ephemeris" \
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

## 🛡️ License
Distributed under the MIT License. Built for real-time aerospace situational awareness and space debris mitigation.
