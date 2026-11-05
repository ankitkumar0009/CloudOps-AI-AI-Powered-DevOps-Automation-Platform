import * as THREE from 'three';

export interface AICoreInstance {
  group: THREE.Group;
  update: (time: number, delta: number) => void;
  dispose: () => void;
}

export function createAICore(): AICoreInstance {
  const group = new THREE.Group();
  group.position.set(0, 0, 0);

  // 1. Central Glowing Core Sphere
  const coreGeo = new THREE.IcosahedronGeometry(2.4, 3);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6, // Violet
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  group.add(coreMesh);

  // 2. Inner Pulsing Energy Nucleus
  const innerGeo = new THREE.SphereGeometry(1.5, 24, 24);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff, // Neon Cyan
    transparent: true,
    opacity: 0.9,
  });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  group.add(innerMesh);

  // 3. Dense Core Light
  const coreLight = new THREE.PointLight(0x00e5ff, 2.5, 45, 1.2);
  coreLight.position.set(0, 0, 0);
  group.add(coreLight);

  const secondaryLight = new THREE.PointLight(0x8b5cf6, 2.0, 35, 1.5);
  secondaryLight.position.set(0, 0, 0);
  group.add(secondaryLight);

  // 4. Rotating Energy Rings (3 Nested Gyroscopic Rings)
  interface EnergyRing {
    mesh: THREE.Mesh;
    speedX: number;
    speedY: number;
    speedZ: number;
  }
  const rings: EnergyRing[] = [];

  const ringConfigs = [
    { radius: 4.2, tube: 0.05, color: 0x00e5ff, sx: 0.4, sy: 0.7, sz: 0.2, tilt: [0.6, 0.2, 0] },
    { radius: 5.4, tube: 0.04, color: 0x8b5cf6, sx: -0.5, sy: 0.3, sz: 0.6, tilt: [-0.4, 0.8, 0.5] },
    { radius: 6.8, tube: 0.035, color: 0x2563eb, sx: 0.3, sy: -0.6, sz: 0.4, tilt: [0.2, -0.5, 0.9] },
  ];

  ringConfigs.forEach((cfg) => {
    const ringGeo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.75,
      wireframe: false,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.set(cfg.tilt[0], cfg.tilt[1], cfg.tilt[2]);
    group.add(ringMesh);
    rings.push({
      mesh: ringMesh,
      speedX: cfg.sx,
      speedY: cfg.sy,
      speedZ: cfg.sz,
    });
  });

  // 5. Outer Digital Cage / Lattice
  const cageGeo = new THREE.DodecahedronGeometry(7.6, 0);
  const cageMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    wireframe: true,
    transparent: true,
    opacity: 0.25,
  });
  const cageMesh = new THREE.Mesh(cageGeo, cageMat);
  group.add(cageMesh);

  // Update loop
  const update = (time: number, delta: number) => {
    // Pulse inner core scale
    const pulse = 1.0 + Math.sin(time * 3.0) * 0.08;
    innerMesh.scale.set(pulse, pulse, pulse);

    // Subtle breathing on core mesh
    const corePulse = 1.0 + Math.cos(time * 2.0) * 0.05;
    coreMesh.scale.set(corePulse, corePulse, corePulse);

    // Core rotations
    coreMesh.rotation.y += delta * 0.3;
    coreMesh.rotation.x += delta * 0.15;
    cageMesh.rotation.y -= delta * 0.1;
    cageMesh.rotation.z += delta * 0.08;

    // Rings rotation
    rings.forEach((r) => {
      r.mesh.rotation.x += delta * r.speedX;
      r.mesh.rotation.y += delta * r.speedY;
      r.mesh.rotation.z += delta * r.speedZ;
    });

    // Light breathing
    coreLight.intensity = 2.2 + Math.sin(time * 4) * 0.5;
    secondaryLight.intensity = 1.8 + Math.cos(time * 3) * 0.4;
  };

  const dispose = () => {
    coreGeo.dispose();
    coreMat.dispose();
    innerGeo.dispose();
    innerMat.dispose();
    cageGeo.dispose();
    cageMat.dispose();
    rings.forEach((r) => {
      r.mesh.geometry.dispose();
      (r.mesh.material as THREE.Material).dispose();
    });
  };

  return { group, update, dispose };
}

