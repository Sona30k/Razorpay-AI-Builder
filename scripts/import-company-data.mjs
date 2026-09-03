#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function parseCSV(text) {
    const rows = [];
    let cur = [];
    let i = 0;
    let field = '';
    let inQuotes = false;
    while (i < text.length) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
                inQuotes = false;
                i++;
                continue;
            }
            field += ch;
            i++;
            continue;
        }
        if (ch === '"') { inQuotes = true; i++; continue; }
        if (ch === ',') { cur.push(field); field = ''; i++; continue; }
        if (ch === '\r') { i++; continue; }
        if (ch === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; i++; continue; }
        field += ch; i++;
    }
    // push last
    if (field !== '' || cur.length > 0) { cur.push(field); rows.push(cur); }
    return rows;
}

function slugify(s) {
    return s.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
}

const possibleSources = [
    path.resolve('data/companies/startups-india.csv'),
    path.resolve('data/companies/dataset.csv'),
    path.resolve('data/comapnies/dataset.csv'),
    path.resolve('data/comapnies/startups-india.csv')
];

let src = possibleSources.find(p => fs.existsSync(p));
if (!src) {
    console.error('No source CSV found. Looked in:', possibleSources.join(', '));
    process.exit(1);
}

const text = fs.readFileSync(src, 'utf8');
const rows = parseCSV(text);
if (rows.length < 1) { console.error('Empty CSV'); process.exit(1); }

// header
const headers = rows[0].map(h => (h || '').replace(/\uFEFF/g, '').trim());
const data = rows.slice(1).map(r => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) obj[headers[i]] = r[i] !== undefined ? r[i].trim() : '';
    return obj;
});

// detect fields
const hLower = headers.map(h => h.toLowerCase());
function findHeader(keys) {
    for (const k of keys) {
        const idx = hLower.findIndex(h => h.includes(k));
        if (idx >= 0) return headers[idx];
    }
    return null;
}

const hdrName = findHeader(['startup name', 'startup', 'name', 'company']);
const hdrCity = findHeader(['city', 'location', 'town']);
const hdrState = findHeader(['state', 'region', 'province']);
const hdrLat = findHeader(['latitude', 'lat']);
const hdrLon = findHeader(['longitude', 'lon', 'lng', 'long']);
const hdrSite = findHeader(['website', 'url', 'site', 'homepage']);
const hdrIndustry = findHeader(['industry', 'sector', 'vertical', 'category']);
const hdrDesc = findHeader(['description', 'about', 'summary', 'remarks']);
const hdrAddress = findHeader(['address', 'addr', 'location']);

const cityMap = {
    'bangalore': 'Bengaluru',
    'bengaluru': 'Bengaluru',
    'gurgaon': 'Gurugram',
    'gurugram': 'Gurugram',
    'new delhi': 'Delhi',
    'delhi': 'Delhi',
    'pune': 'Pune',
    'hyderabad': 'Hyderabad'
};

const keepCities = new Set(['Bengaluru', 'Hyderabad', 'Pune', 'Gurugram', 'Delhi']);
const enrichmentPath = path.resolve('data/companies/enrichment.json');
const enrichment = fs.existsSync(enrichmentPath) ? JSON.parse(fs.readFileSync(enrichmentPath, 'utf8')) : [];
if (!Array.isArray(enrichment)) throw new Error('data/companies/enrichment.json must be an array');
const enrichmentById = new Map(enrichment.filter((entry) => entry && typeof entry.id === 'string').map((entry) => [entry.id, entry]));

function normalizeCity(raw) {
    if (!raw) return null;
    const s = raw.toString().toLowerCase().trim();
    const cleaned = s.replace(/\s*\(.+\)$/, '').replace(/\./g, '');
    return cityMap[cleaned] ?? null;
}

// build records
const mapped = [];
let invalidCoords = 0;
for (const r of data) {
    const name = hdrName ? (r[hdrName] || '') : '';
    if (!name) continue;
    const rawCity = hdrCity ? (r[hdrCity] || '') : '';
    const city = normalizeCity(rawCity);
    if (!city || !keepCities.has(city)) continue;

    const rec = {
        id: null,
        name: name.trim(),
        city,
        state: hdrState ? (r[hdrState] || '').trim() : null,
        category: hdrIndustry ? (r[hdrIndustry] || '').trim() : null,
        description: hdrDesc ? (r[hdrDesc] || '').trim() : null,
        website: hdrSite ? (r[hdrSite] || '').trim() : null,
        address: hdrAddress ? (r[hdrAddress] || '').trim() : null,
        latitude: null,
        longitude: null,
        locationPrecision: 'city',
        // preserve original raw fields for future AI usage
        original: Object.fromEntries(Object.keys(r).map(k => [k, r[k]]))
    };

    // coordinates
    if (hdrLat && hdrLon) {
        const latv = (r[hdrLat] || '').trim();
        const lonv = (r[hdrLon] || '').trim();
        if (latv && lonv) {
            const latn = parseFloat(latv);
            const lonn = parseFloat(lonv);
            if (!Number.isFinite(latn) || !Number.isFinite(lonn) || latn < -90 || latn > 90 || lonn < -180 || lonn > 180) {
                invalidCoords++;
            } else {
                rec.latitude = latn;
                rec.longitude = lonn;
                rec.locationPrecision = 'exact';
            }
        }
    }

    // assign id as slug of name+city
    rec.id = slugify(rec.name + '-' + rec.city);
    mapped.push(rec);
}

// deduplicate using normalized name + city, keep most complete record
function normalizeNameForKey(s) {
    return (s || '').toString().toLowerCase().trim().replace(/[\W_]+/g, '');
}

const grouped = new Map();
for (const r of mapped) {
    const key = normalizeNameForKey(r.name) + '::' + r.city;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(r);
}

const deduped = [];
let duplicatesRemoved = 0;
for (const [key, items] of grouped.entries()) {
    if (items.length === 1) { deduped.push(items[0]); continue; }
    // pick item with most non-null fields
    items.sort((a, b) => {
        const sa = Object.values(a).filter(v => v !== null && v !== '').length;
        const sb = Object.values(b).filter(v => v !== null && v !== '').length;
        return sb - sa;
    });
    deduped.push(items[0]);
    duplicatesRemoved += items.length - 1;
}

let enriched = 0;
for (const company of deduped) {
    const entry = enrichmentById.get(company.id);
    if (!entry) continue;
    for (const key of ['website', 'logo', 'description']) {
        if (typeof entry[key] === 'string' && entry[key].trim()) company[key] = entry[key].trim();
    }
    enriched++;
}

// ensure output directory
const outDir = path.resolve('frontend/public/company-data');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'companies.json');
fs.writeFileSync(outPath, JSON.stringify(deduped, null, 2), 'utf8');

// write meta
const meta = {
    source: path.relative(process.cwd(), src),
    sourceRows: data.length,
    imported: deduped.length,
    duplicatesRemoved,
    invalidCoords,
    verifiedEnrichmentRecords: enriched
};
fs.writeFileSync(path.join(outDir, 'companies.meta.json'), JSON.stringify(meta, null, 2), 'utf8');

console.log('Imported', deduped.length, 'companies ->', outPath);
console.log('Duplicates removed:', duplicatesRemoved);
console.log('Invalid coordinates found:', invalidCoords);
console.log('Source CSV:', src);

process.exit(0);
