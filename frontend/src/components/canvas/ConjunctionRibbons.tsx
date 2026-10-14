'use client';

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import { useOrbitStore } from '@/store/useOrbitStore';
import { DebrisBurst } from './DebrisBurst';

export const ConjunctionRibbons: React.FC = () => {
  const selectedConjunction = useOrbitStore((state) => state.selectedConjunction);
  const maneuverResult = useOrbitStore((state) => state.maneuverResult);
  const deltaV = useOrbitStore((state) => state.deltaV);
  const cameraFocus = useOrbitStore((state) => state.cameraFocus);
  const kesslerDemo = useOrbitStore((state) => state.kesslerDemo);

  const sphereWarningRef = useRef<THREE.Mesh>(null);

  // Determine which primary path to render:
  // If maneuver simulation has perturbed path and deltaV != 0, render perturbed evasive ribbon!
  const primaryPoints = useMemo(() => {
    if (!selectedConjunction) return [];
    
    const sourcePath = (maneuverResult && Math.abs(deltaV) > 0.01 && maneuverResult.perturbed_path && maneuverResult.perturbed_path.length > 0)
      ? maneuverResult.perturbed_path
      : selectedConjunction.primary_path;

    if (!sourcePath || sourcePath.length === 0) return [];
    return sourcePath.map((wp) => new THREE.Vector3(wp.scene[0], wp.scene[1], wp.scene[2]));
  }, [selectedConjunction, maneuverResult, deltaV]);

  // Secondary (Debris) orbit points
  const secondaryPoints = useMemo(() => {
    if (!selectedConjunction || !selectedConjunction.secondary_path) return [];
    return selectedConjunction.secondary_path.map(
      (wp) => new THREE.Vector3(wp.scene[0], wp.scene[1], wp.scene[2])
    );
  }, [selectedConjunction]);

  // Current primary and secondary positions at TCA
  const primaryTcaPos = useMemo(() => {
    if (!selectedConjunction) return new THREE.Vector3(0, 0, 0);
    if (maneuverResult && Math.abs(deltaV) > 0.01 && maneuverResult.maneuvered_position_scene) {
      const p = maneuverResult.maneuvered_position_scene;
      return new THREE.Vector3(p[0], p[1], p[2]);
    }
    const p = selectedConjunction.primary_position_scene;
    return new THREE.Vector3(p[0], p[1], p[2]);
  }, [selectedConjunction, maneuverResult, deltaV]);

  const secondaryTcaPos = useMemo(() => {
    if (!selectedConjunction) return new THREE.Vector3(0, 0, 0);
    const p = selectedConjunction.secondary_position_scene;
    return new THREE.Vector3(p[0], p[1], p[2]);
  }, [selectedConjunction]);

  // Midpoint for camera lookAt and collision point
  const conjunctionMidpoint = useMemo(() => {
    return new THREE.Vector3()
      .addVectors(primaryTcaPos, secondaryTcaPos)
      .multiplyScalar(0.5);
  }, [primaryTcaPos, secondaryTcaPos]);

  // Current effective miss distance in meters
  const currentMissDistanceM = maneuverResult ? maneuverResult.new_miss_distance_m : (selectedConjunction ? selectedConjunction.miss_distance_m : 0);
  const isSafeSeparation = Math.abs(deltaV) >= 0.5 || currentMissDistanceM >= 5000;

  // Dynamic color for warning sphere: Red (< 1km) -> Amber (1-5km) -> Green (> 5km / deltaV >= 0.5)
  const warningColor = useMemo(() => {
    if (isSafeSeparation) {
      return '#10b981'; // Safe Emerald
    } else if (currentMissDistanceM < 1000) {
      return '#ef4444'; // Critical Crimson
    } else if (currentMissDistanceM < 5000) {
      return '#f59e0b'; // Warning Amber
    }
    return '#10b981';
  }, [currentMissDistanceM, isSafeSeparation]);

  // Pulse warning sphere
  useFrame((state) => {
    if (!selectedConjunction) return;

    if (sphereWarningRef.current) {
      const time = state.clock.getElapsedTime();
      const pulse = 1.0 + Math.sin(time * 6.0) * 0.25;
      sphereWarningRef.current.scale.setScalar(pulse);
    }
  });

  if (!selectedConjunction) return null;

  return (
    <group>
      {/* 1. Primary Orbit Ribbon: Glowing Cyan (#06b6d4) */}
      {primaryPoints.length > 1 && (
        <Line
          points={primaryPoints}
          color="#06b6d4"
          lineWidth={2.4}
          transparent
          opacity={0.9}
        />
      )}

      {/* 2. Secondary Debris Orbit Ribbon: Pulsing Crimson (#ef4444) */}
      {secondaryPoints.length > 1 && (
        <Line
          points={secondaryPoints}
          color="#ef4444"
          lineWidth={2.4}
          transparent
          opacity={0.85}
        />
      )}

      {/* 3. Primary Satellite Marker Sphere at TCA */}
      <mesh position={primaryTcaPos}>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
        {cameraFocus === 'CONJUNCTION' && (
          <Html position={[0, 0.025, 0]} center>
            <div className="px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap bg-slate-950/90 border border-cyan-500/60 text-cyan-300 pointer-events-none select-none shadow-lg tracking-wider">
              {selectedConjunction.primary_name}
            </div>
          </Html>
        )}
      </mesh>

      {/* 4. Secondary Debris Marker Sphere at TCA */}
      <mesh position={secondaryTcaPos}>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshBasicMaterial color="#ef4444" toneMapped={false} />
        {cameraFocus === 'CONJUNCTION' && (
          <Html position={[0, -0.025, 0]} center>
            <div className="px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap bg-slate-950/90 border border-red-500/60 text-red-300 pointer-events-none select-none shadow-lg tracking-wider">
              {selectedConjunction.secondary_name}
            </div>
          </Html>
        )}
      </mesh>

      {/* 5. Dynamic Separation Vector Line between bodies */}
      <Line
        points={[primaryTcaPos, secondaryTcaPos]}
        color={warningColor}
        lineWidth={2}
        dashed
        dashScale={50}
        dashSize={0.5}
        gapSize={0.3}
      />

      {/* 6. Pulsing 3D Warning Sphere at TCA */}
      <mesh ref={sphereWarningRef} position={conjunctionMidpoint}>
        <sphereGeometry args={[0.016, 16, 16]} />
        <meshBasicMaterial
          color={warningColor}
          transparent
          opacity={0.65}
          wireframe
        />
        {cameraFocus === 'CONJUNCTION' && (
          <Html position={[0, 0.045, 0]} center>
            <div className="flex flex-col items-center gap-1 pointer-events-none select-none">
              {/* Kessler Cascade Alert Banner */}
              {kesslerDemo && (
                <div className="px-3 py-1 rounded bg-red-950/95 border border-red-500 text-red-200 text-[10px] font-mono font-bold whitespace-nowrap animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.7)] tracking-wider">
                  ⚠️ CRITICAL KESSLER CASCADE DETECTED — +400 DEBRIS FRAGMENTS GENERATED
                </div>
              )}

              {/* Safe Separation Achieved Banner */}
              {isSafeSeparation && !kesslerDemo && Math.abs(deltaV) >= 0.5 && (
                <div className="px-3 py-1 rounded bg-emerald-950/95 border border-emerald-500 text-emerald-300 text-[10px] font-mono font-bold whitespace-nowrap shadow-[0_0_15px_rgba(16,185,129,0.5)] tracking-wider">
                  🛡️ SAFE SEPARATION ACHIEVED (+{currentMissDistanceM.toLocaleString(undefined, { maximumFractionDigits: 0 })} m)
                </div>
              )}

              {/* Miss distance badge */}
              <div
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap border shadow-xl tracking-wider"
                style={{
                  backgroundColor: 'rgba(5, 8, 17, 0.94)',
                  borderColor: warningColor,
                  color: warningColor,
                }}
              >
                TCA MISS: {currentMissDistanceM.toLocaleString(undefined, { maximumFractionDigits: 0 })} m
              </div>
            </div>
          </Html>
        )}
      </mesh>

      {/* 7. Interactive Kessler Cascade Debris Burst (400 Fragments) */}
      <DebrisBurst origin={conjunctionMidpoint} active={kesslerDemo} />
    </group>
  );
};

