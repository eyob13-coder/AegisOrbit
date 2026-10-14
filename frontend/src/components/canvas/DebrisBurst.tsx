'use client';

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface DebrisBurstProps {
  origin: THREE.Vector3;
  active: boolean;
}

const PARTICLE_COUNT = 400;

export const DebrisBurst: React.FC<DebrisBurstProps> = ({ origin, active }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const geoRef = useRef<THREE.BufferGeometry>(null);

  // Initialize fragment velocities and colors
  const { velocities, baseColors, offsets } = useMemo(() => {
    const vels = new Float32Array(PARTICLE_COUNT * 3);
    const cols = new Float32Array(PARTICLE_COUNT * 3);
    const offs = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      // Spherical random dispersion with forward directional bias
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const speed = 0.08 + Math.random() * 0.25;

      vels[idx] = Math.sin(phi) * Math.cos(theta) * speed;
      vels[idx + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      vels[idx + 2] = Math.cos(phi) * speed;

      // Color variation: Red, Orange, Amber, and Incandescent White
      const r = Math.random();
      if (r < 0.4) {
        cols[idx] = 0.95;     // Red
        cols[idx + 1] = 0.15;
        cols[idx + 2] = 0.15;
      } else if (r < 0.75) {
        cols[idx] = 1.0;      // Orange
        cols[idx + 1] = 0.45;
        cols[idx + 2] = 0.05;
      } else {
        cols[idx] = 1.0;      // Amber/White hot
        cols[idx + 1] = 0.85;
        cols[idx + 2] = 0.35;
      }

      offs[idx] = 0;
      offs[idx + 1] = 0;
      offs[idx + 2] = 0;
    }

    return { velocities: vels, baseColors: cols, offsets: offs };
  }, []);

  // Animate fragments outward
  useFrame((state, delta) => {
    if (!active || !pointsRef.current || !geoRef.current) return;

    const posAttr = geoRef.current.attributes.position;
    const posArray = posAttr.array as Float32Array;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      // Cycle duration ~2.5 seconds per fragment
      const cycleProgress = ((time * 0.8 + (i / PARTICLE_COUNT) * 2.0) % 2.5) / 2.5;
      const expansion = Math.pow(cycleProgress, 0.75) * 0.45; // Max 0.45 radius expansion

      posArray[idx] = origin.x + velocities[idx] * (1.0 + expansion * 6.0);
      posArray[idx + 1] = origin.y + velocities[idx + 1] * (1.0 + expansion * 6.0);
      posArray[idx + 2] = origin.z + velocities[idx + 2] * (1.0 + expansion * 6.0);
    }

    posAttr.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[offsets, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[baseColors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.016}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
