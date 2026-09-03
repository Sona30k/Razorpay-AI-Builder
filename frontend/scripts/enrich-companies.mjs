#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("..");
const sourcePath = path.join(root, "data/companies/enrichment.json");
const companiesPath = path.resolve("public/company-data/companies.json");
const limitIndex = process.argv.indexOf("--limit");
const limit = limitIndex >= 0 ? Number(process.argv[limitIndex + 1]) : 0;
const dryRun = process.argv.includes("--dry-run");
const apiKey = process.env.GOOGLE_PLACES_API_KEY;
if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is required for verified enrichment.");

const normalize = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const isExactPlace = (company, place) => normalize(place?.displayName?.text) === normalize(company.name)
  && String(place?.formattedAddress ?? "").toLowerCase().includes(company.city.toLowerCase());
const domain = (website) => {
  try { return new URL(website).hostname.replace(/^www\./, ""); } catch { return null; }
};
const companies = JSON.parse(fs.readFileSync(companiesPath, "utf8"));
const targets = companies.filter((company) => !company.website).slice(0, limit > 0 ? limit : companies.length);
const existing = fs.existsSync(sourcePath) ? JSON.parse(fs.readFileSync(sourcePath, "utf8")) : [];
const byId = new Map(existing.filter((entry) => entry && typeof entry.id === "string").map((entry) => [entry.id, entry]));
let matched = 0;

for (const company of targets) {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.websiteUri" },
    body: JSON.stringify({ textQuery: `${company.name} ${company.city} India`, languageCode: "en" }),
  });
  if (!response.ok) throw new Error(`Places request failed with HTTP ${response.status}.`);
  const body = await response.json();
  const place = Array.isArray(body.places) ? body.places.find((candidate) => isExactPlace(company, candidate)) : null;
  if (!place?.websiteUri) continue;
  const hostname = domain(place.websiteUri);
  if (!hostname) continue;
  byId.set(company.id, { id: company.id, website: place.websiteUri, logo: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`, source: "Google Places Text Search (New)", verifiedAt: new Date().toISOString() });
  matched++;
}

if (!dryRun) fs.writeFileSync(sourcePath, `${JSON.stringify([...byId.values()], null, 2)}\n`);
console.log(`${dryRun ? "Validated" : "Saved"} ${matched} exact website matches from ${targets.length} candidates.`);
