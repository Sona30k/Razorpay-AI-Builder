import { readFile } from "node:fs/promises";

const cities = ["bengaluru", "hyderabad", "pune", "gurugram", "delhi"];
let invalid = false;

const validPoint = (point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lon) && Math.abs(point.lat) <= 90 && Math.abs(point.lon) <= 180;
const validPolygon = (points) => Array.isArray(points) && points.length >= 3 && points.every(validPoint);
const validLine = (points) => Array.isArray(points) && points.length >= 2 && points.every(validPoint);

for (const city of cities) {
  try {
    const data = JSON.parse(await readFile(new URL(`../public/city-data/${city}.json`, import.meta.url), "utf8"));
    const buildingsValid = Array.isArray(data.buildings) && data.buildings.length > 0 && data.buildings.every((building) => building.id && validPolygon(building.footprint));
    const roadsValid = Array.isArray(data.roads) && data.roads.length > 0 && data.roads.every((road) => road.id && road.highway && validLine(road.geometry));
    const parksValid = Array.isArray(data.parks) && data.parks.every((area) => area.id && validPolygon(area.polygon));
    const waterValid = Array.isArray(data.water) && data.water.every((area) => area.id && validPolygon(area.polygon));

    console.log(`City: ${data.city ?? city}`);
    console.log(`Buildings: ${data.buildings?.length ?? 0}`);
    console.log(`Roads: ${data.roads?.length ?? 0}`);
    console.log(`Parks: ${data.parks?.length ?? 0}`);
    console.log(`Water: ${data.water?.length ?? 0}`);

    if (!buildingsValid || !roadsValid || !parksValid || !waterValid) {
      console.error(`Invalid or incomplete city dataset: ${city}`);
      invalid = true;
    }
  } catch (error) {
    console.error(`Missing or unreadable city dataset: ${city}`, error.message);
    invalid = true;
  }
}

if (invalid) process.exit(1);
