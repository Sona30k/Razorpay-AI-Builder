"use client";

import { Building } from "@/components/map/Building";
import { useEffect, useState } from "react";
import type { BuildingData } from "@/lib/buildings";
import type { City } from "@/lib/cities";

type BuildingLayerProps = { city: City; buildings: BuildingData[] };

export function BuildingLayer({ city, buildings }: BuildingLayerProps) {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  useEffect(() => setSelectedBuildingId(null), [city.id]);

  return (
    <group>
      {buildings.map((building) => (
        <Building
          key={building.id}
          building={building}
          cityLatitude={city.lat}
          cityLongitude={city.lon}
          selected={selectedBuildingId === building.id}
          onSelect={setSelectedBuildingId}
        />
      ))}
    </group>
  );
}
