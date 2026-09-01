"use client";

import { CompanyMarkers } from "@/components/map/CompanyMarkers";
import { ProceduralCity } from "@/components/map/ProceduralCity";
import type { City } from "@/lib/cities";
import type { Company } from "@/types/company";

type CityViewProps = { city: City; companies?: Company[]; onSelectCompany?: (company: Company | null) => void; selectedCompanyId?: string | null };

export function CityView({ city, companies = [], onSelectCompany, selectedCompanyId }: CityViewProps) {
  return <group>
    {/* stronger, cleaner lighting for city overview */}
    <ambientLight intensity={1.15} color="#f4f8fb" />
    <hemisphereLight args={["#ffffff", "#9eafb6", 0.64]} />
    <directionalLight position={[7, 10, 4]} intensity={2.05} color="#ffffff" castShadow />
    <directionalLight position={[-4, 6, -3]} intensity={0.55} color="#f5dfbf" />
    <pointLight position={[-5, 6, -4]} intensity={0.42} distance={20} color="#ffffff" />
    <fog attach="fog" args={["#b9ced9", 12, 36]} />
    <ProceduralCity city={city} />
    <CompanyMarkers companies={companies} latitude={city.lat} longitude={city.lon} onSelectCompany={onSelectCompany} selectedCompanyId={selectedCompanyId} />
  </group>;
}
