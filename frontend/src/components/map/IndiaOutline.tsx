"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial
} from "three";
import type { Vector3Tuple } from "three";
import {
  INDIA_BOUNDARY_GEOJSON,
  INDIA_GLOBE_RADIUS,
  latLonToSphereVector
} from "@/lib/constants";

type IndiaOutlineProps = {
  focusProgress: number;
};

function coordinateToGlobePoint(lon: number, lat: number, radius: number): Vector3Tuple {
  const point = latLonToSphereVector(lat, lon, radius);

  return [point.x, point.y, point.z];
}

function ringArea(points: Array<[number, number]>) {
  let sum = 0;

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    sum += current[0] * next[1] - next[0] * current[1];
  }

  return Math.abs(sum) / 2;
}

function toRingArray(geometry: any): Array<[number, number]> {
  if (geometry.type === "Polygon") {
    return Array.from((geometry.coordinates[0] ?? []) as readonly [number, number][]);
  }

  if (geometry.type === "MultiPolygon") {
    const polygons = geometry.coordinates ?? [];
    const outermost = polygons
      .map((polygon: Array<[number, number]>[]) =>
        Array.from((polygon[0] ?? []) as readonly [number, number][]) as [number, number][]
      )
      .sort((a: [number, number][], b: [number, number][]) => ringArea(b) - ringArea(a));

    return outermost[0] ?? [];
  }

  return [];
}

function closeRing(points: Array<[number, number]>) {
  if (points.length === 0) {
    return points;
  }

  const first = points[0];
  const last = points[points.length - 1];

  if (Math.abs(first[0] - last[0]) < 1e-9 && Math.abs(first[1] - last[1]) < 1e-9) {
    return points;
  }

  return [...points, first];
}

function mergeAdjacentRings(
  primary: Array<[number, number]>,
  secondary: Array<[number, number]>
): Array<[number, number]> {
  let bestPrimaryIndex = -1;
  let bestSecondaryIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < primary.length; i += 1) {
    for (let j = 0; j < secondary.length; j += 1) {
      const dx = primary[i][0] - secondary[j][0];
      const dy = primary[i][1] - secondary[j][1];
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestPrimaryIndex = i;
        bestSecondaryIndex = j;
      }
    }
  }

  if (bestPrimaryIndex < 0 || bestSecondaryIndex < 0 || bestDistance > 0.35) {
    return primary;
  }

  const merged = [
    ...primary.slice(0, bestPrimaryIndex + 1),
    ...secondary.slice(bestSecondaryIndex + 1),
    ...secondary.slice(0, bestSecondaryIndex + 1),
    ...primary.slice(bestPrimaryIndex + 1)
  ];

  const deduped: Array<[number, number]> = [];
  for (const point of merged) {
    const last = deduped[deduped.length - 1];
    if (!last || Math.abs(last[0] - point[0]) > 1e-9 || Math.abs(last[1] - point[1]) > 1e-9) {
      deduped.push(point);
    }
  }

  return closeRing(deduped);
}

function buildMergedOuterBoundary(): Array<Vector3Tuple> {
  const rings: Array<Array<[number, number]>> = [];

  for (const feature of INDIA_BOUNDARY_GEOJSON.features) {
    const geometry = feature.geometry as any;

    if (geometry.type === "Polygon") {
      const ring = toRingArray(geometry);
      if (ring.length > 0) {
        rings.push(ring);
      }
    }

    if (geometry.type === "MultiPolygon") {
      for (const polygonCoordinates of geometry.coordinates ?? []) {
        const ring = Array.from((polygonCoordinates[0] ?? []) as readonly [number, number][]);
        if (ring.length > 0) {
          rings.push(ring);
        }
      }
    }
  }

  if (rings.length === 0) {
    return [];
  }

  let mergedBoundary = rings.reduce((largest, current) =>
    ringArea(current) > ringArea(largest) ? current : largest
  );

  for (const ring of rings) {
    if (ring === mergedBoundary) {
      continue;
    }

    mergedBoundary = mergeAdjacentRings(mergedBoundary, ring);
  }

  return mergedBoundary.map(([lon, lat]) => coordinateToGlobePoint(lon, lat, INDIA_GLOBE_RADIUS));
}

export function IndiaOutline({ focusProgress }: IndiaOutlineProps) {
  const highlightRef = useRef<Points<BufferGeometry, PointsMaterial>>(null);

  const outerBoundary = useMemo(() => buildMergedOuterBoundary(), []);

  const highlightGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(outerBoundary.flat(), 3)
    );
    return geometry;
  }, [outerBoundary]);

  useFrame(({ clock }) => {
    if (!highlightRef.current) {
      return;
    }

    const pulse = 0.9 + Math.sin(clock.elapsedTime * 1.7) * 0.12;
    const visibleProgress = Math.max(0.2, focusProgress);
    highlightRef.current.material.opacity = Math.min(1.2, visibleProgress * pulse);
  });

  const lineOpacity = Math.max(0.75, focusProgress * 1.2);

  if (outerBoundary.length === 0) {
    return null;
  }

  return (
    <group>
      <Line
        points={[...outerBoundary, outerBoundary[0]]}
        color="#f1f7ff"
        lineWidth={1.8}
        transparent
        opacity={lineOpacity}
        depthTest={false}
        depthWrite={false}
      />
      <Line
        points={[...outerBoundary, outerBoundary[0]]}
        color="#7de3ff"
        lineWidth={5.5}
        transparent
        opacity={Math.min(1, lineOpacity + 0.2)}
        depthTest={false}
        depthWrite={false}
      />
      <points ref={highlightRef} geometry={highlightGeometry}>
        <pointsMaterial
          color="#dffcff"
          size={0.032}
          transparent
          opacity={Math.max(0.5, lineOpacity)}
          depthWrite={false}
          depthTest={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
}
