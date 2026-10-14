'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useOrbitStore } from '@/store/useOrbitStore';

const MAX_SATELLITE_COUNT = 10000;

export const SatelliteSwarm: React.FC = () => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const workerRef = useRef<Worker | null>(null);
  
  const catalog = useOrbitStore((state) => state.catalog);
  const simTime = useOrbitStore((state) => state.simTime);
  const advanceSimTime = useOrbitStore((state) => state.advanceSimTime);
  const isSimPaused = useOrbitStore((state) => state.isSimPaused);
  const simSpeed = useOrbitStore((state) => state.simSpeed);
  const kesslerDemo = useOrbitStore((state) => state.kesslerDemo);

  const isWorkerBusy = useRef(false);
  const latestBufferRef = useRef<Float32Array | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize Web Worker
  useEffect(() => {
    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL('../../workers/orbital.worker.ts', import.meta.url));
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        const { type, buffer, count } = e.data;
        if (type === 'POSITIONS_UPDATE') {
          latestBufferRef.current = buffer;
          isWorkerBusy.current = false;
        } else if (type === 'INIT_COMPLETE') {
          isWorkerBusy.current = false;
        }
      };

      // Send INIT payload with catalog
      worker.postMessage({
        type: 'INIT',
        payload: {
          tles: catalog,
          targetCount: MAX_SATELLITE_COUNT,
        },
      });
      isWorkerBusy.current = true;
    } catch (err) {
      console.error('Failed to create orbital Web Worker:', err);
    }

    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, [catalog]);

  // Per-frame physics sync & Single Draw-Call InstancedMesh update
  useFrame((_, delta) => {
    // 1. Advance simulation clock
    if (!isSimPaused) {
      advanceSimTime(delta);
    }

    // 2. Request new physics tick from Web Worker if ready
    if (workerRef.current && !isWorkerBusy.current) {
      isWorkerBusy.current = true;
      workerRef.current.postMessage({
        type: 'TICK',
        payload: {
          timestamp: simTime,
        },
      });
    }

    // 3. Update InstancedMesh matrices from the latest transferable buffer
    const buffer = latestBufferRef.current;
    const mesh = instancedMeshRef.current;
    if (mesh && buffer) {
      const count = Math.min(buffer.length / 3, MAX_SATELLITE_COUNT);
      const baseScale = kesslerDemo ? 0.012 : 0.007;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const x = buffer[idx];
        const y = buffer[idx + 1];
        const z = buffer[idx + 2];

        dummy.position.set(x, y, z);
        dummy.scale.setScalar(baseScale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[undefined, undefined, MAX_SATELLITE_COUNT]}
      frustumCulled={false}
    >
      {/* Low-poly octahedron: crisp aerospace blip geometry at locked 60 FPS */}
      <octahedronGeometry args={[1.0, 0]} />
      <meshBasicMaterial
        color={kesslerDemo ? '#ef4444' : '#38bdf8'}
        toneMapped={false}
        transparent
        opacity={0.88}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
};
