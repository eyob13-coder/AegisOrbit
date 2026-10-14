'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EarthGlobe } from './EarthGlobe';
import { SatelliteSwarm } from './SatelliteSwarm';
import { ConjunctionRibbons } from './ConjunctionRibbons';
import { CameraController } from './CameraController';

export const SceneCanvas: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#03050a]">
      <Canvas
        camera={{ position: [0, 1.8, 3.2], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#03050a']} />
        
        {/* Aerospace Tactical Deep Space Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-6, -3, -4]} intensity={0.8} color="#0284c7" />

        {/* Tactical Deep Field Stars */}
        <Stars radius={80} depth={50} count={6000} factor={3} saturation={0.5} fade speed={0.4} />

        <Suspense fallback={null}>
          {/* 1. Tactical Dark Earth with Fresnel Rim Glow */}
          <EarthGlobe />

          {/* 2. 10,000+ Object Single Draw-Call Instanced Mesh Swarm */}
          <SatelliteSwarm />

          {/* 3. 3D Conjunction Ribbons & TCA Evasion Markers */}
          <ConjunctionRibbons />
        </Suspense>

        {/* 4. Intelligent Camera Controller & OrbitControls */}
        <CameraController />
      </Canvas>
    </div>
  );
};
