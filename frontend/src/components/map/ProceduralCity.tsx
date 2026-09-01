"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, InstancedMesh, Matrix4, Object3D } from "three";
import type { City } from "@/lib/cities";

type Building = { x: number; z: number; width: number; depth: number; height: number; tone: number };
type Park = { x: number; z: number; width: number; depth: number; water?: boolean };

const profiles: Record<string, { seed: number; density: number; towerRate: number; roadWidth: number; parkBlocks: number[]; waterBlock?: number }> = {
  bengaluru: { seed: 101, density: 0.94, towerRate: 0.22, roadWidth: 0.34, parkBlocks: [2, 9], waterBlock: 13 },
  hyderabad: { seed: 202, density: 0.78, towerRate: 0.2, roadWidth: 0.46, parkBlocks: [1, 10], waterBlock: 14 },
  pune: { seed: 303, density: 0.82, towerRate: 0.12, roadWidth: 0.36, parkBlocks: [5, 12], waterBlock: 3 },
  gurugram: { seed: 404, density: 0.9, towerRate: 0.3, roadWidth: 0.52, parkBlocks: [6, 11], waterBlock: 0 },
  delhi: { seed: 505, density: 0.96, towerRate: 0.17, roadWidth: 0.42, parkBlocks: [7, 14], waterBlock: 4 },
};

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}

function createLayout(city: City) {
  const profile = profiles[city.id] ?? profiles.bengaluru;
  const random = seeded(profile.seed);
  const buildings: Building[] = [];
  const parks: Park[] = [];
  const centers = [-4.5, -1.5, 1.5, 4.5];
  centers.forEach((x, row) => centers.forEach((z, column) => {
    const blockIndex = row * 4 + column;
    if (profile.parkBlocks.includes(blockIndex) || profile.waterBlock === blockIndex) {
      parks.push({ x, z, width: 2.3, depth: 2.3, water: profile.waterBlock === blockIndex });
      return;
    }
    const isDistrict = (row + column) % 2 === 0;
    for (let gx = 0; gx < 3; gx += 1) for (let gz = 0; gz < 3; gz += 1) {
      if (random() > profile.density) continue;
      const tower = random() < profile.towerRate * (isDistrict ? 1.35 : 0.55);
      buildings.push({
        x: x - 0.72 + gx * 0.72 + (random() - 0.5) * 0.08,
        z: z - 0.72 + gz * 0.72 + (random() - 0.5) * 0.08,
        width: 0.38 + random() * 0.25,
        depth: 0.38 + random() * 0.25,
        height: tower ? 2.25 + random() * 2.35 : 0.45 + random() * (isDistrict ? 1.45 : 1.0),
        tone: random(),
      });
    }
  }));
  return { buildings, parks, profile };
}

function BuildingInstances({ buildings }: { buildings: Building[] }) {
  const buildingsRef = useRef<InstancedMesh>(null);
  const windowsRef = useRef<InstancedMesh>(null);
  const matrix = useMemo(() => new Matrix4(), []);
  const object = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    buildings.forEach((building, index) => {
      object.position.set(building.x, building.height / 2 + 0.06, building.z);
      object.scale.set(building.width, building.height, building.depth);
      object.updateMatrix(); buildingsRef.current?.setMatrixAt(index, object.matrix);
      buildingsRef.current?.setColorAt(index, new Color(building.tone > 0.66 ? "#254d66" : building.tone > 0.33 ? "#1f394e" : "#193043"));
      object.position.set(building.x, building.height * 0.57, building.z + building.depth / 2 + 0.008);
      object.scale.set(building.width * 0.72, Math.max(0.08, building.height * 0.64), 0.018);
      object.updateMatrix(); windowsRef.current?.setMatrixAt(index, object.matrix);
    });
    if (buildingsRef.current) { buildingsRef.current.instanceMatrix.needsUpdate = true; if (buildingsRef.current.instanceColor) buildingsRef.current.instanceColor.needsUpdate = true; }
    if (windowsRef.current) windowsRef.current.instanceMatrix.needsUpdate = true;
  }, [buildings, matrix, object]);
  return <><instancedMesh ref={buildingsRef} args={[undefined, undefined, buildings.length]} castShadow receiveShadow><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial vertexColors roughness={0.4} metalness={0.72} emissive="#0b2535" emissiveIntensity={0.48} /></instancedMesh><instancedMesh ref={windowsRef} args={[undefined, undefined, buildings.length]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#b8ddff" transparent opacity={0.22} /></instancedMesh></>;
}

function ParkInstances({ parks }: { parks: Park[] }) {
  const trees = useMemo(() => parks.flatMap((park, index) => Array.from({ length: park.water ? 0 : 11 }, (_, tree) => ({ x: park.x - 0.85 + (tree % 4) * 0.55 + ((index + tree) % 2) * 0.1, z: park.z - 0.7 + Math.floor(tree / 4) * 0.62, h: 0.22 + ((index + tree) % 3) * 0.07 }))), [parks]);
  const ref = useRef<InstancedMesh>(null); const object = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => { trees.forEach((tree, index) => { object.position.set(tree.x, tree.h / 2 + 0.035, tree.z); object.scale.set(0.13, tree.h, 0.13); object.updateMatrix(); ref.current?.setMatrixAt(index, object.matrix); }); if (ref.current) ref.current.instanceMatrix.needsUpdate = true; }, [object, trees]);
  return <group>{parks.map((park, index) => <mesh key={`${park.x}-${park.z}`} position={[park.x, 0.03, park.z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[park.width, park.depth]} /><meshStandardMaterial color={park.water ? "#164d72" : "#1b5847"} metalness={park.water ? 0.72 : 0.05} roughness={park.water ? 0.22 : 0.94} transparent opacity={park.water ? 0.8 : 0.92} /></mesh>)}{trees.length ? <instancedMesh ref={ref} args={[undefined, undefined, trees.length]}><coneGeometry args={[1, 1, 6]} /><meshStandardMaterial color="#245f49" roughness={0.95} /></instancedMesh> : null}</group>;
}

export function ProceduralCity({ city }: { city: City }) {
  const { buildings, parks, profile } = useMemo(() => createLayout(city), [city]);
  const roadPositions = [-6, -3, 0, 3, 6];
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[15, 15]} /><meshStandardMaterial color="#091521" roughness={0.9} metalness={0.2} /></mesh>
    {roadPositions.map((position) => <group key={position}><mesh position={[position, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[profile.roadWidth, 15]} /><meshStandardMaterial color="#172838" roughness={0.82} /></mesh><mesh position={[0, 0.021, position]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[15, profile.roadWidth]} /><meshStandardMaterial color="#172838" roughness={0.82} /></mesh><mesh position={[position - profile.roadWidth / 2 - 0.035, 0.027, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.018, 15]} /><meshBasicMaterial color="#4fb7d8" transparent opacity={0.58} /></mesh><mesh position={[0, 0.027, position - profile.roadWidth / 2 - 0.035]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[15, 0.018]} /><meshBasicMaterial color="#4fb7d8" transparent opacity={0.58} /></mesh></group>)}
    <ParkInstances parks={parks} /><BuildingInstances buildings={buildings} />
  </group>;
}
