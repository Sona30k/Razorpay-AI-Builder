"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo, useState, useEffect } from "react";
import { Vector3 } from "three";
import { CameraController } from "@/components/map/CameraController";
import { CityInfo } from "@/components/map/CityInfo";
import { CityMarkers } from "@/components/map/CityMarkers";
import { CityView } from "@/components/map/CityView";
import { Globe } from "@/components/map/Globe";
import { IndiaOutline } from "@/components/map/IndiaOutline";
import { StarField } from "@/components/map/StarField";
import { TECH_CITIES } from "@/lib/cities";
import { CompanyPanel } from "@/components/company/CompanyPanel";
import { AIGrowthPanel } from "@/components/company/AIGrowthPanel";
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
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [aiCompany, setAiCompany] = useState<Company | null>(null);
  const [companyFocusTarget, setCompanyFocusTarget] = useState<Vector3 | null>(null);

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
  useEffect(() => {
    if (selectedCity && cityCompanyStats) {
      console.info("COMPANY DATA LOADED", {
        city: selectedCity.name,
        total: cityCompanyStats.total,
        withCoordinates: cityCompanyStats.withCoordinates,
        mappable: cityCompanyStats.mappable,
        outsideCityArea: cityCompanyStats.outsideCityArea
      });
    }
  }, [cityCompanyStats, selectedCity]);

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
        <color attach="background" args={["#050608"]} />
        <fog attach="fog" args={["#050608", 7, 13]} />

        <CameraController
          controlsEnabled={controlsEnabled}
          onFocusProgress={setFocusProgress}
          onAnimationComplete={() => setControlsEnabled(true)}
          focusTarget={cityFocusTarget}
          objectFocus={companyFocusTarget}
          cityMode={cityMode}
        />

        <ambientLight intensity={0.36} />
        <directionalLight position={[4.5, 3.2, 5]} intensity={1.45} color="#e7f0ff" />
        <pointLight position={[-3, -1.2, 2.4]} intensity={1.45} color="#2d8cff" />
        <pointLight position={[2, 1.4, -3]} intensity={0.75} color="#72f3ff" />

        <StarField />
        {!cityMode ? (
          <Globe isFocusingIndia={focusProgress > 0 || controlsEnabled}>
            <IndiaOutline focusProgress={focusProgress} />
            <CityMarkers
              selectedCityId={selectedCityId}
              onSelectCity={setSelectedCityId}
            />
          </Globe>
        ) : null}
        {selectedCity ? (
          <CityView city={selectedCity} companies={mappedCompanies} onSelectCompany={(c) => setSelectedCompany(c)} selectedCompanyId={selectedCompany?.id ?? null} />
        ) : null}
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-5 py-5 text-white sm:px-8 sm:py-7">
        <div>
          <p className="text-base font-semibold tracking-[0.18em] sm:text-xl sm:tracking-[0.2em]">TECHATLAS</p>
          {selectedCity ? (
            <>
              <p className="mt-2 text-lg font-semibold text-white sm:text-xl">{selectedCity.name}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-sky-200">Technology Hub</p>
            </>
          ) : (
            <p className="mt-1.5 max-w-[15rem] text-[10px] uppercase tracking-[0.18em] text-slate-400 sm:mt-2 sm:max-w-sm sm:text-sm sm:tracking-[0.24em]">
              India&apos;s technology ecosystem
            </p>
          )}
        </div>
        <p className="hidden text-xs uppercase tracking-[0.24em] text-slate-500 sm:block">
          India focus sequence
        </p>
      </div>

      {!cityMode ? <div className="pointer-events-none absolute inset-x-3 bottom-4 flex justify-center sm:inset-y-0 sm:right-6 sm:left-auto sm:items-center sm:pr-0 lg:right-8">
        <div className="pointer-events-auto w-full max-w-[22rem] rounded-lg border border-white/10 bg-slate-950/60 p-2.5 shadow-[0_0_24px_rgba(37,99,235,0.12)] backdrop-blur-md sm:w-44 sm:max-w-none sm:p-3 lg:w-48">
          <p className="px-1 text-[9px] font-medium uppercase tracking-[0.22em] text-slate-400 sm:text-[10px] sm:tracking-[0.26em]">
            Tech Cities
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:mt-2.5 sm:grid-cols-1">
            {TECH_CITIES.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => setSelectedCityId(city.id)}
                className={`flex min-w-0 items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs leading-5 transition-all duration-200 sm:py-1.5 sm:text-sm ${selectedCityId === city.id
                  ? "border-sky-400/60 bg-sky-500/10 text-sky-100 shadow-[0_0_16px_rgba(56,189,248,0.2)]"
                  : "border-white/5 bg-white/[0.02] text-slate-200 hover:border-sky-400/40 hover:bg-sky-500/5"
                  }`}
              >
                <span className="truncate">{city.name}</span>
                {selectedCityId === city.id ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" /> : null}
              </button>
            ))}
          </div>
        </div>
      </div> : null}

      {selectedCity ? (
        <button
          type="button"
          onClick={() => { setSelectedCityId(null); setSelectedCompany(null); }}
          className="absolute bottom-5 left-5 rounded-md border border-white/15 bg-slate-950/75 px-3 py-2 text-xs font-medium text-slate-200 backdrop-blur-md transition hover:border-sky-300/50 hover:text-white sm:bottom-7 sm:left-8"
        >
          ← India
        </button>
      ) : null}

      {/* Company search + panel when a city is selected */}
      {selectedCity ? (
        <div className="pointer-events-auto absolute left-1/2 top-5 -translate-x-1/2 w-[min(40rem,92%)]">
          <div className="mx-auto w-full max-w-3xl rounded-lg border border-white/8 bg-slate-950/60 p-2.5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search companies in ${selectedCity.name} (name, category, industry)`}
                className="w-full rounded bg-transparent px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <div className="shrink-0 text-xs text-slate-400">{filteredCompanies.length} companies</div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedCompany ? <CompanyPanel company={selectedCompany} onClose={() => setSelectedCompany(null)} onExploreAI={() => setAiCompany(selectedCompany)} /> : null}
      {aiCompany ? <AIGrowthPanel company={aiCompany} onClose={() => setAiCompany(null)} /> : null}
      {!cityMode ? <CityInfo city={selectedCity} /> : null}
      {/* Dev-accessible company list for clicking companies without canvas interaction */}
      {selectedCity ? (
        <div className="pointer-events-auto absolute right-5 bottom-16 w-64 max-h-80 overflow-auto rounded-lg border border-white/6 bg-slate-950/60 p-2 backdrop-blur-md">
          <p className="text-xs text-slate-400">Companies in {selectedCity.name}</p>
          {cityCompanyStats && cityCompanyStats.mappable !== cityCompanyStats.total ? (
            <p className="mt-0.5 text-[10px] text-slate-500">{cityCompanyStats.mappable} mapped in this city view</p>
          ) : null}
          <ul className="mt-2 space-y-1">
            {mappedCompanies.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedCompany(c)}
                  className="w-full text-left text-sm text-slate-200 hover:text-white"
                >
                  {c.name} <span className="text-xs text-slate-500">· {c.category}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
