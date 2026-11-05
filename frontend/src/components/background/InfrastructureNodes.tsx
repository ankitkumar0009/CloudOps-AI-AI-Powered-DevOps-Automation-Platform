import * as THREE from 'three';

export interface InfrastructureNodesInstance {
  group: THREE.Group;
  update: (time: number, delta: number) => void;
  dispose: () => void;
}

interface NodeConfig {
  id: string;
  name: string;
  symbol: string;
  status: string;
  color: number;
  hexColor: string;
  radius: number;
  height: number;
  speed: number;
  phase: number;
}

const NODES_DATA: NodeConfig[] = [
  { id: 'github', name: 'GITHUB', symbol: '⌥', status: 'CI/CD SYNC', color: 0x8b5cf6, hexColor: '#8b5cf6', radius: 18, height: 4, speed: 0.18, phase: 0 },
  { id: 'docker', name: 'DOCKER', symbol: '▤', status: 'REGISTRY', color: 0x00e5ff, hexColor: '#00e5ff', radius: 24, height: -3, speed: 0.14, phase: 0.8 },
  { id: 'aws', name: 'AWS CLOUD', symbol: '☁', status: 'US-EAST-1', color: 0xf59e0b, hexColor: '#f59e0b', radius: 22, height: 7, speed: 0.16, phase: 1.6 },
  { id: 'kubernetes', name: 'KUBERNETES', symbol: '⎈', status: 'EKS CLUSTER', color: 0x2563eb, hexColor: '#2563eb', radius: 28, height: -5, speed: 0.12, phase: 2.4 },
  { id: 'terraform', name: 'TERRAFORM', symbol: '◈', status: 'IaC APPLIED', color: 0xa855f7, hexColor: '#a855f7', radius: 26, height: 3, speed: 0.15, phase: 3.2 },
  { id: 'prometheus', name: 'PROMETHEUS', symbol: '⚡', status: 'SCRAPING', color: 0xef4444, hexColor: '#ef4444', radius: 20, height: -7, speed: 0.19, phase: 4.0 },
  { id: 'grafana', name: 'GRAFANA', symbol: '📊', status: 'TELEMETRY', color: 0xf97316, hexColor: '#f97316', radius: 30, height: 6, speed: 0.11, phase: 4.8 },
  { id: 'gemini', name: 'GEMINI AI', symbol: '✦', status: 'AUTONOMOUS', color: 0x00e5ff, hexColor: '#00e5ff', radius: 16, height: -2, speed: 0.22, phase: 5.6 },
];

