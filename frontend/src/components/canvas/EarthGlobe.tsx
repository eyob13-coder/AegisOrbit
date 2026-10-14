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
      float intensity = pow(fresnel, 2.5) * 1.6;
      gl_FragColor = vec4(glowColor, intensity * 0.75);
    }
  `,
};

// Generates a procedural high-contrast tactical world map canvas texture
function createTacticalEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Deep Ocean Background
  ctx.fillStyle = '#040914';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Latitude/Longitude Grid on texture
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 3. Stylized Continental Landmasses
  const drawLandmass = (pts: [number, number][], fill: string, stroke: string) => {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach(([px, py], i) => {
      const x = (px / 360 + 0.5) * canvas.width;
      const y = (0.5 - py / 180) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  const landFill = '#0a1526';
  const coastGlow = '#0284c7';

  // North America
  drawLandmass([
    [-165, 68], [-140, 70], [-100, 72], [-80, 60], [-60, 50],
    [-70, 42], [-75, 35], [-80, 25], [-97, 20], [-105, 23],
    [-118, 32], [-124, 48], [-140, 58], [-165, 64]
  ], landFill, coastGlow);

  // South America
  drawLandmass([
    [-80, 10], [-60, 5], [-35, -5], [-38, -15], [-50, -30],
    [-65, -52], [-75, -45], [-72, -18], [-80, -2]
  ], landFill, coastGlow);

  // Eurasia
  drawLandmass([
    [-10, 36], [0, 44], [10, 55], [25, 70], [60, 73],
    [100, 75], [140, 72], [170, 65], [145, 45], [120, 30],
    [105, 20], [80, 15], [70, 25], [50, 25], [40, 38],
    [28, 41], [15, 38], [5, 36]
  ], landFill, coastGlow);

  // Africa
  drawLandmass([
    [-18, 15], [0, 35], [12, 37], [32, 31], [43, 12],
    [51, 10], [40, -15], [30, -34], [18, -34], [12, -10],
    [8, 5], [-5, 5], [-17, 12]
  ], landFill, coastGlow);

  // Australia
  drawLandmass([
    [114, -22], [125, -14], [138, -12], [146, -18], [153, -28],
    [150, -37], [138, -38], [128, -32], [115, -34]
  ], landFill, coastGlow);

  // 4. Tactical City Cluster Sparks (Night Lights / Ground Stations)
  const cities: [number, number][] = [
    [-74, 40], [-118, 34], [-0.1, 51.5], [2.3, 48.8], [37.6, 55.7],
    [139.7, 35.6], [116.4, 39.9], [77.2, 28.6], [-46.6, -23.5],
    [151.2, -33.8], [31.2, 30.0], [103.8, 1.3], [-122.4, 37.7],
    [-80.2, 25.8], [13.4, 52.5], [126.9, 37.5]
  ];

  ctx.fillStyle = '#38bdf8';
  cities.forEach(([lon, lat]) => {
    const x = (lon / 360 + 0.5) * canvas.width;
    const y = (0.5 - lat / 180) * canvas.height;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    // Halo ring
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export const EarthGlobe: React.FC = () => {
  const earthRef = useRef<THREE.Group>(null);
  const gridMeshRef = useRef<THREE.LineSegments>(null);

  // Generate procedural tactical world map canvas texture
  const earthTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createTacticalEarthTexture();
  }, []);

  // Generate high-contrast tactical latitude/longitude wireframe rings
  const tacticalGridGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const radius = 1.003;

    // Latitudes (Parallels every 15 degrees)
    for (let lat = -75; lat <= 75; lat += 15) {
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

    // Longitudes (Meridians every 20 degrees)
    for (let lon = 0; lon < 360; lon += 20) {
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

    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  // Generate equatorial orbital reference ring with degree tick marks
  const equatorialRingGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const ringRadius = 1.25;
    const segments = 120;

    // Continuous circle
    for (let i = 0; i < segments; i++) {
      const theta1 = (i / segments) * Math.PI * 2;
      const theta2 = ((i + 1) / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(ringRadius * Math.cos(theta1), 0, ringRadius * Math.sin(theta1)),
        new THREE.Vector3(ringRadius * Math.cos(theta2), 0, ringRadius * Math.sin(theta2))
      );
    }

    // Degree tick marks every 10 degrees, major every 30
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = (deg * Math.PI) / 180;
      const tickLen = deg % 30 === 0 ? 0.035 : 0.015;
      const cosR = Math.cos(rad);
      const sinR = Math.sin(rad);
      points.push(
        new THREE.Vector3((ringRadius - tickLen) * cosR, 0, (ringRadius - tickLen) * sinR),
        new THREE.Vector3((ringRadius + tickLen) * cosR, 0, (ringRadius + tickLen) * sinR)
      );
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  const atmosphereUniforms = useMemo(
    () => ({
      glowColor: { value: new THREE.Color('#0ea5e9') },
    }),
    []
  );

  useFrame((_, delta) => {
    if (earthRef.current) {
      // Realistic diurnal rotation
      earthRef.current.rotation.y += delta * 0.018;
    }
  });

  return (
    <group ref={earthRef}>
      {/* 1. Tactical Textured Earth Sphere */}
      <mesh receiveShadow>
        <sphereGeometry args={[1.0, 64, 64]} />
        <meshStandardMaterial
          color="#0b172a"
          map={earthTexture || undefined}
          roughness={0.65}
          metalness={0.3}
          emissive="#040914"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* 2. Tactical Latitude/Longitude Coordinate Grid */}
      <lineSegments geometry={tacticalGridGeometry} ref={gridMeshRef}>
        <lineBasicMaterial
          color="#0284c7"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* 3. Equatorial Reference Ring with Degree Ticks */}
      <lineSegments geometry={equatorialRingGeometry}>
        <lineBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* 4. Outer Atmospheric Fresnel Rim-Glow Halo */}
      <mesh>
        <sphereGeometry args={[1.045, 64, 64]} />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.018, 64, 64]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.09}
          side={THREE.FrontSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
