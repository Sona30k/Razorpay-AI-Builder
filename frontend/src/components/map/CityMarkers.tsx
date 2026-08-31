"use client";

import { CityMarker } from "@/components/map/CityMarker";
import { TECH_CITIES } from "@/lib/cities";

type CityMarkersProps = {
    selectedCityId: string | null;
    onSelectCity: (cityId: string) => void;
};

export function CityMarkers({ selectedCityId, onSelectCity }: CityMarkersProps) {
    return (
        <>
            {TECH_CITIES.map((city) => (
                <CityMarker
                    key={city.id}
                    city={city}
                    isSelected={selectedCityId === city.id}
                    onSelect={onSelectCity}
                />
            ))}
        </>
    );
}
