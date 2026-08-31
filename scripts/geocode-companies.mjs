#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { setTimeout as wait } from 'timers/promises';

let OPENCAGE_KEY = process.env.OPENCAGE_API_KEY || null;
let GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || null;
// fallback: try to read .env.local if present (do not commit keys to frontend)
try {
    const envPath = path.resolve('.env.local');
    if ((!OPENCAGE_KEY || !GOOGLE_KEY) && fs.existsSync(envPath)) {
        const envText = fs.readFileSync(envPath, 'utf8');
        for (const line of envText.split(/\r?\n/)) {
            const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
            if (!m) continue;
            const k = m[1];
            let v = m[2] || '';
            // strip surrounding quotes
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
            if (!OPENCAGE_KEY && k === 'OPENCAGE_API_KEY') OPENCAGE_KEY = v;
            if (!GOOGLE_KEY && (k === 'GOOGLE_MAPS_API_KEY' || k === 'GOOGLE_API_KEY')) GOOGLE_KEY = v;
        }
    }
} catch (e) {
    // ignore
}
const DELAY_MS = parseInt(process.env.GEOCODER_DELAY_MS || '1100', 10); // default ~1.1s

if (!OPENCAGE_KEY && !GOOGLE_KEY) {
    console.error('No geocoding API key found. Set OPENCAGE_API_KEY or GOOGLE_MAPS_API_KEY in the environment.');
    process.exit(1);
}

const companiesPath = path.resolve('frontend/public/company-data/companies.json');
if (!fs.existsSync(companiesPath)) { console.error('companies.json not found at', companiesPath); process.exit(1); }
const companies = JSON.parse(fs.readFileSync(companiesPath, 'utf8'));

const cachePath = path.resolve('data/companies/geocoding-cache.json');
let cache = {};
if (fs.existsSync(cachePath)) {
    try { cache = JSON.parse(fs.readFileSync(cachePath, 'utf8')); } catch (e) { cache = {}; }
}

function cacheKey(c) {
    return (c.name || '').toString().toLowerCase().trim().replace(/\s+/g, ' ') + '||' + (c.address || '') + '||' + (c.city || '');
}

function inIndia(lat, lon) {
    if (typeof lat !== 'number' || typeof lon !== 'number') return false;
    return lat >= 6 && lat <= 38 && lon >= 68 && lon <= 98;
}

async function geocodeQuery(query) {
    const q = encodeURIComponent(query);
    if (OPENCAGE_KEY) {
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${q}&key=${OPENCAGE_KEY}&countrycode=in&limit=3&no_annotations=1`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('OpenCage error ' + res.status);
        const body = await res.json();
        return { provider: 'opencage', body };
    }
    if (GOOGLE_KEY) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${GOOGLE_KEY}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Google error ' + res.status);
        const body = await res.json();
        return { provider: 'google', body };
    }
    throw new Error('No provider');
}

async function run() {
    let updated = false;
    let geocodedCount = 0;
    for (const c of companies) {
        if (c.latitude !== null && c.longitude !== null) continue; // already have coordinates
        const key = cacheKey(c);
        if (cache[key]) {
            const entry = cache[key];
            if (entry && entry.latitude && entry.longitude) {
                c.latitude = entry.latitude; c.longitude = entry.longitude; c.locationPrecision = entry.locationPrecision || 'exact';
                continue;
            }
            // previously attempted but failed
            continue;
        }

        // require name + city
        if (!c.name || !c.city) { cache[key] = { status: 'no-query' }; continue; }
        // form query: name + address + city + India
        const parts = [c.name, c.address || '', c.city, 'India'].filter(Boolean);
        const query = parts.join(', ');

        try {
            console.log('Geocoding:', c.name, '->', query);
            const { provider, body } = await geocodeQuery(query);
            let lat = null, lon = null, score = 0, country = null;
            if (provider === 'opencage') {
                if (body && Array.isArray(body.results) && body.results.length > 0) {
                    const r = body.results[0];
                    lat = r.geometry.lat; lon = r.geometry.lng;
                    score = r.confidence || 0;
                    country = r.components && r.components.country_code ? r.components.country_code.toUpperCase() : null;
                }
            } else if (provider === 'google') {
                if (body && Array.isArray(body.results) && body.results.length > 0) {
                    const r = body.results[0];
                    lat = r.geometry.location.lat; lon = r.geometry.location.lng;
                    // try to extract country code
                    const comp = r.address_components || [];
                    const cc = comp.find(x => x.types && x.types.includes('country'));
                    country = cc ? (cc.short_name || cc.long_name) : null;
                    score = 0;
                }
            }

            if (lat !== null && lon !== null && inIndia(lat, lon) && (country === null || country === 'IN' || country === 'India')) {
                c.latitude = lat; c.longitude = lon; c.locationPrecision = 'exact';
                cache[key] = { latitude: lat, longitude: lon, locationPrecision: 'exact', provider: provider };
                geocodedCount++;
                updated = true;
            } else {
                console.log('Rejected geocode (not India or invalid):', lat, lon, country);
                cache[key] = { status: 'rejected', provider: provider, raw: body };
            }

        } catch (err) {
            console.error('Geocode error for', c.name, err.message);
            cache[key] = { status: 'error', message: err.message };
        }

        // persist cache periodically
        if (Object.keys(cache).length % 50 === 0) {
            fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
        }

        await wait(DELAY_MS);
    }

    if (updated) {
        fs.writeFileSync(companiesPath, JSON.stringify(companies, null, 2), 'utf8');
    }
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
    console.log('Geocoding complete. New coordinates added:', geocodedCount);
}

run().catch(err => { console.error(err); process.exit(1); });
