'use client';

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import { useOrbitStore } from '@/store/useOrbitStore';
import { DebrisBurst } from './DebrisBurst';
import { liveHeroSatPosition, liveHeroSatTangent, liveDebrisPosition } from './liveOrbitState';

export const ConjunctionRibbons: React.FC = () => {
  const selectedConjunction = useOrbitStore((state) => state.selectedConjunction);
  const maneuverResult = useOrbitStore((state) => state.maneuverResult);
  const deltaV = useOrbitStore((state) => state.deltaV);
  const cameraFocus = useOrbitStore((state) => state.cameraFocus);
  const kesslerDemo = useOrbitStore((state) => state.kesslerDemo);
  const simSpeed = useOrbitStore((state) => state.simSpeed);
  const isSimPaused = useOrbitStore((state) => state.isSimPaused);

  // Animation and mesh refs
  const satGroupRef = useRef<THREE.Group>(null);
  const dishGroupRef = useRef<THREE.Group>(null);
  const plumeRef = useRef<THREE.Group>(null);
  const debrisGroupRef = useRef<THREE.Group>(null);
  const debrisMeshRef = useRef<THREE.Group>(null);
  const sphereWarningRef = useRef<THREE.Mesh>(null);
  const radarRingRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0.18); // start progression along curve

  // Primary orbit points (switches to maneuvered path if deltaV simulated)
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

  // Smooth Catmull-Rom Curves along the orbital ribbons
  const primaryCurve = useMemo(() => {
    if (primaryPoints.length < 2) return null;
    return new THREE.CatmullRomCurve3(primaryPoints, false, 'catmullrom', 0.5);
  }, [primaryPoints]);

  const secondaryCurve = useMemo(() => {
    if (secondaryPoints.length < 2) return null;
    return new THREE.CatmullRomCurve3(secondaryPoints, false, 'catmullrom', 0.5);
  }, [secondaryPoints]);

  // Static TCA encounter coordinates
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

  // Midpoint for collision assessment
  const conjunctionMidpoint = useMemo(() => {
    return new THREE.Vector3()
      .addVectors(primaryTcaPos, secondaryTcaPos)
      .multiplyScalar(0.5);
  }, [primaryTcaPos, secondaryTcaPos]);

  // Current effective miss distance in meters
  const currentMissDistanceM = maneuverResult
    ? maneuverResult.new_miss_distance_m
    : (selectedConjunction ? selectedConjunction.miss_distance_m : 0);
  const isSafeSeparation = Math.abs(deltaV) >= 0.5 || currentMissDistanceM >= 5000;

  // Dynamic color for warning radar: Red (< 1km) -> Amber (1-5km) -> Green (> 5km / deltaV >= 0.5)
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

  // Continuous Orbital Flight & Dynamic Tumbling Animation in useFrame
  useFrame((state, delta) => {
    if (!selectedConjunction) return;
    const time = state.clock.getElapsedTime();

    // 1. Advance along curve smoothly
    if (!isSimPaused && primaryCurve && secondaryCurve) {
      const step = (delta / 14.0) * Math.min(Math.max(simSpeed, 0.2), 4.0);
      progressRef.current = (progressRef.current + step) % 1.0;
    }
    const t = progressRef.current;

    // 2. Animate Primary 3D Satellite
    if (primaryCurve && satGroupRef.current) {
      const pPos = primaryCurve.getPointAt(t);
      const pTangent = primaryCurve.getTangentAt(t).normalize();
      satGroupRef.current.position.copy(pPos);

      // Orient forward along trajectory
      const lookTarget = pPos.clone().add(pTangent);
      satGroupRef.current.lookAt(lookTarget);

      // Earth-pointing dish: point towards Earth center (0, 0, 0) in world coordinates
      if (dishGroupRef.current) {
        dishGroupRef.current.lookAt(new THREE.Vector3(0, 0, 0));
      }

      // Sync live satellite vectors without React re-render loops
      liveHeroSatPosition.copy(pPos);
      liveHeroSatTangent.copy(pTangent);

      // Dynamic Ion Thruster Plume pulsation
      if (plumeRef.current) {
        if (Math.abs(deltaV) > 0.001) {
          const plumeIntensity = Math.min(2.5, Math.max(0.5, Math.abs(deltaV) * 0.75));
          const flicker = 0.85 + Math.sin(time * 36.0) * 0.15;
          plumeRef.current.scale.set(1.0, 1.0, plumeIntensity * flicker);
          plumeRef.current.visible = true;
        } else {
          plumeRef.current.visible = false;
        }
      }
    }

    // 3. Animate Tumbling Debris Object
    if (secondaryCurve && debrisGroupRef.current) {
      const sPos = secondaryCurve.getPointAt(t);
      debrisGroupRef.current.position.copy(sPos);
      liveDebrisPosition.copy(sPos);

      if (debrisMeshRef.current) {
        // Continuous 3-axis rapid tumbling
        debrisMeshRef.current.rotation.x += delta * 2.5;
        debrisMeshRef.current.rotation.y += delta * 1.8;
        debrisMeshRef.current.rotation.z += delta * 3.1;
      }
    }

    // 4. Pulse Warning Radar Sphere and Rotating Target Ring at TCA
    if (sphereWarningRef.current) {
      const pulse = 1.0 + Math.sin(time * 6.0) * 0.22;
      sphereWarningRef.current.scale.setScalar(pulse);
    }
    if (radarRingRef.current) {
      radarRingRef.current.rotation.z += delta * 1.2;
      const ringPulse = 1.0 + Math.cos(time * 4.0) * 0.12;
      radarRingRef.current.scale.set(ringPulse, ringPulse, 1.0);
    }
  });

  if (!selectedConjunction) return null;

  return (
    <group>
      {/* 1. Primary Orbital Ribbon (Glowing Cyan) */}
      {primaryPoints.length > 1 && (
        <Line
          points={primaryPoints}
          color="#06b6d4"
          lineWidth={2.4}
          transparent
          opacity={0.9}
        />
      )}

      {/* 2. Secondary Debris Orbit Ribbon (Pulsing Crimson) */}
      {secondaryPoints.length > 1 && (
        <Line
          points={secondaryPoints}
          color="#ef4444"
          lineWidth={2.4}
          transparent
          opacity={0.85}
        />
      )}

      {/* =========================================================================
          3. PROCEDURAL 3D PRIMARY SATELLITE (Flies along the Cyan ribbon)
          ========================================================================= */}
      <group ref={satGroupRef}>
        {/* A. Central Bus: Gold/Amber Metallic Body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.016, 0.016, 0.026]} />
          <meshStandardMaterial
            color="#f59e0b"
            metalness={0.88}
            roughness={0.18}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* Avionics Top Deck Module (Titanium silver) */}
        <mesh position={[0, 0.009, 0]}>
          <boxGeometry args={[0.012, 0.003, 0.018]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.92}
            roughness={0.2}
          />
        </mesh>

        {/* B. Solar Array Wings (Photovoltaic Deep Blue with subtle Cyan Wireframe) */}
        {/* Port (Left) Solar Array */}
        <group position={[-0.034, 0, 0]}>
          {/* Main Photovoltaic Panel */}
          <mesh>
            <boxGeometry args={[0.042, 0.0014, 0.018]} />
            <meshStandardMaterial
              color="#1d4ed8"
              emissive="#0284c7"
              emissiveIntensity={0.35}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Photovoltaic Grid Wireframe Overlay */}
          <mesh>
            <boxGeometry args={[0.0424, 0.0015, 0.0184]} />
            <meshBasicMaterial
              color="#38bdf8"
              wireframe
              transparent
              opacity={0.35}
            />
          </mesh>
          {/* Array Mount Boom */}
          <mesh position={[0.024, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.001, 0.001, 0.008, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} />
          </mesh>
        </group>

        {/* Starboard (Right) Solar Array */}
        <group position={[0.034, 0, 0]}>
          {/* Main Photovoltaic Panel */}
          <mesh>
            <boxGeometry args={[0.042, 0.0014, 0.018]} />
            <meshStandardMaterial
              color="#1d4ed8"
              emissive="#0284c7"
              emissiveIntensity={0.35}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Photovoltaic Grid Wireframe Overlay */}
          <mesh>
            <boxGeometry args={[0.0424, 0.0015, 0.0184]} />
            <meshBasicMaterial
              color="#38bdf8"
              wireframe
              transparent
              opacity={0.35}
            />
          </mesh>
          {/* Array Mount Boom */}
          <mesh position={[-0.024, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.001, 0.001, 0.008, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} />
          </mesh>
        </group>

        {/* C. Silver High-Gain Communications Dish pointing Earthward */}
        <group ref={dishGroupRef} position={[0, -0.009, 0.005]}>
          {/* Parabolic Dish Reflector */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.002, 0.004, 16]} />
            <meshStandardMaterial
              color="#e2e8f0"
              metalness={0.92}
              roughness={0.12}
            />
          </mesh>
          {/* Feed Horn Stalk */}
          <mesh position={[0, 0, 0.004]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.0006, 0.0006, 0.005, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
        </group>

        {/* D. Dynamic Ion Thruster Plume (Active when deltaV !== 0) */}
        <group ref={plumeRef} position={[0, 0, -0.014]}>
          {/* Thruster Gimbal Ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.0035, 0.003, 0.003, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
          </mesh>
          {/* Glowing Cyan Ion Plume */}
          <mesh position={[0, 0, -0.015]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.0055, 0.024, 16]} />
            <meshBasicMaterial
              color="#06b6d4"
              transparent
              opacity={0.85}
              toneMapped={false}
            />
          </mesh>
          {/* Inner High-Energy Core */}
          <mesh position={[0, 0, -0.009]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.0025, 0.014, 12]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
          </mesh>
          {/* Plume Dynamic Glow Light */}
          <pointLight color="#06b6d4" intensity={1.8} distance={0.2} />
        </group>

        {/* E. Floating 3D HTML HUD Label */}
        {cameraFocus !== 'GLOBAL' && (
          <Html position={[0, 0.038, 0]} center>
            <div className="flex flex-col items-center pointer-events-none select-none font-mono text-[9px] tracking-wider leading-tight">
              <div className="px-2 py-0.5 rounded-none bg-[#040810]/95 border border-cyan-500/80 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]">
                <div className="font-bold flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 bg-cyan-400 animate-ping inline-block" />
                  {selectedConjunction.primary_name}
                </div>
                <div className="text-[8px] text-cyan-400/80 flex items-center justify-between gap-2 border-t border-cyan-500/30 mt-0.5 pt-0.5">
                  <span>VEL: {selectedConjunction.relative_velocity_kms.toFixed(2)} km/s</span>
                  <span className={Math.abs(deltaV) > 0.01 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                    {Math.abs(deltaV) > 0.01 ? `Δv: ${(deltaV > 0 ? '+' : '') + deltaV.toFixed(2)} m/s` : 'ATTITUDE: NOMINAL'}
                  </span>
                </div>
              </div>
              <div className="w-px h-2.5 bg-cyan-400/60" />
            </div>
          </Html>
        )}
      </group>

      {/* =========================================================================
          4. PROCEDURAL 3D ROGUE DEBRIS / SECONDARY FRAGMENT (Flies along Crimson ribbon)
          ========================================================================= */}
      <group ref={debrisGroupRef}>
        <group ref={debrisMeshRef}>
          {/* Jagged Metallic Core Fragment */}
          <mesh castShadow receiveShadow>
            <dodecahedronGeometry args={[0.012, 0]} />
            <meshStandardMaterial
              color="#64748b"
              metalness={0.92}
              roughness={0.32}
            />
          </mesh>

          {/* Bent Broken Solar Shard */}
          <mesh position={[0.007, -0.004, 0.003]} rotation={[0.4, 0.7, 0.2]}>
            <boxGeometry args={[0.022, 0.0012, 0.011]} />
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.75}
              roughness={0.5}
            />
          </mesh>

          {/* Sheared Truss Shard */}
          <mesh position={[-0.006, 0.008, -0.002]} rotation={[-0.3, 0.2, 0.6]}>
            <boxGeometry args={[0.002, 0.022, 0.002]} />
            <meshStandardMaterial
              color="#94a3b8"
              metalness={0.95}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* Pulsing Crimson Warning Point-Light */}
        <pointLight color="#ef4444" intensity={1.6} distance={0.35} />

        {/* Floating Reticle Label */}
        {cameraFocus !== 'GLOBAL' && (
          <Html position={[0, -0.034, 0]} center>
            <div className="flex flex-col items-center pointer-events-none select-none font-mono text-[9px] tracking-wider leading-tight">
              <div className="w-px h-2.5 bg-rose-500/70" />
              <div className="px-2 py-0.5 rounded-none bg-[#0a0406]/95 border border-rose-500/80 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.35)]">
                <div className="font-bold flex items-center gap-1.5 whitespace-nowrap text-rose-400">
                  <span className="w-1.5 h-1.5 bg-rose-500 animate-pulse inline-block" />
                  {selectedConjunction.secondary_name}
                </div>
                <div className="text-[8px] text-rose-400/80 border-t border-rose-500/30 mt-0.5 pt-0.5">
                  THREAT: HIGH // UNCONTROLLED TUMBLE
                </div>
              </div>
            </div>
          </Html>
        )}
      </group>

      {/* =========================================================================
          5. TCA ENCOUNTER INTERSECTION NODE (Dynamic Radar Sphere & Target Rings)
          ========================================================================= */}
      {/* Dynamic Separation Vector Line between bodies at TCA */}
      <Line
        points={[primaryTcaPos, secondaryTcaPos]}
        color={warningColor}
        lineWidth={2}
        dashed
        dashScale={50}
        dashSize={0.5}
        gapSize={0.3}
      />

      {/* Pulsing 3D Warning Sphere at TCA */}
      <mesh ref={sphereWarningRef} position={conjunctionMidpoint}>
        <sphereGeometry args={[0.016, 16, 16]} />
        <meshBasicMaterial
          color={warningColor}
          transparent
          opacity={0.6}
          wireframe
        />
        {cameraFocus === 'CONJUNCTION' && (
          <Html position={[0, 0.05, 0]} center>
            <div className="flex flex-col items-center gap-1 pointer-events-none select-none font-mono">
              {/* Kessler Cascade Alert Banner */}
              {kesslerDemo && (
                <div className="px-2.5 py-1 rounded-none bg-[#06080c]/95 border border-[#f43f5e] text-[#f43f5e] text-[10px] font-bold whitespace-nowrap animate-pulse tracking-wider">
                  ⚠️ CRITICAL KESSLER CASCADE // +400 DEBRIS PARTICLES DETECTED
                </div>
              )}

              {/* Safe Separation Achieved Banner */}
              {isSafeSeparation && !kesslerDemo && Math.abs(deltaV) >= 0.5 && (
                <div className="px-2.5 py-1 rounded-none bg-[#06080c]/95 border border-emerald-500 text-emerald-300 text-[10px] font-bold whitespace-nowrap tracking-wider">
                  SEPARATION NOMINAL (+{currentMissDistanceM.toLocaleString(undefined, { maximumFractionDigits: 0 })}m)
                </div>
              )}

              {/* Miss distance badge */}
              <div
                className="px-2 py-0.5 rounded-none text-[10px] font-bold whitespace-nowrap border tracking-wider tabular-nums"
                style={{
                  backgroundColor: '#06080c',
                  borderColor: warningColor,
                  color: warningColor,
                }}
              >
                TCA MISS DIST: {currentMissDistanceM.toLocaleString(undefined, { maximumFractionDigits: 0 })} m
              </div>
            </div>
          </Html>
        )}
      </mesh>

      {/* Rotating Radar Target Wireframe Ring at TCA */}
      <mesh ref={radarRingRef} position={conjunctionMidpoint}>
        <ringGeometry args={[0.024, 0.027, 32]} />
        <meshBasicMaterial
          color={warningColor}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 6. Interactive Kessler Cascade Debris Burst (400 Fragments) */}
      <DebrisBurst origin={conjunctionMidpoint} active={kesslerDemo} />
    </group>
  );
};
