import * as THREE from 'three';

export interface ParticleNetworkInstance {
  group: THREE.Group;
  update: (time: number, delta: number) => void;
  dispose: () => void;
}

export function createParticleNetwork(isMobile: boolean = false): ParticleNetworkInstance {
  const group = new THREE.Group();

  // 1. Ambient Moving Starfield (Deep cosmos layer)
  const starCount = isMobile ? 250 : 600;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  const starPalette = [
    new THREE.Color(0x8b5cf6), // Violet
    new THREE.Color(0x2563eb), // Electric Blue
    new THREE.Color(0x00e5ff), // Neon Cyan
    new THREE.Color(0xffffff), // Bright white star
  ];

  for (let i = 0; i < starCount; i++) {
    const idx = i * 3;
    starPos[idx] = (Math.random() - 0.5) * 160;
    starPos[idx + 1] = (Math.random() - 0.5) * 120;
    starPos[idx + 2] = -30 - Math.random() * 80;

    const col = starPalette[Math.floor(Math.random() * starPalette.length)];
    starColors[idx] = col.r;
    starColors[idx + 1] = col.g;
    starColors[idx + 2] = col.b;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 0.9,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  });
  const starPoints = new THREE.Points(starGeo, starMat);
  group.add(starPoints);

  // 2. Floating 3D Cloud Structures (Volumetric Cloud Clusters)
  // We create 3 cloud cluster centers that drift through space
  const cloudCount = isMobile ? 180 : 400;
  const cloudGeo = new THREE.BufferGeometry();
  const cloudPos = new Float32Array(cloudCount * 3);
  const cloudColors = new Float32Array(cloudCount * 3);

  const clusterCenters = [
    { x: -35, y: 15, z: -10, color: new THREE.Color(0x2563eb) },
    { x: 30, y: -12, z: -15, color: new THREE.Color(0x8b5cf6) },
    { x: 0, y: 25, z: -25, color: new THREE.Color(0x00e5ff) },
  ];

  for (let i = 0; i < cloudCount; i++) {
    const idx = i * 3;
    const cluster = clusterCenters[i % clusterCenters.length];
    // Gaussian spread around cluster center
    const radius = 8 + Math.random() * 14;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    cloudPos[idx] = cluster.x + radius * Math.sin(phi) * Math.cos(theta);
    cloudPos[idx + 1] = cluster.y + (radius * 0.5) * Math.sin(phi) * Math.sin(theta);
    cloudPos[idx + 2] = cluster.z + radius * Math.cos(phi);

    cloudColors[idx] = cluster.color.r;
    cloudColors[idx + 1] = cluster.color.g;
    cloudColors[idx + 2] = cluster.color.b;
  }
  cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPos, 3));
  cloudGeo.setAttribute('color', new THREE.BufferAttribute(cloudColors, 3));

  const cloudMat = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
  });
  const cloudPoints = new THREE.Points(cloudGeo, cloudMat);
  group.add(cloudPoints);

  // 3. Dynamic Interactive Network Nodes & Synaptic Connections
  const nodeCount = isMobile ? 35 : 75;
  const nodeCoords: THREE.Vector3[] = [];
  const nodeVelocities: THREE.Vector3[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * 60,
      (Math.random() - 0.5) * 45,
      (Math.random() - 0.5) * 35 - 5
    );
    nodeCoords.push(pos);
    nodeVelocities.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.03
      )
    );
  }

  // Network Nodes Points
  const netGeo = new THREE.BufferGeometry();
  const netPositions = new Float32Array(nodeCount * 3);
  nodeCoords.forEach((p, i) => {
    netPositions[i * 3] = p.x;
    netPositions[i * 3 + 1] = p.y;
    netPositions[i * 3 + 2] = p.z;
  });
  netGeo.setAttribute('position', new THREE.BufferAttribute(netPositions, 3));

  const netMat = new THREE.PointsMaterial({
    size: 1.5,
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });
  const netPoints = new THREE.Points(netGeo, netMat);
  group.add(netPoints);

  // Dynamic Connecting Lines (Pre-allocated buffer)
  const maxLines = isMobile ? 120 : 300;
  const linePositions = new Float32Array(maxLines * 6);
  const lineColors = new Float32Array(maxLines * 6);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
  });
  const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
  group.add(lineSegments);

  // Connection distance threshold
  const maxDist = 12.0;

  // Update loop
  const update = (time: number, delta: number) => {
    // 1. Drift stars
    starPoints.rotation.y += delta * 0.015;
    starPoints.rotation.x += delta * 0.008;

    // 2. Undulate and drift cloud structures
    cloudPoints.rotation.y -= delta * 0.02;
    const cPos = cloudGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < cloudCount; i++) {
      const idx = i * 3;
      cPos[idx + 1] += Math.sin(time * 0.8 + i) * 0.015;
    }
    cloudGeo.attributes.position.needsUpdate = true;

    // 3. Move network nodes with boundary bounce
    const posArr = netGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < nodeCount; i++) {
      const p = nodeCoords[i];
      const v = nodeVelocities[i];
      p.add(v);

      if (Math.abs(p.x) > 35) v.x *= -1;
      if (Math.abs(p.y) > 25) v.y *= -1;
      if (Math.abs(p.z) > 25) v.z *= -1;

      posArr[i * 3] = p.x;
      posArr[i * 3 + 1] = p.y;
      posArr[i * 3 + 2] = p.z;
    }
    netGeo.attributes.position.needsUpdate = true;

    // 4. Update line connections between close nodes
    let lineIdx = 0;
    const colA = new THREE.Color(0x2563eb);
    const colB = new THREE.Color(0x8b5cf6);

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (lineIdx >= maxLines) break;
        const p1 = nodeCoords[i];
        const p2 = nodeCoords[j];
        const dist = p1.distanceTo(p2);

        if (dist < maxDist) {
          const ptr = lineIdx * 6;
          linePositions[ptr] = p1.x;
          linePositions[ptr + 1] = p1.y;
          linePositions[ptr + 2] = p1.z;
          linePositions[ptr + 3] = p2.x;
          linePositions[ptr + 4] = p2.y;
          linePositions[ptr + 5] = p2.z;

          // Pulse line opacity based on time & distance
          const alphaFactor = (1 - dist / maxDist) * (0.6 + Math.sin(time * 3 + lineIdx) * 0.4);
          lineColors[ptr] = colA.r * alphaFactor;
          lineColors[ptr + 1] = colA.g * alphaFactor;
          lineColors[ptr + 2] = colA.b * alphaFactor;
          lineColors[ptr + 3] = colB.r * alphaFactor;
          lineColors[ptr + 4] = colB.g * alphaFactor;
          lineColors[ptr + 5] = colB.b * alphaFactor;

          lineIdx++;
        }
      }
      if (lineIdx >= maxLines) break;
    }

    // Zero out unused lines
    for (let k = lineIdx * 6; k < maxLines * 6; k++) {
      linePositions[k] = 0;
      lineColors[k] = 0;
    }

    lineGeo.setDrawRange(0, lineIdx * 2);
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate = true;
  };

  const dispose = () => {
    starGeo.dispose();
    starMat.dispose();
    cloudGeo.dispose();
    cloudMat.dispose();
    netGeo.dispose();
    netMat.dispose();
    lineGeo.dispose();
    lineMat.dispose();
  };

  return { group, update, dispose };
}

