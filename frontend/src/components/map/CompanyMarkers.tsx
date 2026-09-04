"use client";

import { Html } from "@react-three/drei";
import { useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Company } from "@/types/company";
import { hasUsableCoordinates, isNearCity, type MappableCompany } from "@/lib/companies";
import { fundingAmount } from "@/lib/investor";

type Props = {
  companies: Company[];
  latitude: number;
  longitude: number;
  onSelectCompany?: (company: Company | null) => void;
  selectedCompanyId?: string | null;
};

const METERS_TO_SCENE = 0.0016;

type PositionedCompany = {
  company: MappableCompany;
  point: { x: number; z: number };
};

function toLocalPoint(company: MappableCompany, cityLatitude: number, cityLongitude: number) {
  const metersPerLongitude = 111_320 * Math.cos((cityLatitude * Math.PI) / 180);
  return {
    x: (company.longitude - cityLongitude) * metersPerLongitude * METERS_TO_SCENE,
    z: -(company.latitude - cityLatitude) * 110_540 * METERS_TO_SCENE
  };
}

function fallbackPoint(index: number) {
  const angle = (index * 137.5 * Math.PI) / 180;
  const radius = 0.7 + (index % 6) * 0.36;
  return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
}

export function CompanyMarkers({ companies, latitude, longitude, onSelectCompany, selectedCompanyId }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const positioned = useMemo<PositionedCompany[]>(() => companies
    .filter(hasUsableCoordinates)
    .map((company, index) => ({
      company,
      // Some city-level source records carry an India-level default coordinate.
      // Keep those companies visible at the city level rather than placing them outside the camera.
      point: isNearCity(company, latitude, longitude)
        ? toLocalPoint(company, latitude, longitude)
        : fallbackPoint(index)
    })), [companies, latitude, longitude]);
  const positions = useMemo(() => {
    const values = new Float32Array(positioned.length * 3);
    positioned.forEach(({ point }, index) => {
      values[index * 3] = point.x;
      values[index * 3 + 1] = 0.105;
      values[index * 3 + 2] = point.z;
    });
    return values;
  }, [positioned]);

  const selected = positioned.find(({ company }) => company.id === selectedCompanyId) ?? null;
  const featured = useMemo(() => {
    const placed: { x: number; z: number }[] = [];
    return positioned.slice().sort((a, b) => (fundingAmount(b.company) ?? -1) - (fundingAmount(a.company) ?? -1) || a.company.name.localeCompare(b.company.name)).slice(0, 30).map(({ company, point }, index) => {
      let label = { x: point.x, z: point.z };
      for (let step = 0; step < 80; step += 1) {
        const angle = ((index * 137.5 + step * 47) * Math.PI) / 180;
        const radius = 1.2 + Math.floor(step / 8) * 0.85;
        const candidate = { x: point.x + Math.cos(angle) * radius, z: point.z + Math.sin(angle) * radius };
        if (placed.every((other) => Math.hypot(candidate.x - other.x, candidate.z - other.z) > 2.8)) { label = candidate; break; }
      }
      placed.push(label); return { company, point, label, index };
    });
  }, [positioned]);
  const hovered = hoveredIndex === null ? null : positioned[hoveredIndex] ?? null;
  const labelCompany = selected?.company ?? hovered?.company ?? null;
  const labelPoint = selected?.point ?? hovered?.point ?? null;

  const companyAtEvent = (event: ThreeEvent<MouseEvent | PointerEvent>) => {
    const index = event.index;
    return typeof index === "number" ? positioned[index]?.company ?? null : null;
  };

  if (positioned.length === 0) return null;

  return (
    <group>
      <points
        frustumCulled={false}
        onClick={(event) => {
          const company = companyAtEvent(event);
          if (!company) return;
          event.stopPropagation();
          onSelectCompany?.(company);
        }}
        onPointerMove={(event) => {
          const company = companyAtEvent(event);
          if (!company) return;
          event.stopPropagation();
          setHoveredIndex(event.index ?? null);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHoveredIndex(null);
          document.body.style.cursor = "default";
        }}
      >
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#5ed7ff" size={5} sizeAttenuation={false} transparent opacity={0.96} depthWrite={false} depthTest={false} />
      </points>

      {!selected && featured.map(({ company, point, label, index }) => {
        const isSelected = company.id === selectedCompanyId;
        return <group key={company.id} position={[point.x, 0.12, point.z]}>
          <Html center position={[label.x - point.x, 0.2 + (index % 4) * 0.04, label.z - point.z]} style={{ pointerEvents: "auto" }}>
            <button type="button" onClick={(event) => { event.stopPropagation(); onSelectCompany?.(company); }} className={`group flex max-w-44 items-center gap-1.5 rounded-md border bg-white px-1.5 py-1 text-left shadow-[0_5px_14px_rgba(0,0,0,.32)] transition hover:scale-[1.04] ${isSelected ? "border-sky-400 ring-2 ring-sky-300/40" : "border-slate-200"}`}>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[9px] font-bold text-sky-700">{company.name.split(/\s+/).slice(0,2).map((part) => part[0]).join("")}</span>
              <span className="min-w-0"><span className="block truncate text-[11px] font-semibold text-slate-800">{company.name}</span><span className="block truncate text-[9px] text-slate-500">{company.industry ?? company.category ?? ""}</span></span>
            </button>
          </Html>
        </group>;
      })}

      {selected && labelPoint ? (
        <mesh position={[labelPoint.x, 0.11, labelPoint.z]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#d7f5ff" transparent opacity={0.96} />
        </mesh>
      ) : null}

      {labelCompany && labelPoint ? (
        <Html center position={[labelPoint.x, 0.22, labelPoint.z]} zIndexRange={[0, 0]} style={{ pointerEvents: "auto" }}>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelectCompany?.(labelCompany);
            }}
            className="inline-flex max-w-48 items-center gap-1.5 rounded-md border border-sky-200/15 bg-slate-950/85 px-2 py-1 text-left text-xs font-medium text-white shadow-[0_6px_16px_rgba(0,0,0,0.42)] backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
            <span className="truncate">{labelCompany.name}</span>
          </button>
        </Html>
      ) : null}
    </group>
  );
}
