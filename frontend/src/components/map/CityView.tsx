"use client";

import { BuildingLayer } from "@/components/map/BuildingLayer";
import { CityBoundary } from "@/components/map/CityBoundary";
import { LanduseLayer } from "@/components/map/LanduseLayer";
import { RoadsLayer } from "@/components/map/RoadsLayer";
import { useEffect, useState } from "react";
import type { CityDataset } from "@/lib/buildings";
import type { City } from "@/lib/cities";

import { CompanyMarkers } from "@/components/map/CompanyMarkers";
import type { Company } from "@/types/company";

type CityViewProps = { city: City; companies?: Company[]; onSelectCompany?: (c: Company | null) => void; selectedCompanyId?: string | null };

export function CityView({ city, companies = [], onSelectCompany, selectedCompanyId }: CityViewProps) {
  const [dataset, setDataset] = useState<CityDataset | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/city-data?city=${city.id}`)
      .then((response) => response.ok ? response.json() as Promise<CityDataset> : Promise.reject())
      .then((data) => {
        if (active) setDataset(data);
      })
      .catch(() => console.warn(`City dataset unavailable: ${city.id}`));
    return () => { active = false; };
  }, [city.id]);

  useEffect(() => {
    let active = true;
    // keep original fetch diagnostic minimal (console.warn on failure only)
    return () => { active = false; };
  }, [dataset, city.name]);

  const center = dataset?.center ?? { latitude: city.lat, longitude: city.lon };
  return (
    <group>
      <ambientLight intensity={0.72} color="#d7e7ff" />
      <directionalLight position={[6, 10, 4]} intensity={2.55} color="#d9ecff" />
      <pointLight position={[-4, 5, -3]} intensity={16} distance={22} color="#4ca8d8" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} onPointerDown={() => onSelectCompany?.(null)}>
        <planeGeometry args={[18, 16]} />
        <meshStandardMaterial color="#0d1a26" roughness={0.92} metalness={0.18} />
      </mesh>
      <gridHelper args={[18, 18, "#28506d", "#183246"]} position={[0, 0.01, 0]} />
      <CityBoundary />
      {dataset ? <RoadsLayer roads={dataset.roads.slice(0, 320)} latitude={center.latitude} longitude={center.longitude} /> : null}
      {dataset ? <LanduseLayer areas={[...dataset.parks.slice(0, 120), ...dataset.water.slice(0, 40)]} latitude={center.latitude} longitude={center.longitude} /> : null}
      {dataset ? <BuildingLayer city={city} buildings={dataset.buildings.slice(0, 420)} /> : null}

      {/* Company markers render independently of building geometry availability. */}
      <CompanyMarkers
        companies={companies}
        latitude={center.latitude}
        longitude={center.longitude}
        onSelectCompany={onSelectCompany}
        selectedCompanyId={selectedCompanyId}
      />


    </group>
  );
}
