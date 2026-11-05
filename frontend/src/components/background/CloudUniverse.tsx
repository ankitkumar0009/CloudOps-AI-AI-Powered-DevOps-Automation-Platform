import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createAICore } from './AICore';
import { createParticleNetwork } from './ParticleNetwork';
import { createInfrastructureNodes } from './InfrastructureNodes';

/**
 * Checks whether WebGL is supported by the client browser.
 */
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export const CloudUniverse: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  useEffect(() => {
    // 1. Verify WebGL support
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    // Check device capabilities
    const isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 2. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03050d); // #03050D Deep Digital Cosmos
    scene.fog = new THREE.FogExp2(0x03050d, 0.012);

    // 3. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      250
    );
    camera.position.set(0, 4, 38);

    // 4. WebGL Renderer
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.5));
      container.appendChild(renderer.domElement);
    } catch {
      setHasWebGL(false);
      return;
    }

    // 5. Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0x080d1c, 2.0); // Deep Navy Ambient
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x2563eb, 1.8); // Electric Blue Rim Light
    dirLight1.position.set(20, 30, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x8b5cf6, 1.4); // Violet Rim Light
    dirLight2.position.set(-20, -20, -10);
    scene.add(dirLight2);

    // 6. Build Modular Subsystems
    const aiCore = createAICore();
    scene.add(aiCore.group);

    const particleNetwork = createParticleNetwork(isMobile);
    scene.add(particleNetwork.group);

    const infraNodes = createInfrastructureNodes();
    scene.add(infraNodes.group);

    // 7. Mouse Parallax Tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Touch Parallax for Mobile
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mouse.targetX = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(touch.clientY / window.innerHeight) * 2 + 1;
      }
    };
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // 8. Responsive Resize Handler
    const onResize = () => {
      if (!renderer) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // 9. Animation Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const renderFrame = () => {
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(renderFrame);
      }

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax interpolation (Lerp)
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      camera.position.x = mouse.x * 6.0;
      camera.position.y = 4.0 + mouse.y * 4.0;
      camera.lookAt(0, 0, 0);

      // Update Subsystems
      aiCore.update(elapsedTime, delta);
      particleNetwork.update(elapsedTime, delta);
      infraNodes.update(elapsedTime, delta);

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    // Initial render
    renderFrame();

    // 10. Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);

      aiCore.dispose();
      particleNetwork.dispose();
      infraNodes.dispose();

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  // WebGL Fallback View (Sleek CSS/SVG Digital Universe)
  if (!hasWebGL) {
    return (
      <div
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#03050D]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.18),rgba(8,13,28,0.95)_70%)]" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#080d1c15_1px,transparent_1px),linear-gradient(to_bottom,#080d1c15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#03050D]"
      aria-hidden="true"
    />
  );
};

