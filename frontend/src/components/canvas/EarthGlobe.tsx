'use client';

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Custom Fresnel Atmospheric Rim Glow Shader
const AtmosphereShaderMaterial = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform vec3 glowColor;
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vPosition);
      float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
      float intensity = pow(fresnel, 2.8) * 1.8;
      gl_FragColor = vec4(glowColor, intensity * 0.7);
    }
  `,
};

export const EarthGlobe: React.FC = () => {
  const earthRef = useRef<THREE.Group>(null);
  const gridMeshRef = useRef<THREE.LineSegments>(null);

  // Generate tactical latitude/longitude wireframe rings
  const tacticalGridGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const radius = 1.002;

    // Latitudes (Parallels)
    for (let lat = -80; lat <= 80; lat += 20) {
      const phi = (90 - lat) * (Math.PI / 180);
      const r_lat = radius * Math.sin(phi);
      const y_lat = radius * Math.cos(phi);
      const segments = 64;
      for (let s = 0; s < segments; s++) {
        const theta1 = (s / segments) * Math.PI * 2;
        const theta2 = ((s + 1) / segments) * Math.PI * 2;
        points.push(
          new THREE.Vector3(r_lat * Math.cos(theta1), y_lat, r_lat * Math.sin(theta1)),
          new THREE.Vector3(r_lat * Math.cos(theta2), y_lat, r_lat * Math.sin(theta2))
        );
      }
    }

    // Longitudes (Meridians)
    for (let lon = 0; lon < 360; lon += 30) {
      const theta = lon * (Math.PI / 180);
      const segments = 64;
      for (let s = 0; s < segments; s++) {
        const phi1 = (s / segments) * Math.PI;
        const phi2 = ((s + 1) / segments) * Math.PI;
        points.push(
          new THREE.Vector3(
            radius * Math.sin(phi1) * Math.cos(theta),
            radius * Math.cos(phi1),
            radius * Math.sin(phi1) * Math.sin(theta)
          ),
          new THREE.Vector3(
            radius * Math.sin(phi2) * Math.cos(theta),
            radius * Math.cos(phi2),
            radius * Math.sin(phi2) * Math.sin(theta)
          )
        );
      }
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, []);

  const atmosphereUniforms = useMemo(
    () => ({
      glowColor: { value: new THREE.Color('#06b6d4') },
    }),
    []
  );

  useFrame((_, delta) => {
    if (earthRef.current) {
      // Slow realistic diurnal planetary rotation
      earthRef.current.rotation.y += delta * 0.015;
    }
  });

  return (
    <group ref={earthRef}>
      {/* 1. Base Earth Sphere: Deep Navy / Obsidian Tactical Finish */}
      <mesh receiveShadow>
        <sphereGeometry args={[1.0, 64, 64]} />
        <meshStandardMaterial
          color="#060b17"
          roughness={0.7}
          metalness={0.2}
          emissive="#030712"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* 2. Tactical Continental / Coordinate Grid Overlay */}
      <lineSegments geometry={tacticalGridGeometry} ref={gridMeshRef}>
        <lineBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* 3. Glowing Equator Marker */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0025, 1.006, 64]} />
        <meshBasicMaterial
          color="#22d3ee"
          side={THREE.DoubleSide}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 4. Custom Fresnel Atmospheric Rim Glow Shader */}
      <mesh>
        <sphereGeometry args={[1.045, 64, 64]} />
        <shaderMaterial
          vertexShader={AtmosphereShaderMaterial.vertexShader}
          fragmentShader={AtmosphereShaderMaterial.fragmentShader}
          uniforms={atmosphereUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
