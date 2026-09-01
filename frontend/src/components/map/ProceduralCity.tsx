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
    // increase per-block grid slightly for denser city cores
    for (let gx = 0; gx < 4; gx += 1) for (let gz = 0; gz < 4; gz += 1) {
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
  const roofsRef = useRef<InstancedMesh>(null);
  const matrix = useMemo(() => new Matrix4(), []);
  const object = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    buildings.forEach((building, index) => {
      object.position.set(building.x, building.height / 2 + 0.06, building.z);
      object.scale.set(building.width, building.height, building.depth);
      object.updateMatrix(); buildingsRef.current?.setMatrixAt(index, object.matrix);
      // choose a light material tone for readability
      const toneColor = building.tone > 0.66 ? "#f8faf9" : building.tone > 0.33 ? "#dce5e4" : "#cbd7d8";
      buildingsRef.current?.setColorAt(index, new Color(toneColor));

      // windows: place a thin panel on a facade area (simple proxy)
      object.position.set(building.x, building.height * 0.57, building.z + building.depth / 2 + 0.008);
      object.scale.set(building.width * 0.72, Math.max(0.08, building.height * 0.64), 0.018);
      object.updateMatrix(); windowsRef.current?.setMatrixAt(index, object.matrix);

      // roof: thin cap on top of each building for visual separation
      object.position.set(building.x, building.height + 0.07, building.z);
      object.scale.set(building.width * 0.98, 0.02, building.depth * 0.98);
      object.updateMatrix(); roofsRef.current?.setMatrixAt(index, object.matrix);
    });
    if (buildingsRef.current) { buildingsRef.current.instanceMatrix.needsUpdate = true; if (buildingsRef.current.instanceColor) buildingsRef.current.instanceColor.needsUpdate = true; }
    if (windowsRef.current) windowsRef.current.instanceMatrix.needsUpdate = true;
    if (roofsRef.current) roofsRef.current.instanceMatrix.needsUpdate = true;
  }, [buildings, matrix, object]);
  return <>
    <instancedMesh ref={buildingsRef} args={[undefined, undefined, buildings.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors roughness={0.34} metalness={0.08} emissive="#b8c8cc" emissiveIntensity={0.32} />
    </instancedMesh>
    <instancedMesh ref={windowsRef} args={[undefined, undefined, buildings.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#7695a3" emissive="#dceff3" emissiveIntensity={0.22} transparent opacity={0.9} roughness={0.28} metalness={0.08} />
    </instancedMesh>
    <instancedMesh ref={roofsRef} args={[undefined, undefined, buildings.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#aebdc0" roughness={0.38} metalness={0.06} />
    </instancedMesh>
  </>;
}

function ParkInstances({ parks }: { parks: Park[] }) {
  const trees = useMemo(() => parks.flatMap((park, index) => Array.from({ length: park.water ? 0 : 11 }, (_, tree) => ({ x: park.x - 0.85 + (tree % 4) * 0.55 + ((index + tree) % 2) * 0.1, z: park.z - 0.7 + Math.floor(tree / 4) * 0.62, h: 0.22 + ((index + tree) % 3) * 0.07 }))), [parks]);
  const ref = useRef<InstancedMesh>(null); const object = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => { trees.forEach((tree, index) => { object.position.set(tree.x, tree.h / 2 + 0.035, tree.z); object.scale.set(0.13, tree.h, 0.13); object.updateMatrix(); ref.current?.setMatrixAt(index, object.matrix); }); if (ref.current) ref.current.instanceMatrix.needsUpdate = true; }, [object, trees]);
  return <group>{parks.map((park, index) => <mesh key={`${park.x}-${park.z}`} position={[park.x, 0.03, park.z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[park.width, park.depth]} /><meshStandardMaterial color={park.water ? "#2b9bd1" : "#2aa55a"} metalness={park.water ? 0.24 : 0.02} roughness={park.water ? 0.18 : 0.84} transparent opacity={park.water ? 0.9 : 0.98} /></mesh>)}{trees.length ? <instancedMesh ref={ref} args={[undefined, undefined, trees.length]}><coneGeometry args={[1, 1, 6]} /><meshStandardMaterial color="#2ea65d" roughness={0.6} metalness={0.02} /></instancedMesh> : null}</group>;
}

export function ProceduralCity({ city }: { city: City }) {
  const { buildings, parks, profile } = useMemo(() => createLayout(city), [city]);
  const roadPositions = [-6, -3, 0, 3, 6];
  return <group>
    {/* city ground: light blue-grey to separate from roads and parks */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[15, 15]} />
      <meshStandardMaterial color="#d4dedc" roughness={0.96} metalness={0.02} />
    </mesh>
    {roadPositions.map((position) => <group key={position}><mesh position={[position, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[profile.roadWidth, 15]} /><meshStandardMaterial color="#4b5560" roughness={0.82} /></mesh><mesh position={[0, 0.021, position]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[15, profile.roadWidth]} /><meshStandardMaterial color="#4b5560" roughness={0.82} /></mesh><mesh position={[position - profile.roadWidth / 2 - 0.035, 0.027, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.018, 15]} /><meshBasicMaterial color="#edf4f3" transparent opacity={0.52} /></mesh><mesh position={[0, 0.027, position - profile.roadWidth / 2 - 0.035]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[15, 0.018]} /><meshBasicMaterial color="#edf4f3" transparent opacity={0.52} /></mesh></group>)}
    {/* white lane markings: simple repeated segments for center lines */}
    {roadPositions.map((position) => (<group key={`marks-${position}`}>
      {Array.from({ length: 48 }).map((_, i) => {
        const t = -7.2 + i * 0.3;
        return <mesh key={i} position={[position, 0.029, t]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[profile.roadWidth * 0.08, 0.18]} />
          <meshStandardMaterial color="#ffffff" roughness={0.45} metalness={0.03} emissive="#ffffff" emissiveIntensity={0.05} />
        </mesh>;
      })}
      {Array.from({ length: 48 }).map((_, i) => {
        const t = -7.2 + i * 0.3;
        return <mesh key={`v-${i}`} position={[t, 0.029, position]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.18, profile.roadWidth * 0.08]} />
          <meshStandardMaterial color="#ffffff" roughness={0.45} metalness={0.03} emissive="#ffffff" emissiveIntensity={0.05} />
        </mesh>;
      })}
    </group>))}
    <ParkInstances parks={parks} />
    <BuildingInstances buildings={buildings} />
  </group>;
}
