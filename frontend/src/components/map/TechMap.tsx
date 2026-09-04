"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo, useState, useEffect, useRef } from "react";
import { Vector3 } from "three";
import { CameraController } from "@/components/map/CameraController";
import { CityInfo } from "@/components/map/CityInfo";
import { CityMarkers } from "@/components/map/CityMarkers";
import { CityView } from "@/components/map/CityView";
import { Globe } from "@/components/map/Globe";
import { StarField } from "@/components/map/StarField";
import { TECH_CITIES } from "@/lib/cities";
import { CompanyPanel } from "@/components/company/CompanyPanel";
import { AIGrowthPanel } from "@/components/company/AIGrowthPanel";
import Link from "next/link";
import { companyDiagnostics, filterCompanies, isNearCity } from "@/lib/companies";
import type { Company } from "@/types/company";
import {
  GLOBE_RADIUS,
  INDIA_FOCUS_GROUP_ROTATION_Y,
  latLonToSphereVector
} from "@/lib/constants";

export function TechMap() {
  const [focusProgress, setFocusProgress] = useState(0);
  const [controlsEnabled, setControlsEnabled] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  const selectedCity = useMemo(
    () => TECH_CITIES.find((city) => city.id === selectedCityId) ?? null,
    [selectedCityId]
  );

  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [aiCompany, setAiCompany] = useState<Company | null>(null);
  const [companyFocusTarget, setCompanyFocusTarget] = useState<Vector3 | null>(null);
  const companySearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/company-data/companies.json")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCompanies(Array.isArray(data) ? data as Company[] : []))
      .catch(() => setCompanies([]));
  }, []);

  const filteredCompanies = useMemo(
    () => selectedCity ? filterCompanies(companies, selectedCity.id, search) : [],
    [companies, search, selectedCity]
  );
  const mappedCompanies = useMemo(
    () => selectedCity ? filteredCompanies.filter((company) => isNearCity(company, selectedCity.lat, selectedCity.lon)) : [],
    [filteredCompanies, selectedCity]
  );
  const cityCompanyStats = useMemo(
    () => selectedCity ? companyDiagnostics(companies, selectedCity.id, selectedCity.lat, selectedCity.lon) : null,
    [companies, selectedCity]
  );
  const selectCity = (cityId: string | null) => {
    setSelectedCityId(cityId);
    setSelectedCompany(null);
    setAiCompany(null);
    setSearch("");
    setIsCompanyDropdownOpen(false);
  };

  const selectCompany = (company: Company | null) => {
    setSelectedCompany(company);
    setAiCompany(null);
    setIsCompanyDropdownOpen(false);
  };

  useEffect(() => {
    const closeDropdown = (event: MouseEvent) => {
      if (!companySearchRef.current?.contains(event.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", closeDropdown);
    return () => document.removeEventListener("mousedown", closeDropdown);
  }, []);

  const cityFocusTarget = useMemo(() => {
    if (!selectedCity) {
      return null;
    }

    const point = latLonToSphereVector(selectedCity.lat, selectedCity.lon, GLOBE_RADIUS + 0.18);
    return new Vector3(point.x, point.y, point.z);
  }, [selectedCity]);

  const cityMode = selectedCity !== null;

  // compute company focus target in scene coordinates when a company is selected
  useEffect(() => {
    if (!selectedCompany || !selectedCity || !isNearCity(selectedCompany, selectedCity.lat, selectedCity.lon)) {
      setCompanyFocusTarget(null);
      return;
    }

    const METERS_TO_SCENE = 0.014;
    const cityLatitude = selectedCity.lat;
    const cityLongitude = selectedCity.lon;
    const lat = selectedCompany.latitude;
    const lon = selectedCompany.longitude;
    const metersPerLongitude = 111_320 * Math.cos((cityLatitude * Math.PI) / 180);
    const x = (lon - cityLongitude) * metersPerLongitude * METERS_TO_SCENE;
    const z = -(lat - cityLatitude) * 110_540 * METERS_TO_SCENE;
    // place target slightly above ground so camera can look at it
    const target = new Vector3(x, 0.4, z);
    setCompanyFocusTarget(target);
  }, [selectedCompany, selectedCity]);

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.65]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={[cityMode ? "#b9ced9" : "#b9e3f4"]} />
        <fog attach="fog" args={[cityMode ? "#b9ced9" : "#b9e3f4", cityMode ? 12 : 10, cityMode ? 32 : 28]} />

        <CameraController
          controlsEnabled={controlsEnabled}
          onFocusProgress={setFocusProgress}
          onAnimationComplete={() => setControlsEnabled(true)}
          focusTarget={cityFocusTarget}
          objectFocus={companyFocusTarget}
          cityMode={cityMode}
        />

        <ambientLight intensity={cityMode ? 0.95 : 1.15} />
        <hemisphereLight args={["#f6fbff", cityMode ? "#95aab3" : "#dbe5ad", cityMode ? 0.52 : 0.75]} />
        <directionalLight position={[4.5, 6.2, 5]} intensity={cityMode ? 1.45 : 1.8} color="#ffffff" />
        <pointLight position={[-3, -1.2, 2.4]} intensity={cityMode ? 0.32 : 0.9} color="#ffffff" />
        <pointLight position={[2, 1.4, -3]} intensity={cityMode ? 0.18 : 0.45} color="#72f3ff" />

        {cityMode ? <StarField /> : null}
        {!cityMode ? (
          <Globe isFocusingIndia={focusProgress > 0 || controlsEnabled}>
            <CityMarkers
              selectedCityId={selectedCityId}
              onSelectCity={selectCity}
            />
          </Globe>
        ) : null}
        {selectedCity ? (
          <CityView city={selectedCity} companies={filteredCompanies} onSelectCompany={selectCompany} selectedCompanyId={selectedCompany?.id ?? null} />
        ) : null}
      </Canvas>

      <div className={`pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b px-5 py-5 sm:px-8 sm:py-7 ${cityMode ? "from-slate-950/45 to-transparent text-white" : "from-white/60 to-transparent text-slate-900"}`}>
        <div>
          <p className="text-base font-semibold tracking-[0.18em] sm:text-xl sm:tracking-[0.2em]">TECHATLAS</p>
          {selectedCity ? (
            <>
              <p className="mt-2 text-lg font-semibold text-white sm:text-xl">{selectedCity.name}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-sky-200">Technology Hub</p>
            </>
          ) : (
            <p className="mt-1.5 max-w-[15rem] text-[10px] uppercase tracking-[0.18em] text-slate-600 sm:mt-2 sm:max-w-sm sm:text-sm sm:tracking-[0.24em]">
              India&apos;s technology ecosystem
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/investor-radar" className="pointer-events-auto inline-flex shrink-0 rounded bg-white/6 px-2.5 py-2 text-xs hover:bg-white/10 sm:px-3 sm:text-sm">Investor Radar</Link>
          <Link href="/merchant-growth" className="pointer-events-auto inline-flex shrink-0 rounded bg-white/6 px-2.5 py-2 text-xs hover:bg-white/10 sm:px-3 sm:text-sm">Merchant Growth</Link>
        </div>
      </div>

      {selectedCity ? (
        <button
          type="button"
          onClick={() => selectCity(null)}
          className="theme-surface absolute bottom-5 left-5 rounded-md border border-white/15 bg-slate-950/75 px-3 py-2 text-xs font-medium text-slate-200 backdrop-blur-md transition hover:border-sky-300/50 hover:text-white sm:bottom-7 sm:left-8"
        >
          ← India
        </button>
      ) : null}

      {/* Company search + panel when a city is selected */}
      {selectedCity && !selectedCompany ? (
        <div ref={companySearchRef} style={{ zIndex: 20_000_000 }} className="pointer-events-auto absolute left-5 top-36 w-[min(18rem,calc(100%-2.5rem))] sm:left-8 sm:top-40 sm:w-72">
          <div className="theme-surface mx-auto w-full rounded-lg border border-white/8 bg-slate-950/70 p-1.5 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,.2)]">
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsCompanyDropdownOpen(true);
                }}
                onFocus={() => setIsCompanyDropdownOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setIsCompanyDropdownOpen(false);
                  if (event.key === "Enter" && filteredCompanies.length === 1) selectCompany(filteredCompanies[0]);
                }}
                placeholder={`Search companies in ${selectedCity.name} (name, category, industry)`}
                aria-label={`Search companies in ${selectedCity.name}`}
                aria-expanded={isCompanyDropdownOpen}
                aria-controls="company-search-results"
                className="w-full rounded bg-transparent px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setIsCompanyDropdownOpen((open) => !open)}
                aria-label="Browse city companies"
                aria-expanded={isCompanyDropdownOpen}
                className="shrink-0 rounded px-1.5 py-1 text-[10px] text-slate-300 transition hover:bg-white/10 hover:text-white sm:text-xs"
              >
                {filteredCompanies.length} <span aria-hidden="true">{isCompanyDropdownOpen ? "^" : "v"}</span>
              </button>
            </div>
          </div>
          {isCompanyDropdownOpen ? (
            <div id="company-search-results" className="theme-surface mt-1.5 overflow-hidden rounded-lg border border-white/10 bg-slate-950/95 shadow-[0_16px_42px_rgba(0,0,0,.38)] backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-sky-300">Companies in {selectedCity.name}</p>
                <span className="text-[10px] text-slate-400">{filteredCompanies.length} results</span>
              </div>
              <ul className="max-h-72 overflow-y-auto p-1.5" role="listbox" aria-label="Company results">
                {filteredCompanies.length ? filteredCompanies.map((company) => {
                  const meta = [company.category, company.industry].filter(Boolean).join(" · ");
                  return (
                    <li key={company.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={() => selectCompany(company)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition hover:bg-sky-400/10 focus:bg-sky-400/10 focus:outline-none"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-400/15 text-[10px] font-semibold text-sky-200">
                          {company.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium text-white">{company.name}</span>
                          {meta ? <span className="block truncate text-[10px] text-slate-400">{meta}</span> : null}
                        </span>
                      </button>
                    </li>
                  );
                }) : <li className="px-2 py-5 text-center text-xs text-slate-400">No companies match this search.</li>}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {selectedCompany ? <CompanyPanel company={selectedCompany} hasAnalysis={Boolean(aiCompany)} onClose={() => { setSelectedCompany(null); setAiCompany(null); }} onExploreAI={() => setAiCompany(selectedCompany)} /> : null}
      {aiCompany ? <AIGrowthPanel company={aiCompany} onClose={() => setAiCompany(null)} /> : null}
      {!cityMode ? <CityInfo city={selectedCity} /> : null}
    </div>
  );
}
