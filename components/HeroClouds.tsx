"use client";

import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import type * as THREE from "three";

interface AnimatedCloudProps {
  texture: THREE.Texture;
  startZ: number;
  initialY: number;
  initialX: number;
  args: [number, number];
  idx: number;
}

function AnimatedCloud({
  texture,
  startZ,
  initialY,
  initialX,
  args,
  idx,
}: AnimatedCloudProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const stateRef = useRef({ x: initialX, y: initialY, flipX: 1 });

  useFrame((state, delta) => {
    if (!meshRef.current || !matRef.current) return;
    meshRef.current.position.z += 0.8 * delta;
    let z = meshRef.current.position.z;
    if (z > 5) {
      z -= 24;
      meshRef.current.position.z = z;
      stateRef.current.x = initialX + (Math.random() - 0.5) * 6;
      stateRef.current.y = initialY + (Math.random() - 0.5) * 2;
      stateRef.current.flipX = Math.random() > 0.5 ? 1 : -1;
    }
    let opacity = 0.6;
    if (z < -15) opacity = (1 - (-15 - z) / 4) * 0.6;
    else if (z > 2) opacity = (1 - (z - 2) / 3) * 0.6;
    matRef.current.opacity = Math.max(0, Math.min(0.6, opacity));
    const time = state.clock.getElapsedTime();
    meshRef.current.position.x =
      stateRef.current.x + Math.sin(time * 0.2 + idx) * 0.8;
    meshRef.current.position.y =
      stateRef.current.y + Math.cos(time * 0.15 + idx) * 0.4;
    meshRef.current.scale.x = stateRef.current.flipX;
  });

  return (
    <mesh ref={meshRef} position={[initialX, initialY, startZ]}>
      <planeGeometry args={args} />
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

function MultiLayerClouds() {
  const [bg, tint, l0, l1, l2, l3, l4, intro] = useTexture([
    "/HDR_AboveTheClouds.test.jpg",
    "/Cloud-tint-8.png",
    "/layer0.png",
    "/layer1.png",
    "/layer2.png",
    "/layer3.png",
    "/layer4.png",
    "/intro-cloud.png",
  ]);
  const tintRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (tintRef.current) {
      const time = state.clock.getElapsedTime();
      tintRef.current.position.x = Math.sin(time * 0.05) * 4;
      tintRef.current.position.y = -10 + Math.cos(time * 0.03) * 1.5;
    }
  });

  const cloudArgs: [number, number] = [90, 40];
  const clouds = [
    { map: l0, z: -19, y: -14, x: 0 },
    { map: l1, z: -15, y: -15, x: -3 },
    { map: l2, z: -11, y: -14, x: 3 },
    { map: l3, z: -7, y: -15, x: -2 },
    { map: l4, z: -3, y: -14, x: 2 },
    { map: intro, z: 1, y: -15, x: 0 },
  ];

  return (
    <group>
      <mesh position={[0, 0, -20]}>
        <planeGeometry args={[120, 60]} />
        <meshBasicMaterial map={bg} depthWrite={false} />
      </mesh>
      <mesh ref={tintRef} position={[0, -10, -40]}>
        <planeGeometry args={[200, 50]} />
        <meshBasicMaterial map={tint} transparent depthWrite={false} />
      </mesh>
      {clouds.map((cloud, idx) => (
        <AnimatedCloud
          key={idx}
          idx={idx}
          texture={cloud.map}
          startZ={cloud.z}
          initialY={cloud.y}
          initialX={cloud.x}
          args={cloudArgs}
        />
      ))}
    </group>
  );
}

export function HeroClouds() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <Suspense fallback={null}>
          <MultiLayerClouds />
        </Suspense>
      </Canvas>
    </div>
  );
}