"""Extract bounded static city datasets from a local OSM PBF file."""
import json
import math
import sys
from pathlib import Path

import osmium

CITIES = {
    "bengaluru": (12.9716, 77.5946),
    "hyderabad": (17.3850, 78.4867),
    "pune": (18.5204, 73.8567),
    "gurugram": (28.4595, 77.0266),
    "delhi": (28.6139, 77.2090),
}
RADIUS_KM = 3.0
ROAD_TYPES = {"motorway", "trunk", "primary", "secondary", "tertiary", "residential", "service"}
MAX_BUILDINGS = 1400
MAX_ROADS = 700

def height(tags, osm_id):
    try:
        return float(tags.get("height", "").replace("m", ""))
    except ValueError:
        try:
            return float(tags.get("building:levels", "")) * 3.4
        except ValueError:
            return 8.0 + (osm_id % 7) * 2.5

def point(node):
    return {"lat": round(node.location.lat, 6), "lon": round(node.location.lon, 6)}

class Extractor(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.data = {name: {"city": name, "center": {"latitude": lat, "longitude": lon}, "buildings": [], "roads": [], "parks": [], "water": []} for name, (lat, lon) in CITIES.items()}

    def cities_for(self, coords):
        if not coords:
            return []
        lat = sum(p["lat"] for p in coords) / len(coords)
        lon = sum(p["lon"] for p in coords) / len(coords)
        matches = []
        for name, (center_lat, center_lon) in CITIES.items():
            north_south = abs(lat - center_lat) * 111.0
            east_west = abs(lon - center_lon) * 111.0 * math.cos(math.radians(center_lat))
            if north_south <= RADIUS_KM and east_west <= RADIUS_KM:
                matches.append(name)
        return matches

    def way(self, way):
        tags = way.tags
        if not (tags.get("building") or tags.get("highway") in ROAD_TYPES or tags.get("leisure") in {"park", "garden", "recreation_ground"} or tags.get("landuse") in {"grass", "forest", "recreation_ground"} or tags.get("natural") == "water"):
            return
        try:
            coords = [point(node) for node in way.nodes]
        except osmium.InvalidLocationError:
            return
        for city in self.cities_for(coords):
            target = self.data[city]
            if tags.get("building") and len(coords) >= 4 and len(target["buildings"]) < MAX_BUILDINGS:
                target["buildings"].append({"id": f"osm-{way.id}", "footprint": coords[:-1] if coords[0] == coords[-1] else coords, "height": height(tags, way.id)})
            elif tags.get("highway") in ROAD_TYPES and len(coords) >= 2 and len(target["roads"]) < MAX_ROADS:
                target["roads"].append({"id": f"osm-{way.id}", "highway": tags["highway"], "name": tags.get("name", ""), "geometry": coords})
            elif len(coords) >= 4:
                bucket = "water" if tags.get("natural") == "water" else "parks"
                target[bucket].append({"id": f"osm-{way.id}", "kind": "water" if bucket == "water" else "park", "polygon": coords[:-1] if coords[0] == coords[-1] else coords})

if len(sys.argv) != 2:
    raise SystemExit("Usage: extract_city_data.py <india.osm.pbf>")

extractor = Extractor()
extractor.apply_file(sys.argv[1], locations=True)
output = Path(__file__).resolve().parent.parent / "public" / "city-data"
for city, dataset in extractor.data.items():
    (output / f"{city}.json").write_text(json.dumps(dataset, separators=(",", ":")))
    print(city, len(dataset["buildings"]), len(dataset["roads"]), len(dataset["parks"]), len(dataset["water"]))
