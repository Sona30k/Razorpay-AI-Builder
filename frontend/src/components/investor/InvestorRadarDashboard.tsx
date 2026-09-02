"use client";

import { useMemo, useState } from "react";
import type { Company } from "@/types/company";
import { companySector, fundingAmount } from "@/lib/investor";
import Filters from "./Filters";
import CompanyList from "./CompanyList";
import InvestorProfile from "./InvestorProfile";
import ComparePanel from "./ComparePanel";
import Watchlist from "./Watchlist";
import CompanyDetailsPanel from "./CompanyDetailsPanel";

type Brief = { summary: string; signals: { type: string; title: string; evidence: string; confidence: string }[]; researchQuestions: string[]; note: string };

export default function InvestorRadarDashboard({ companies }: { companies: Company[] }) {
  const [city, setCity] = useState<string | "All">("All");
  const [industry, setIndustry] = useState<string | "All">("All");
  const [minFunding, setMinFunding] = useState<number | null>(null);
  const [investorQuery, setInvestorQuery] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("fund-desc");
  const [selectedInvestor, setSelectedInvestor] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [briefState, setBriefState] = useState<"idle" | "loading" | "error">("idle");

  const normCity = (value: string) => value.replace(/Bangalore/i, "Bengaluru").replace(/Gurgaon/i, "Gurugram");
  const filtered = useMemo(() => companies.filter((company) => {
    if (city !== "All" && normCity(company.city || "") !== city) return false;
    if (industry !== "All" && companySector(company) !== industry) return false;
    const funding = fundingAmount(company);
    if (minFunding === -1 && funding !== null) return false;
    if (minFunding !== null && minFunding >= 0 && (funding === null || funding < minFunding)) return false;
    if (investorQuery.trim() && !company.investors?.toLowerCase().includes(investorQuery.trim().toLowerCase())) return false;
    if (query.trim()) {
      const value = query.toLowerCase();
      if (![company.name, company.category, companySector(company), company.city].filter(Boolean).some((item) => item!.toLowerCase().includes(value))) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sort === "fund-desc") return (fundingAmount(b) ?? -1) - (fundingAmount(a) ?? -1);
    if (sort === "fund-asc") return (fundingAmount(a) ?? Number.MAX_SAFE_INTEGER) - (fundingAmount(b) ?? Number.MAX_SAFE_INTEGER);
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "city") return a.city.localeCompare(b.city);
    return companySector(a).localeCompare(companySector(b));
  }), [companies, city, industry, minFunding, investorQuery, query, sort]);

  const industries = useMemo(() => ["All", ...Array.from(new Set(companies.map(companySector).filter((value) => value !== "Not available"))).sort()], [companies]);
  const cities = useMemo(() => ["All", ...Array.from(new Set(companies.map((company) => normCity(company.city || "")).filter(Boolean))).sort()], [companies]);
  const kpis = useMemo(() => ({ companies: filtered.length, funding: filtered.reduce((total, company) => total + (fundingAmount(company) ?? 0), 0), industries: new Set(filtered.map(companySector)).size, cities: new Set(filtered.map((company) => normCity(company.city || "")).filter(Boolean)).size }), [filtered]);
  const viewCompany = (company: Company) => setSelectedCompany(company);
  const toggleCompare = (company: Company) => setCompareIds((previous) => previous.includes(company.id) ? previous.filter((id) => id !== company.id) : previous.length < 4 ? [...previous, company.id] : previous);
  const generateBrief = async () => { setBriefState("loading"); setBrief(null); try { const response = await fetch("/api/ai/investor-brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companies: filtered.slice(0, 5) }) }); const data = await response.json(); if (!response.ok || !data.summary) throw new Error("brief"); setBrief(data); setBriefState("idle"); } catch { setBriefState("error"); } };

  return <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
    <aside className="col-span-1 space-y-4"><Filters cities={cities} industries={industries} selectedCity={city} onCityChange={setCity} selectedIndustry={industry} onIndustryChange={setIndustry} onMinFundingChange={setMinFunding} onInvestorQueryChange={setInvestorQuery} onQueryChange={setQuery} sort={sort} onSortChange={setSort} /><Watchlist companies={companies} onView={viewCompany} onCompare={toggleCompare} /></aside>
    <section className="col-span-3 min-w-0"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Kpi label="Companies" value={String(kpis.companies)} /><Kpi label="Reported funding" value={kpis.funding ? `₹${(kpis.funding / 10_000_000).toFixed(0)} Cr` : "Not disclosed"} /><Kpi label="Industries" value={String(kpis.industries)} /><Kpi label="Cities" value={String(kpis.cities)} /></div><div className="mt-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-slate-400">Company intelligence</p><h2 className="text-xl font-semibold">{filtered.length} companies</h2></div><button onClick={generateBrief} disabled={!filtered.length || briefState === "loading"} className="rounded border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-100 disabled:opacity-50">{briefState === "loading" ? "Preparing brief..." : "Generate Investor Brief"}</button></div>{briefState === "error" ? <p className="mt-4 text-sm text-rose-300">Investor brief is temporarily unavailable. Please try again later.</p> : null}{brief ? <BriefPanel brief={brief} onClose={() => setBrief(null)} /> : null}<div className="mt-4"><CompanyList companies={filtered} onSelectInvestor={setSelectedInvestor} onView={viewCompany} compareIds={compareIds} setCompareIds={setCompareIds} /></div></section>
    <CompanyDetailsPanel company={selectedCompany} onClose={() => setSelectedCompany(null)} /><InvestorProfile investorName={selectedInvestor} onClose={() => setSelectedInvestor(null)} companies={companies} /><ComparePanel companies={companies.filter((company) => compareIds.includes(company.id))} onClose={() => setCompareIds([])} />
  </div>;
}

function Kpi({ label, value }: { label: string; value: string }) { return <div className="theme-surface rounded-lg border p-3"><p className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-2 truncate text-lg font-semibold">{value}</p></div>; }
function BriefPanel({ brief, onClose }: { brief: Brief; onClose: () => void }) { return <section className="theme-surface mt-4 rounded-lg border border-sky-400/20 p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-300">Investor brief</p><p className="mt-2 text-sm text-slate-200">{brief.summary}</p></div><button onClick={onClose} className="text-sm text-slate-400">Close</button></div><div className="mt-4 grid gap-3 md:grid-cols-3">{brief.signals.map((signal) => <div key={`${signal.type}-${signal.title}`} className="rounded border border-white/10 p-3"><p className="text-xs text-sky-300">{signal.type} · {signal.confidence}</p><p className="mt-1 text-sm font-medium">{signal.title}</p><p className="mt-1 text-xs text-slate-400">{signal.evidence}</p></div>)}</div>{brief.researchQuestions.length ? <div className="mt-4"><p className="text-xs uppercase tracking-[0.14em] text-slate-400">Research questions</p><ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-300">{brief.researchQuestions.map((question) => <li key={question}>{question}</li>)}</ul></div> : null}<p className="mt-4 text-xs text-slate-500">{brief.note}</p></section>; }
