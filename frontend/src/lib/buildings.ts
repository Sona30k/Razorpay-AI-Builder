export type GeographicPoint = { lat: number; lon: number };

export type BuildingData = {
  id: string;
  footprint: GeographicPoint[];
  latitude: number;
  longitude: number;
  height: number;
};

export type CityBuildingResponse = { buildings: BuildingData[]; source: "OpenStreetMap" };

export type RoadData = { id: string; highway: string; geometry: GeographicPoint[] };
export type LanduseData = { id: string; kind: "park" | "green" | "water" | "open"; polygon: GeographicPoint[] };
export type CityDataset = {
  city: string;
  center: { latitude: number; longitude: number };
  buildings: BuildingData[];
  roads: RoadData[];
  parks: LanduseData[];
  water: LanduseData[];
};
