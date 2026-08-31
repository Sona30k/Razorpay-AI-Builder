"use client";

import { Shape, ShapeGeometry } from "three";
import { useMemo } from "react";
import type { LanduseData } from "@/lib/buildings";

type LanduseLayerProps = { areas: LanduseData[]; latitude: number; longitude: number };

export function LanduseLayer({ areas, latitude, longitude }: LanduseLayerProps) {
  const geometries = useMemo(() => areas.map((area) => {
    const shape = new Shape();
    area.polygon.forEach((point, index) => {
      const x = (point.lon - longitude) * 111_320 * Math.cos((latitude * Math.PI) / 180) * 0.014;
      const z = -(point.lat - latitude) * 110_540 * 0.014;
      if (index === 0) shape.moveTo(x, z); else shape.lineTo(x, z);
    });
    return { area, geometry: new ShapeGeometry(shape) };
  }), [areas, latitude, longitude]);

  return geometries.map(({ area, geometry }) => <mesh key={area.id} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}><meshBasicMaterial color={area.kind === "water" ? "#1a5b82" : "#28604d"} transparent opacity={0.76} /></mesh>);
}
