"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, Points, ShapeUtils, Vector2, Vector3 } from "three";
import { GLOBE_RADIUS, INDIA_FOCUS_GROUP_ROTATION_Y, latLonToSphereVector } from "@/lib/constants";

type Position = [number, number];
type Geometry = { type: "Polygon" | "MultiPolygon"; coordinates: Position[][] | Position[][][] };
type FeatureCollection = { features: Array<{ geometry: Geometry | null }> };
type GlobeProps = { children?: ReactNode; isFocusingIndia: boolean };

function pointAt([longitude, latitude]: Position, radius: number) {
  const point = latLonToSphereVector(latitude, longitude, radius);
  return [point.x, point.y, point.z];
}

function polygons(geometry: Geometry) {
  return geometry.type === "Polygon" ? [geometry.coordinates as Position[][]] : geometry.coordinates as Position[][][];
}

function closeRemoved(ring: Position[]) {
  return ring.length > 2 && ring[0][0] === ring.at(-1)?.[0] && ring[0][1] === ring.at(-1)?.[1] ? ring.slice(0, -1) : ring;
}

function unwrapRing(ring: Position[], referenceLongitude?: number) {
  const result: Position[] = [];
  let previous = referenceLongitude;
  for (const [longitude, latitude] of closeRemoved(ring)) {
    let unwrapped = longitude;
    if (previous !== undefined) while (unwrapped - previous > 180) unwrapped -= 360;
    if (previous !== undefined) while (unwrapped - previous < -180) unwrapped += 360;
    result.push([unwrapped, latitude]);
    previous = unwrapped;
  }
  return result;
}

function surfaceVector(position: Position) {
  const [x, y, z] = pointAt(position, GLOBE_RADIUS + 0.012);
  return new Vector3(x, y, z);
}

function midpoint(a: Vector3, b: Vector3) {
  return a.clone().add(b).normalize().multiplyScalar(GLOBE_RADIUS + 0.012);
}

function addSurfaceTriangle(vertices: number[], a: Vector3, b: Vector3, c: Vector3, depth = 2): void {
  if (depth === 0) {
    vertices.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    return;
  }
  const ab = midpoint(a, b);
  const bc = midpoint(b, c);
  const ca = midpoint(c, a);
  addSurfaceTriangle(vertices, a, ab, ca, depth - 1);
  addSurfaceTriangle(vertices, ab, b, bc, depth - 1);
  addSurfaceTriangle(vertices, ca, bc, c, depth - 1);
  addSurfaceTriangle(vertices, ab, bc, ca, depth - 1);
}

function createLandGeometry(data: FeatureCollection) {
  const vertices: number[] = [];
  for (const feature of data.features) {
    if (!feature.geometry) continue;
    for (const polygon of polygons(feature.geometry)) {
      const outer = unwrapRing(polygon[0] ?? []);
      if (outer.length < 3) continue;
      const holes = polygon.slice(1).map((ring) => unwrapRing(ring, outer[0][0])).filter((ring) => ring.length > 2);
      const contour = outer.map(([longitude, latitude]) => new Vector2(longitude, latitude));
      const holePoints = holes.map((ring) => ring.map(([longitude, latitude]) => new Vector2(longitude, latitude)));
      const allPoints = [outer, ...holes].flat();
      for (const [a, b, c] of ShapeUtils.triangulateShape(contour, holePoints)) addSurfaceTriangle(vertices, surfaceVector(allPoints[a]), surfaceVector(allPoints[b]), surfaceVector(allPoints[c]));
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function createBorderGeometry(data: FeatureCollection) {
  const vertices: number[] = [];
  for (const feature of data.features) {
    if (!feature.geometry) continue;
    for (const polygon of polygons(feature.geometry)) for (const ring of polygon) for (let index = 1; index < ring.length; index += 1) vertices.push(...pointAt(ring[index - 1], GLOBE_RADIUS + 0.021), ...pointAt(ring[index], GLOBE_RADIUS + 0.021));
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  return geometry;
}

export function Globe({ children, isFocusingIndia }: GlobeProps) {
  const groupRef = useRef<Group>(null);
  const atmosphereRef = useRef<Mesh>(null);
  const pointsRef = useRef<Points>(null);
  const [geography, setGeography] = useState<FeatureCollection | null>(null);
  useEffect(() => { fetch("/geodata/natural-earth-countries.geojson").then((response) => response.ok ? response.json() : null).then((data: FeatureCollection | null) => setGeography(data)).catch(() => setGeography(null)); }, []);
  const landGeometry = useMemo(() => geography ? createLandGeometry(geography) : null, [geography]);
  const borderGeometry = useMemo(() => geography ? createBorderGeometry(geography) : null, [geography]);
  useFrame((_, delta) => { if (groupRef.current && !isFocusingIndia) groupRef.current.rotation.y += delta * 0.055; if (atmosphereRef.current && !isFocusingIndia) atmosphereRef.current.rotation.y -= delta * 0.018; if (pointsRef.current && !isFocusingIndia) pointsRef.current.rotation.y += delta * 0.012; });
  return <group ref={groupRef} rotation={[-0.12, INDIA_FOCUS_GROUP_ROTATION_Y, 0]} position={[0, -0.14, 0]}>
    <mesh><sphereGeometry args={[GLOBE_RADIUS, 96, 64]} /><meshStandardMaterial color="#3bb6db" roughness={0.64} metalness={0.04} emissive="#218fb9" emissiveIntensity={0.12} /></mesh>
    {landGeometry ? <mesh geometry={landGeometry}><meshStandardMaterial color="#9dca73" roughness={0.88} metalness={0} side={DoubleSide} /></mesh> : null}
    {borderGeometry ? <lineSegments geometry={borderGeometry}><lineBasicMaterial color="#5f864f" transparent opacity={0.42} /></lineSegments> : null}
    <mesh ref={atmosphereRef} scale={1.025}><sphereGeometry args={[GLOBE_RADIUS, 72, 72]} /><meshBasicMaterial color="#e4f9ff" transparent opacity={0.16} /></mesh>
    <points ref={pointsRef}><sphereGeometry args={[GLOBE_RADIUS + 0.08, 34, 34]} /><pointsMaterial color="#ffffff" size={0.0068} transparent opacity={0.1} /></points>
    {children}
  </group>;
}
