'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useOrbitStore } from '@/store/useOrbitStore';

export const CameraController: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  
  const cameraFocus = useOrbitStore((state) => state.cameraFocus);
  const selectedConjunction = useOrbitStore((state) => state.selectedConjunction);
  const maneuverResult = useOrbitStore((state) => state.maneuverResult);
  const deltaV = useOrbitStore((state) => state.deltaV);

  // User manual override flag: stops auto-lerp when user drags/zooms
  const isUserDragging = useRef(false);
  const isTransitioning = useRef(true);

  // When cameraFocus changes, trigger transition
  useEffect(() => {
    isUserDragging.current = false;
    isTransitioning.current = true;
  }, [cameraFocus, selectedConjunction]);

  // Compute encounter center
  const conjunctionMidpoint = React.useMemo(() => {
    if (!selectedConjunction) return null;
    let p = selectedConjunction.primary_position_scene;
    if (maneuverResult && Math.abs(deltaV) > 0.01 && maneuverResult.maneuvered_position_scene) {
      p = maneuverResult.maneuvered_position_scene;
    }
    const s = selectedConjunction.secondary_position_scene;
    return new THREE.Vector3(
      (p[0] + s[0]) * 0.5,
      (p[1] + s[1]) * 0.5,
      (p[2] + s[2]) * 0.5
    );
  }, [selectedConjunction, maneuverResult, deltaV]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    if (isUserDragging.current || !isTransitioning.current) {
      return;
    }

    if (cameraFocus === 'GLOBAL') {
      const defaultCamPos = new THREE.Vector3(0, 1.8, 3.2);
      const defaultTarget = new THREE.Vector3(0, 0, 0);

      camera.position.lerp(defaultCamPos, delta * 3.5);
      controls.target.lerp(defaultTarget, delta * 3.5);
      controls.update();

      if (
        camera.position.distanceTo(defaultCamPos) < 0.05 &&
        controls.target.distanceTo(defaultTarget) < 0.01
      ) {
        camera.position.copy(defaultCamPos);
        controls.target.copy(defaultTarget);
        isTransitioning.current = false;
      }
    } else if (cameraFocus === 'CONJUNCTION' && conjunctionMidpoint) {
      // Position camera at an aesthetic observation offset from the conjunction zone
      const radialDir = conjunctionMidpoint.clone().normalize();
      const targetCamPos = conjunctionMidpoint
        .clone()
        .add(radialDir.clone().multiplyScalar(0.45))
        .add(new THREE.Vector3(0.08, 0.2, 0.22));

      camera.position.lerp(targetCamPos, delta * 3.0);
      controls.target.lerp(conjunctionMidpoint, delta * 3.0);
      controls.update();

      if (
        camera.position.distanceTo(targetCamPos) < 0.05 &&
        controls.target.distanceTo(conjunctionMidpoint) < 0.01
      ) {
        camera.position.copy(targetCamPos);
        controls.target.copy(conjunctionMidpoint);
        isTransitioning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={0.15}
      maxDistance={9.0}
      rotateSpeed={0.65}
      zoomSpeed={0.8}
      onStart={() => {
        isUserDragging.current = true;
      }}
      onEnd={() => {
        // Allow user to freely inspect without snapping back
        isTransitioning.current = false;
      }}
    />
  );
};
