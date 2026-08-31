"use client";

import { Line } from "@react-three/drei";
import type { RoadData } from "@/lib/buildings";

type RoadsLayerProps = { roads: RoadData[]; latitude: number; longitude: number };
const widths: Record<string, number> = { motorway: 4, trunk: 3.2, primary: 2.8, secondary: 2.2, tertiary: 1.7, residential: 1.2, service: 0.8 };

export function RoadsLayer({ roads, latitude, longitude }: RoadsLayerProps) {
  const project = (lat: number, lon: number) => [
    (lon - longitude) * 111_320 * Math.cos((latitude * Math.PI) / 180) * 0.014,
    0.035,
    -(lat - latitude) * 110_540 * 0.014
  ] as [number, number, number];

  return roads.map((road) => (
    <Line key={road.id} points={road.geometry.map((point) => project(point.lat, point.lon))} color="#6193af" lineWidth={widths[road.highway] ?? 1} transparent opacity={0.86} />
  ));
}