function createNodeTexture(cfg: NodeConfig): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 110;
  const ctx = canvas.getContext('2d')!;

  // Background rounded capsule with neon glow border
  ctx.fillStyle = 'rgba(8, 13, 28, 0.88)';
  ctx.strokeStyle = cfg.hexColor;
  ctx.lineWidth = 3;

  const r = 16;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(canvas.width - r, 0);
  ctx.quadraticCurveTo(canvas.width, 0, canvas.width, r);
  ctx.lineTo(canvas.width, canvas.height - r);
  ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - r, canvas.height);
  ctx.lineTo(r, canvas.height);
  ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tech Symbol / Icon
  ctx.font = 'bold 36px "Segoe UI Symbol", monospace, sans-serif';
  ctx.fillStyle = cfg.hexColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(cfg.symbol, 20, 52);

  // Tech Title
  ctx.font = 'bold 24px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(cfg.name, 68, 42);

  // Tech Status
  ctx.font = 'bold 14px "Fira Code", monospace';
  ctx.fillStyle = cfg.hexColor;
  ctx.fillText(`● ${cfg.status}`, 68, 76);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export function createInfrastructureNodes(): InfrastructureNodesInstance {
  const group = new THREE.Group();

  interface NodeObject {
    config: NodeConfig;
    container: THREE.Group;
    mesh: THREE.Mesh;
    ring: THREE.Mesh;
    sprite: THREE.Sprite;
    beamLine: THREE.Line;
    pulseMesh: THREE.Mesh;
    currentAngle: number;
    beamPositions: Float32Array;
  }

  const nodes: NodeObject[] = [];
  const texturesToDispose: THREE.CanvasTexture[] = [];
  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [];

  NODES_DATA.forEach((cfg) => {
    const nodeContainer = new THREE.Group();

    // 1. 3D Polyhedral Geometric Core
    const geo = new THREE.OctahedronGeometry(1.0, 0);
    geometriesToDispose.push(geo);

    const mat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    });
    materialsToDispose.push(mat);
    const mesh = new THREE.Mesh(geo, mat);
    nodeContainer.add(mesh);

    // 2. Glowing Halo Ring
    const ringGeo = new THREE.TorusGeometry(1.8, 0.04, 12, 40);
    geometriesToDispose.push(ringGeo);
    const ringMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.65,
    });
    materialsToDispose.push(ringMat);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    nodeContainer.add(ring);

    // 3. Billboard Sprite Label
    const tex = createNodeTexture(cfg);
    texturesToDispose.push(tex);
    const spriteMat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    });
    materialsToDispose.push(spriteMat);
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(7.5, 2.75, 1);
    sprite.position.set(0, 2.4, 0);
    nodeContainer.add(sprite);

    // 4. Energy Laser Beam connecting Node to Central Core (0, 0, 0)
    const beamPositions = new Float32Array(6); // (0,0,0) to nodePos
    const beamGeo = new THREE.BufferGeometry();
    beamGeo.setAttribute('position', new THREE.BufferAttribute(beamPositions, 3));
    geometriesToDispose.push(beamGeo);

    const beamMat = new THREE.LineBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    materialsToDispose.push(beamMat);
    const beamLine = new THREE.Line(beamGeo, beamMat);
    group.add(beamLine);

    // 5. Traveling Signal Pulse Packet on the Beam
    const pulseGeo = new THREE.SphereGeometry(0.35, 8, 8);
    geometriesToDispose.push(pulseGeo);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    materialsToDispose.push(pulseMat);
    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    group.add(pulseMesh);

    group.add(nodeContainer);

    nodes.push({
      config: cfg,
      container: nodeContainer,
      mesh,
      ring,
      sprite,
      beamLine,
      pulseMesh,
      currentAngle: cfg.phase,
      beamPositions,
    });
  });

  // Update loop
  const update = (time: number, delta: number) => {
    nodes.forEach((n) => {
      // Orbital movement
      n.currentAngle += delta * n.config.speed;
      const x = Math.cos(n.currentAngle) * n.config.radius;
      const z = Math.sin(n.currentAngle) * n.config.radius;
      // Gentle harmonic vertical elevation
      const y = n.config.height + Math.sin(time * 1.5 + n.config.phase) * 1.2;

      n.container.position.set(x, y, z);

      // Spin internal geometry
      n.mesh.rotation.x += delta * 1.0;
      n.mesh.rotation.y += delta * 0.8;
      n.ring.rotation.z += delta * 0.6;

      // Update Laser Beam from (0,0,0) to node position
      const arr = n.beamPositions;
      arr[0] = 0; arr[1] = 0; arr[2] = 0;
      arr[3] = x; arr[4] = y; arr[5] = z;
      n.beamLine.geometry.attributes.position.needsUpdate = true;

      // Update traveling pulse packet along the beam
      const pulseT = (time * 0.8 + n.config.phase) % 1.0;
      n.pulseMesh.position.set(x * pulseT, y * pulseT, z * pulseT);
      const pulseScale = 0.5 + Math.sin(pulseT * Math.PI) * 0.8;
      n.pulseMesh.scale.set(pulseScale, pulseScale, pulseScale);
    });
  };

  const dispose = () => {
    texturesToDispose.forEach((t) => t.dispose());
    geometriesToDispose.forEach((g) => g.dispose());
    materialsToDispose.forEach((m) => m.dispose());
  };

  return { group, update, dispose };
}

