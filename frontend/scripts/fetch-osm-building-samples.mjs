import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const cities = {
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  hyderabad: { lat: 17.385, lon: 78.4867 },
  pune: { lat: 18.5204, lon: 73.8567 },
  gurugram: { lat: 28.4595, lon: 77.0266 },
  delhi: { lat: 28.6139, lon: 77.209 }
};

const queryFor = ({ lat, lon }) =>
  `[out:json][timeout:25];way["building"](around:160,${lat},${lon});out tags geom 18;`;

const parseHeight = (tags, id) => {
  const height = Number.parseFloat(tags?.height ?? "");
  if (Number.isFinite(height) && height > 2) return Math.min(height, 120);
  const levels = Number.parseFloat(tags?.["building:levels"] ?? "");
  if (Number.isFinite(levels) && levels > 0) return Math.min(levels * 3.4, 120);
  return 9 + (id % 6) * 2.6;
};

const samples = {};
for (const [cityId, coordinates] of Object.entries(cities)) {
  try {
    const { stdout } = await execFileAsync("/usr/bin/curl", [
      "--max-time", "45", "--silent", "--show-error", "--get",
      "--data-urlencode", `data=${queryFor(coordinates)}`,
      "https://overpass-api.de/api/interpreter"
    ]);
    const payload = JSON.parse(stdout);
    samples[cityId] = (payload.elements ?? [])
    .filter((element) => element.geometry?.length >= 4)
    .map((element) => ({
      id: `osm-${element.id}`,
      footprint: element.geometry.slice(0, -1),
      latitude: element.geometry.slice(0, -1).reduce((sum, point) => sum + point.lat, 0) / (element.geometry.length - 1),
      longitude: element.geometry.slice(0, -1).reduce((sum, point) => sum + point.lon, 0) / (element.geometry.length - 1),
        height: parseHeight(element.tags, element.id)
      }));
  } catch {
    samples[cityId] = [];
  }
}

const source = `// OpenStreetMap building footprints fetched on 2026-08-31. ODbL data.\nimport type { BuildingData } from "@/lib/buildings";\n\nexport const OSM_BUILDING_SAMPLES: Record<string, BuildingData[]> = ${JSON.stringify(samples, null, 2)};\n`;
await writeFile(new URL("../src/lib/osmBuildingSamples.ts", import.meta.url), source);
