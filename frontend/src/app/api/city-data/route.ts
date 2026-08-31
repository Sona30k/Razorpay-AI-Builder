import { readFile } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const cityIds = new Set(["bengaluru", "hyderabad", "pune", "gurugram", "delhi"]);

export async function GET(request: Request) {
  const city = new URL(request.url).searchParams.get("city");
  if (!city || !cityIds.has(city)) return NextResponse.json({ error: "Unknown city" }, { status: 400 });

  try {
    const file = path.join(process.cwd(), "public", "city-data", `${city}.json`);
    const raw = JSON.parse(await readFile(file, "utf8"));

    // If the static dataset is empty, attempt an on-the-fly Overpass fetch
    if ((raw.buildings?.length ?? 0) === 0 || (raw.roads?.length ?? 0) === 0) {
      try {
        const { latitude, longitude } = raw.center ?? { latitude: 0, longitude: 0 };
        const radius = 3000; // meters, matches city extraction radius
        const query = `[out:json][timeout:25];(way["building"](around:${radius},${latitude},${longitude});way["highway"](around:${radius},${latitude},${longitude});way["leisure"="park"](around:${radius},${latitude},${longitude});way["landuse"="grass"](around:${radius},${latitude},${longitude});way["natural"="water"](around:${radius},${latitude},${longitude}););out tags geom 42;`;

        const resp = await fetch("https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query), { method: "GET" });
        if (resp.ok) {
          const payload = await resp.json();
          const elements = payload.elements ?? [];

          const height = (tags: any, id: number) => Number.parseFloat(tags?.height) || Number.parseFloat(tags?.["building:levels"]) * 3.4 || 8 + (id % 7) * 2.5;

          const dataset = { city: raw.city, center: raw.center, buildings: [], roads: [], parks: [], water: [] } as any;

          for (const element of elements) {
            if (!element.geometry || !element.geometry.length) continue;
            if (element.tags?.building) {
              dataset.buildings.push({ id: `osm-${element.id}`, footprint: element.geometry.slice(0, -1), height: height(element.tags, element.id) });
            } else if (element.tags?.highway) {
              dataset.roads.push({ id: `osm-${element.id}`, highway: element.tags.highway, name: element.tags?.name ?? "", geometry: element.geometry });
            } else if (element.tags?.leisure === "park" || element.tags?.landuse === "grass" || element.tags?.natural === "water") {
              const bucket = element.tags?.natural === "water" ? "water" : "parks";
              dataset[bucket].push({ id: `osm-${element.id}`, kind: element.tags?.natural === "water" ? "water" : "park", polygon: element.geometry.slice(0, -1) });
            }
          }

          // Persist the enriched dataset back to disk so subsequent requests use the static file
          try {
            await writeFile(file, JSON.stringify(dataset));
            return NextResponse.json(dataset);
          } catch (err) {
            // return the dynamic dataset even if we couldn't persist it
            return NextResponse.json(dataset);
          }
        }
      } catch (err) {
        // fall through to return the static file below
      }
    }

    return NextResponse.json(raw);
  } catch {
    return NextResponse.json({ error: `City dataset unavailable: ${city}` }, { status: 404 });
  }
}
