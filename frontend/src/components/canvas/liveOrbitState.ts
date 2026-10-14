import * as THREE from 'three';

// Ultra-fast shared 60-FPS vector references for camera tracking without triggering React component re-renders
export const liveHeroSatPosition = new THREE.Vector3(0, 0, 0);
export const liveHeroSatTangent = new THREE.Vector3(0, 0, 1);
export const liveDebrisPosition = new THREE.Vector3(0, 0, 0);
