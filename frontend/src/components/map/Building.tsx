"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Color, ExtrudeGeometry, Mesh, Shape } from "three";
import type { BuildingData } from "@/lib/buildings";

type BuildingProps = {
  building: BuildingData;
  cityLatitude: number;
  cityLongitude: number;
  selected: boolean;
  onSelect: (id: string) => void;
};

const METERS_TO_SCENE = 0.014;

function toLocalPoint(lat: number, lon: number, cityLatitude: number, cityLongitude: number) {
  const metersPerLongitude = 111_320 * Math.cos((cityLatitude * Math.PI) / 180);
  return {
    x: (lon - cityLongitude) * metersPerLongitude * METERS_TO_SCENE,
    z: -(lat - cityLatitude) * 110_540 * METERS_TO_SCENE
  };
}

export function Building({ building, cityLatitude, cityLongitude, selected, onSelect }: BuildingProps) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<Mesh>(null);
  const growthRef = useRef(0);

  const geometry = useMemo(() => {
    const shape = new Shape();
    building.footprint.forEach((point, index) => {
      const local = toLocalPoint(point.lat, point.lon, cityLatitude, cityLongitude);
      if (index === 0) shape.moveTo(local.x, local.z);
      else shape.lineTo(local.x, local.z);
    });

    const depth = Math.max(0.18, building.height * METERS_TO_SCENE);
    const geom = new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 1
    });

    // ExtrudeGeometry by default creates geometry along +Z. After the mesh is rotated
    // by -PI/2 the extrusion maps to negative Y (below ground). Shift geometry along
    // Z by -depth so that after rotation the building extends upward above ground.
    geom.translate(0, 0, -depth);
    return geom;
  }, [building, cityLatitude, cityLongitude]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    growthRef.current = Math.min(1, growthRef.current + delta * 0.9);
    if (meshRef.current) meshRef.current.scale.z = 0.03 + growthRef.current * 0.97;
  });

  const shade = (Number.parseInt(building.id.replace(/\D/g, ""), 10) || 0) % 3;
  const baseColor = ["#55758d", "#66879f", "#7898ac"][shade];

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onSelect(building.id);
      }}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      <meshStandardMaterial
        color={new Color(selected ? "#4a6f8d" : hovered ? "#36526b" : baseColor)}
        emissive={selected || hovered ? "#2d6d95" : "#234a65"}
        emissiveIntensity={selected ? 0.65 : hovered ? 0.4 : 0.38}
        roughness={0.75}
        metalness={0.24}
      />
    </mesh>
  );
}
