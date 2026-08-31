"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { CanvasTexture, Group, Mesh, Points, SRGBColorSpace } from "three";
import { GLOBE_RADIUS } from "@/lib/constants";

type GlobeProps = {
  children?: ReactNode;
  isFocusingIndia: boolean;
};

export function Globe({ children, isFocusingIndia }: GlobeProps) {
  const groupRef = useRef<Group>(null);
  const atmosphereRef = useRef<Mesh>(null);
  const pointsRef = useRef<Points>(null);

  const earthTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    const width = 1024;
    const height = 512;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    const oceanGradient = context.createLinearGradient(0, 0, width, height);
    oceanGradient.addColorStop(0, "#041a2b");
    oceanGradient.addColorStop(0.5, "#0a3161");
    oceanGradient.addColorStop(1, "#062848");
    context.fillStyle = oceanGradient;
    context.fillRect(0, 0, width, height);

    const drawLandMass = (
      points: Array<[number, number]>,
      baseColor: string,
      shadeColor: string,
      highlightColor: string
    ) => {
      context.beginPath();
      context.moveTo(points[0][0], points[0][1]);
      points.slice(1).forEach(([x, y]) => context.lineTo(x, y));
      context.closePath();
      context.fillStyle = baseColor;
      context.fill();

      context.save();
      context.globalAlpha = 0.45;
      context.fillStyle = shadeColor;
      context.fill();
      context.restore();

      context.save();
      context.globalAlpha = 0.2;
      context.fillStyle = highlightColor;
      context.fill();
      context.restore();
    };

    drawLandMass(
      [
        [117, 154],
        [188, 123],
        [257, 136],
        [290, 101],
        [365, 141],
        [442, 111],
        [519, 140],
        [584, 177],
        [614, 218],
        [573, 266],
        [530, 313],
        [470, 332],
        [430, 365],
        [332, 372],
        [262, 344],
        [206, 317],
        [166, 275],
        [121, 226]
      ],
      "#3d7d56",
      "#264d3a",
      "#7fb77f"
    );

    drawLandMass(
      [
        [610, 160],
        [680, 151],
        [744, 169],
        [812, 154],
        [879, 185],
        [932, 206],
        [973, 248],
        [960, 295],
        [913, 318],
        [866, 347],
        [794, 351],
        [738, 333],
        [674, 320],
        [629, 290],
        [597, 225]
      ],
      "#5a8d4b",
      "#3e5d32",
      "#b0c06d"
    );

    drawLandMass(
      [
        [717, 118],
        [757, 103],
        [792, 91],
        [820, 106],
        [852, 128],
        [836, 154],
        [811, 170],
        [781, 163],
        [742, 143]
      ],
      "#7a6842",
      "#56452f",
      "#d0b07d"
    );

    drawLandMass(
      [
        [952, 113],
        [998, 131],
        [1020, 157],
        [1008, 195],
        [968, 212],
        [940, 182]
      ],
      "#7d6746",
      "#56452f",
      "#d7c294"
    );

    drawLandMass(
      [
        [792, 358],
        [839, 351],
        [892, 364],
        [915, 387],
        [889, 419],
        [820, 425],
        [770, 397]
      ],
      "#6f8b4b",
      "#4c6035",
      "#c0d48d"
    );

    context.fillStyle = "rgba(255,255,255,0.10)";
    for (let i = 0; i < 26; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const w = 80 + Math.random() * 160;
      const h = 12 + Math.random() * 50;
      context.fillRect(x, y, w, h);
    }

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current && !isFocusingIndia) {
      groupRef.current.rotation.y += delta * 0.055;
    }

    if (atmosphereRef.current && !isFocusingIndia) {
      atmosphereRef.current.rotation.y -= delta * 0.018;
    }

    if (pointsRef.current && !isFocusingIndia) {
      pointsRef.current.rotation.y += delta * 0.012;
    }
  });

  return (
    <group ref={groupRef} rotation={[-0.12, -1.18, 0]} position={[0, -0.14, 0]}>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <meshStandardMaterial
          map={earthTexture ?? undefined}
          color="#dfe9f5"
          roughness={0.92}
          metalness={0.08}
          emissive="#0c2141"
          emissiveIntensity={0.28}
        />
      </mesh>

      <mesh ref={atmosphereRef} scale={1.02}>
        <sphereGeometry args={[GLOBE_RADIUS, 72, 72]} />
        <meshBasicMaterial color="#96c9ff" transparent opacity={0.12} />
      </mesh>

      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS + 0.06, 72, 72]} />
        <meshBasicMaterial color="#7db8ff" transparent opacity={0.04} />
      </mesh>

      <points ref={pointsRef}>
        <sphereGeometry args={[GLOBE_RADIUS + 0.08, 34, 34]} />
        <pointsMaterial color="#8aa9c7" size={0.0068} transparent opacity={0.18} />
      </points>

      {children}
    </group>
  );
}
