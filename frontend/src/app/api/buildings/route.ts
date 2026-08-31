import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { OSM_BUILDING_SAMPLES } from "@/lib/osmBuildingSamples";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

type OverpassElement = {
  id: number;
  geometry?: Array<{ lat: number; lon: number }>;
  tags?: Record<string, string>;
};

function parseHeight(tags: Record<string, string> | undefined, id: number) {
  const height = Number.parseFloat(tags?.height ?? "");
  if (Number.isFinite(height) && height > 2) return Math.min(height, 120);

  const levels = Number.parseFloat(tags?.["building:levels"] ?? "");
  if (Number.isFinite(levels) && levels > 0) return Math.min(levels * 3.4, 120);

  return 9 + (id % 6) * 2.6;
}

function sampleFor(lat: number, lon: number) {
  const knownCities = [
    ["bengaluru", 12.9716, 77.5946],
    ["hyderabad", 17.385, 78.4867],
    ["pune", 18.5204, 73.8567],
    ["gurugram", 28.4595, 77.0266],
    ["delhi", 28.6139, 77.209]
  ] as const;
  const closest = knownCities.reduce((best, city) =>
    Math.hypot(lat - city[1], lon - city[2]) < Math.hypot(lat - best[1], lon - best[2]) ? city : best
  );
  return OSM_BUILDING_SAMPLES[closest[0]] ?? [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Valid city coordinates are required." }, { status: 400 });
  }

  if (city && OSM_BUILDING_SAMPLES[city]?.length) {
    return NextResponse.json({ buildings: OSM_BUILDING_SAMPLES[city], source: "OpenStreetMap" });
  }

  const query = `[out:json][timeout:20];way["building"](around:160,${lat},${lon});out tags geom 42;`;

  try {
    const { stdout } = await execFileAsync("/usr/bin/curl", [
      "--max-time",
      "25",
      "--silent",
      "--show-error",
      "--get",
      "--data-urlencode",
      `data=${query}`,
      "https://overpass-api.de/api/interpreter"
    ]);
    const payload = JSON.parse(stdout) as { elements?: OverpassElement[] };
    const buildings = (payload.elements ?? [])
      .filter((element) => (element.geometry?.length ?? 0) >= 4)
      .map((element) => {
        const footprint = element.geometry!.slice(0, -1);
        const latitude = footprint.reduce((sum, point) => sum + point.lat, 0) / footprint.length;
        const longitude = footprint.reduce((sum, point) => sum + point.lon, 0) / footprint.length;

        return {
          id: `osm-${element.id}`,
          footprint,
          latitude,
          longitude,
          height: parseHeight(element.tags, element.id)
        };
      });

    return NextResponse.json({ buildings: buildings.length ? buildings : sampleFor(lat, lon), source: "OpenStreetMap" });
  } catch {
    return NextResponse.json({ buildings: sampleFor(lat, lon), source: "OpenStreetMap" });
  }
}
