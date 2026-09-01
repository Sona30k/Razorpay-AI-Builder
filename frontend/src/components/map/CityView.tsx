"use client";

import { CompanyMarkers } from "@/components/map/CompanyMarkers";
import { ProceduralCity } from "@/components/map/ProceduralCity";
import type { City } from "@/lib/cities";
import type { Company } from "@/types/company";

type CityViewProps = { city: City; companies?: Company[]; onSelectCompany?: (company: Company | null) => void; selectedCompanyId?: string | null };

export function CityView({ city, companies = [], onSelectCompany, selectedCompanyId }: CityViewProps) {
  return <group>
    <ambientLight intensity={0.68} color="#c9def5" />
    <directionalLight position={[7, 10, 4]} intensity={2.1} color="#d9ecff" castShadow />
    <pointLight position={[-5, 6, -4]} intensity={12} distance={20} color="#287da5" />
    <fog attach="fog" args={["#05080d", 14, 48]} />
    <ProceduralCity city={city} />
    <CompanyMarkers companies={companies} latitude={city.lat} longitude={city.lon} onSelectCompany={onSelectCompany} selectedCompanyId={selectedCompanyId} />
  </group>;
}
