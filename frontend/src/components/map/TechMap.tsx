"use client";

import { Float, OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh, Points } from "three";

function Globe() {
  const globeRef = useRef<Mesh>(null);
  const atmosphereRef = useRef<Mesh>(null);
  const pointsRef = useRef<Points>(null);

  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.08;
      globeRef.current.rotation.x = -0.16;
    }

    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y -= delta * 0.035;
    }

    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.018;
    }
  });

  return (
    <Float speed={0.75} rotationIntensity={0.12} floatIntensity={0.18}>
      <group>
        <mesh ref={globeRef}>
          <sphereGeometry args={[1.58, 96, 96]} />
          <meshStandardMaterial
            color="#07111b"
            roughness={0.72}
            metalness={0.15}
            emissive="#061526"
            emissiveIntensity={0.34}
          />
        </mesh>

        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[1.595, 48, 48]} />
          <meshBasicMaterial color="#72f3ff" wireframe transparent opacity={0.085} />
        </mesh>

        <points ref={pointsRef}>
          <sphereGeometry args={[1.64, 44, 44]} />
          <pointsMaterial color="#9bdcff" size={0.009} transparent opacity={0.42} />
        </points>
      </group>
    </Float>
  );
}

export function TechMap() {
  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.65]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <PerspectiveCamera makeDefault position={[0, 0.45, 6.1]} fov={42} />
        <color attach="background" args={["#050608"]} />
        <fog attach="fog" args={["#050608", 7, 13]} />

        <ambientLight intensity={0.48} />
        <directionalLight position={[4, 3, 5]} intensity={1.35} color="#dcecff" />
        <pointLight position={[-3, -1, 2]} intensity={2.2} color="#2d8cff" />
        <pointLight position={[2, 2, -3]} intensity={1.1} color="#72f3ff" />

        <Stars
          radius={70}
          depth={24}
          count={900}
          factor={2.2}
          saturation={0}
          fade
          speed={0.18}
        />
        <Globe />

        <OrbitControls
          enableDamping
          dampingFactor={0.065}
          minDistance={3.1}
          maxDistance={7.6}
          panSpeed={0.38}
          rotateSpeed={0.46}
          zoomSpeed={0.62}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-6 text-white sm:p-8">
        <div>
          <p className="text-lg font-semibold tracking-[0.2em] sm:text-xl">TECHATLAS</p>
          <p className="mt-2 max-w-sm text-xs uppercase tracking-[0.24em] text-slate-400 sm:text-sm">
            India&apos;s technology ecosystem
          </p>
        </div>
        <p className="hidden text-xs uppercase tracking-[0.24em] text-slate-500 sm:block">
          3D environment preview
        </p>
      </div>
    </div>
  );
}
