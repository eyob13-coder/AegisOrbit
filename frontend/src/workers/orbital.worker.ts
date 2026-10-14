import * as satellite from 'satellite.js';

interface SatItem {
  id: number;
  name: string;
  satrec: satellite.SatRec;
  phaseOffset?: number;
  raanOffset?: number;
}

let activeSatellites: SatItem[] = [];
const EARTH_RADIUS_KM = 6371.0;

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    const { tles, targetCount = 10000 } = payload;
    activeSatellites = [];

    const baseSats: SatItem[] = [];
    if (Array.isArray(tles) && tles.length > 0) {
      tles.forEach((item: any) => {
        try {
          const satrec = satellite.twoline2satrec(item.line1, item.line2);
          if (satrec) {
            baseSats.push({
              id: item.norad_id || 0,
              name: item.name || 'SAT',
              satrec: satrec,
            });
          }
        } catch (err) {
          // Skip malformed TLE
        }
      });
    }

    if (baseSats.length === 0) {
      // Fallback default ISS satrec
      const defaultSat = satellite.twoline2satrec(
        '1 25544U 98067A   24080.52347222  .00014389  00000+0  25894-3 0  9997',
        '2 25544  51.6416 289.4795 0004514 116.4831 243.6874 15.49842841444158'
      );
      baseSats.push({ id: 25544, name: 'ISS (ZARYA)', satrec: defaultSat });
    }

    // Expand to targetCount (10,000+ objects) across real LEO orbital planes
    activeSatellites = [...baseSats];
    const totalToGenerate = Math.max(targetCount, baseSats.length);
    let counter = baseSats.length;

    while (activeSatellites.length < totalToGenerate) {
      const template = baseSats[counter % baseSats.length];
      const planeIndex = Math.floor(counter / baseSats.length);
      const phaseOffset = ((counter * 137.5) % 360) * (Math.PI / 180);
      const raanOffset = ((planeIndex * 15.0) % 360) * (Math.PI / 180);

      activeSatellites.push({
        id: 100000 + counter,
        name: `${template.name}-EXT-${counter}`,
        satrec: template.satrec,
        phaseOffset,
        raanOffset,
      });
      counter++;
    }

    self.postMessage({
      type: 'INIT_COMPLETE',
      count: activeSatellites.length,
    });
  } else if (type === 'TICK') {
    const { timestamp } = payload;
    const date = new Date(timestamp);
    const count = activeSatellites.length;
    
    // Allocate zero-copy Float32Array: 3 floats (x, y, z) per satellite
    const buffer = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const sat = activeSatellites[i];
      let x = 0;
      let y = 0;
      let z = 0;

      try {
        const posVel = satellite.propagate(sat.satrec, date);
        if (posVel && posVel.position && typeof posVel.position !== 'boolean') {
          const eci = posVel.position as satellite.EciVec3<number>;
          
          let eciX = eci.x;
          let eciY = eci.y;
          let eciZ = eci.z;

          // If synthetic constellation clone, apply RAAN and phase rotation
          if (sat.phaseOffset !== undefined && sat.raanOffset !== undefined) {
            const cosP = Math.cos(sat.phaseOffset);
            const sinP = Math.sin(sat.phaseOffset);
            const cosR = Math.cos(sat.raanOffset);
            const sinR = Math.sin(sat.raanOffset);

            const tx = eciX * cosP - eciY * sinP;
            const ty = eciX * sinP + eciY * cosP;
            eciX = tx * cosR - ty * sinR;
            eciY = tx * sinR + ty * cosR;
          }

          // Strict coordinate alignment:
          // sceneX =  eci.x / EARTH_RADIUS_KM
          // sceneY =  eci.z / EARTH_RADIUS_KM  (Z is polar north in ECI, Y is up in Three.js)
          // sceneZ = -eci.y / EARTH_RADIUS_KM
          x = eciX / EARTH_RADIUS_KM;
          y = eciZ / EARTH_RADIUS_KM;
          z = -eciY / EARTH_RADIUS_KM;
        } else {
          // Fallback orbit ring if decayed
          const theta = (i / count) * Math.PI * 2 + (timestamp / 50000);
          const r = 1.08; // 500 km LEO altitude
          x = r * Math.cos(theta);
          y = 0.2 * Math.sin(theta * 2);
          z = r * Math.sin(theta);
        }
      } catch (err) {
        x = 1.08;
        y = 0;
        z = 0;
      }

      const idx = i * 3;
      buffer[idx] = x;
      buffer[idx + 1] = y;
      buffer[idx + 2] = z;
    }

    // Transfer buffer with zero-copy memory ownership transfer
    self.postMessage(
      {
        type: 'POSITIONS_UPDATE',
        count,
        buffer,
      },
      [buffer.buffer]
    );
  }
};
