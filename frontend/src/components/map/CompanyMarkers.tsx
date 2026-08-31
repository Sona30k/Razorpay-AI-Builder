"use client";

import { Html } from "@react-three/drei";
import { useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Company } from "@/types/company";
import { isNearCity, type MappableCompany } from "@/lib/companies";

type Props = {
  companies: Company[];
  latitude: number;
  longitude: number;
  onSelectCompany?: (company: Company | null) => void;
  selectedCompanyId?: string | null;
};

const METERS_TO_SCENE = 0.014;

function toLocalPoint(company: MappableCompany, cityLatitude: number, cityLongitude: number) {
  const metersPerLongitude = 111_320 * Math.cos((cityLatitude * Math.PI) / 180);
  return {
    x: (company.longitude - cityLongitude) * metersPerLongitude * METERS_TO_SCENE,
    z: -(company.latitude - cityLatitude) * 110_540 * METERS_TO_SCENE
  };
}

export function CompanyMarkers({ companies, latitude, longitude, onSelectCompany, selectedCompanyId }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const mappable = useMemo(
    () => companies.filter((company) => isNearCity(company, latitude, longitude)),
    [companies, latitude, longitude]
  );
  const positions = useMemo(() => {
    const values = new Float32Array(mappable.length * 3);
    mappable.forEach((company, index) => {
      const point = toLocalPoint(company, latitude, longitude);
      values[index * 3] = point.x;
      values[index * 3 + 1] = 0.105;
      values[index * 3 + 2] = point.z;
    });
    return values;
  }, [latitude, longitude, mappable]);

  const selectedCompany = mappable.find((company) => company.id === selectedCompanyId) ?? null;
  const hoveredCompany = hoveredIndex === null ? null : mappable[hoveredIndex] ?? null;
  const labelCompany = selectedCompany ?? hoveredCompany;
  const labelPoint = labelCompany ? toLocalPoint(labelCompany, latitude, longitude) : null;

  const companyAtEvent = (event: ThreeEvent<MouseEvent | PointerEvent>) => {
    const index = event.index;
    return typeof index === "number" ? mappable[index] ?? null : null;
  };

  if (mappable.length === 0) return null;

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

      {selectedCompany && labelPoint ? (
        <mesh position={[labelPoint.x, 0.11, labelPoint.z]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#d7f5ff" transparent opacity={0.96} />
        </mesh>
      ) : null}

      {labelCompany && labelPoint ? (
        <Html center position={[labelPoint.x, 0.22, labelPoint.z]} style={{ pointerEvents: "auto" }}>
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
