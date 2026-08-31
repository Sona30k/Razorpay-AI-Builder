// Convert a downloaded Overpass JSON response to a static city dataset.
// Usage: node scripts/prepare-city-data.mjs <city> <input.json>
import { readFile, writeFile } from "node:fs/promises";

const [city, input] = process.argv.slice(2);
if (!city || !input) throw new Error("Usage: node scripts/prepare-city-data.mjs <city> <input.json>");
const source = JSON.parse(await readFile(input, "utf8"));
const center = { bengaluru: [12.9716, 77.5946], hyderabad: [17.385, 78.4867], pune: [18.5204, 73.8567], gurugram: [28.4595, 77.0266], delhi: [28.6139, 77.209] }[city];
if (!center) throw new Error(`Unknown city: ${city}`);
const height = (tags, id) => Number.parseFloat(tags?.height) || Number.parseFloat(tags?.["building:levels"]) * 3.4 || 9 + (id % 6) * 2.6;
const dataset = { city, center: { latitude: center[0], longitude: center[1] }, buildings: [], roads: [], parks: [], water: [] };
for (const element of source.elements ?? []) {
  if (!element.geometry?.length) continue;
  if (element.tags?.building) dataset.buildings.push({ id: `osm-${element.id}`, footprint: element.geometry.slice(0, -1), height: height(element.tags, element.id) });
  else if (element.tags?.highway) dataset.roads.push({ id: `osm-${element.id}`, highway: element.tags.highway, geometry: element.geometry });
  else if (element.tags?.leisure === "park" || element.tags?.landuse === "grass" || element.tags?.natural === "water") (element.tags?.natural === "water" ? dataset.water : dataset.parks).push({ id: `osm-${element.id}`, kind: element.tags?.natural === "water" ? "water" : "park", polygon: element.geometry.slice(0, -1) });
}
await writeFile(new URL(`../public/city-data/${city}.json`, import.meta.url), `${JSON.stringify(dataset)}\n`);
