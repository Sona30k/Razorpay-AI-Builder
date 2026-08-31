#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const srcCandidates = [
    path.resolve('data/companies/startups-india.csv'),
    path.resolve('data/companies/dataset.csv'),
    path.resolve('data/comapnies/dataset.csv')
];
const src = srcCandidates.find(p => fs.existsSync(p));
const companiesPath = path.resolve('frontend/public/company-data/companies.json');
if (!fs.existsSync(companiesPath)) {
    console.error('companies.json not found at', companiesPath);
    process.exit(1);
}

const companies = JSON.parse(fs.readFileSync(companiesPath, 'utf8'));

const cities = ['Bengaluru', 'Hyderabad', 'Pune', 'Gurugram', 'Delhi'];
for (const city of cities) {
    const list = companies.filter(c => c.city === city);
    const mappable = list.filter(c => c.latitude !== null && c.longitude !== null).length;
    console.log(`${city}:`);
    console.log(' Total companies:', list.length);
    console.log(' Mappable companies:', mappable);
    console.log('');
}

// extra metrics
const duplicatesRemoved = (() => {
    const srcPath = src || null;
    if (!srcPath) return null;
    // compute duplicates in source for the target cities
    const text = fs.readFileSync(srcPath, 'utf8');
    const rows = text.split('\n').slice(1).filter(Boolean);
    const norm = r => r.toLowerCase().replace(/[^a-z0-9]/g, '');
    const seen = new Map();
    let srcCount = 0;
    for (const line of rows) {
        const cols = line.split(',');
        const city = cols.slice(0).join(','); // we won't try full parse here for a quick count
        srcCount++;
    }
    return null;
})();

const missingWebsites = companies.filter(c => !c.website).length;
const missingCategory = companies.filter(c => !c.category).length;
const invalidCoords = companies.filter(c => (c.latitude === null || c.longitude === null)).length;

console.log('Duplicates removed (import-time):', (() => {
    const metaPath = path.resolve('frontend/public/company-data/companies.meta.json');
    if (fs.existsSync(metaPath)) return JSON.parse(fs.readFileSync(metaPath, 'utf8')).duplicatesRemoved;
    return 'unknown';
})());
console.log('Invalid coordinates found (import-time):', (() => {
    const metaPath = path.resolve('frontend/public/company-data/companies.meta.json');
    if (fs.existsSync(metaPath)) return JSON.parse(fs.readFileSync(metaPath, 'utf8')).invalidCoords;
    return 'unknown';
})());
console.log('Missing websites:', missingWebsites);
console.log('Missing categories:', missingCategory);

process.exit(0);
