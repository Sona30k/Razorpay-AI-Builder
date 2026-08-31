#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const src = path.resolve('data/companies/startups-india.csv');
if (!fs.existsSync(src)) {
    console.error('Source CSV not found at', src);
    process.exit(1);
}

const text = fs.readFileSync(src, 'utf8');
// simple CSV parse: split lines, handle BOM
const lines = text.split(/\r?\n/).filter(Boolean);
if (lines.length < 1) { console.error('Empty CSV'); process.exit(1); }
const header = lines[0].replace(/\uFEFF/g, '').split(',').map(h => h.trim());
const rows = lines.slice(1).map(l => {
    const cols = l.split(',');
    const obj = {};
    for (let i = 0; i < header.length; i++) obj[header[i]] = cols[i] !== undefined ? cols[i].trim() : '';
    return obj;
});

const hLower = header.map(h => h.toLowerCase());
function find(keys) { for (const k of keys) { const idx = hLower.findIndex(h => h.includes(k)); if (idx >= 0) return header[idx]; } return null; }
const hdrName = find(['startup name', 'startup', 'name', 'company']);
const hdrCity = find(['city', 'location', 'town']);
const hdrLat = find(['latitude', 'lat']);
const hdrLon = find(['longitude', 'lon', 'lng', 'long']);

function normalizeCity(raw) { if (!raw) return null; const s = raw.toString().toLowerCase().trim().replace(/\s*\(.+\)$/, '').replace(/\./g, ''); if (s === 'bangalore') return 'Bengaluru'; if (s === 'bangaluru') return 'Bengaluru'; if (s === 'gurgaon') return 'Gurugram'; if (s === 'gurugram') return 'Gurugram'; if (s === 'new delhi') return 'Delhi'; if (s === 'delhi') return 'Delhi'; if (s === 'pune') return 'Pune'; if (s === 'hyderabad') return 'Hyderabad'; return null; }

const keep = new Set(['Bengaluru', 'Hyderabad', 'Pune', 'Gurugram', 'Delhi']);
let total = rows.length;
let inCities = 0;
let withCoords = 0;
let needGeocode = 0;

for (const r of rows) {
    const cityRaw = hdrCity ? r[hdrCity] : '';
    const city = normalizeCity(cityRaw);
    if (!city || !keep.has(city)) continue;
    inCities++;
    const latVal = hdrLat ? (r[hdrLat] || '').trim() : '';
    const lonVal = hdrLon ? (r[hdrLon] || '').trim() : '';
    const hasCoords = latVal && lonVal && !isNaN(parseFloat(latVal)) && !isNaN(parseFloat(lonVal));
    if (hasCoords) withCoords++; else needGeocode++;
}

console.log('Source CSV:', src);
console.log('Total source records:', total);
console.log('Records in target cities (Bengaluru, Hyderabad, Pune, Gurugram, Delhi):', inCities);
console.log('Records already having coordinates:', withCoords);
console.log('Records requiring geocoding:', needGeocode);

process.exit(0);
