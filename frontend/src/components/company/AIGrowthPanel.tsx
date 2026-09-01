"use client";

import { useEffect, useState } from "react";
import type { Company } from "@/types/company";
import type { GrowthAnalysis } from "@/lib/growth-analysis";
import { companyIndustry, companyText } from "@/lib/companies";
import { GrowthPlanner } from "@/components/company/GrowthPlanner";

type Props = { company: Company; onClose: () => void };
type CachedAnalysis = { analysis: GrowthAnalysis; demo: boolean };
const cache = new Map<string, CachedAnalysis>();

export function AIGrowthPanel({ company, onClose }: Props) {
  const cached = cache.get(company.id);
  const [analysis, setAnalysis] = useState<GrowthAnalysis | null>(() => cached?.analysis ?? null);
  const [loading, setLoading] = useState(!cache.has(company.id));
  const [error, setError] = useState(false);
  const [demo, setDemo] = useState(cached?.demo ?? false);
  const [planNotice, setPlanNotice] = useState(false);

  const load = async () => {
    setLoading(true); setError(false);
    try {
      const response = await fetch("/api/ai/growth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company }) });
      const body = await response.json();
      if (!response.ok || !body.analysis) throw new Error("analysis unavailable");
      const isDemo = body.demo === true;
      cache.set(company.id, { analysis: body.analysis, demo: isDemo }); setAnalysis(body.analysis); setDemo(isDemo);
    } catch { setError(true); } finally { setLoading(false); }
  };
  useEffect(() => { if (!analysis) void load(); }, [company.id]);

  const detail = (label: string, value: string) => <section><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">{label}</p><p className="mt-1 text-sm leading-6 text-slate-200">{value}</p></section>;
  if (planNotice && analysis) return <GrowthPlanner company={company} analysis={analysis} onBack={() => setPlanNotice(false)} />;
  return <aside className="theme-surface pointer-events-auto absolute right-5 top-24 z-20 max-h-[calc(100%-7rem)] w-[min(25rem,calc(100%-2.5rem))] overflow-y-auto rounded-lg border border-sky-200/15 bg-slate-950/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-md sm:right-8">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-medium tracking-[0.18em] text-sky-300">AI GROWTH ANALYSIS {demo ? <span className="ml-2 rounded border border-sky-300/25 px-1.5 py-0.5 text-[9px] text-sky-200">DEMO MODE</span> : null}</p><p className="mt-2 text-lg font-semibold text-white">{company.name}</p><p className="mt-1 text-xs text-sky-200">{[companyText(company.category), companyIndustry(company), company.city].filter(Boolean).join(" · ")}</p></div><button type="button" aria-label="Close AI growth analysis" onClick={onClose} className="text-slate-400 hover:text-white">✕</button></div>
    <div className="my-5 border-t border-white/10" />
    {loading ? <div className="space-y-3 text-sm text-slate-300"><p className="animate-pulse">Analyzing company...</p><p className="animate-pulse [animation-delay:150ms]">Finding growth signals...</p><p className="animate-pulse [animation-delay:300ms]">Building opportunity...</p></div> : null}
    {error ? <div><p className="text-sm text-slate-300">Unable to generate growth analysis right now.</p><button type="button" onClick={load} className="mt-4 rounded-md border border-sky-300/25 px-3 py-2 text-xs font-medium text-sky-200 hover:bg-sky-400/10">Try Again</button></div> : null}
    {analysis ? <div className="space-y-5">{detail("Growth Opportunity", analysis.opportunity)}{detail("Why This Opportunity", analysis.why)}{detail("Target Segment", analysis.targetSegment)}{detail("Recommended Strategy", analysis.strategy)}{detail("Expected Impact", analysis.expectedImpact)}<div className="grid grid-cols-2 gap-3 text-xs"><p className="rounded border border-white/10 p-2 text-slate-300">DIFFICULTY <span className="float-right text-white">{analysis.difficulty}</span></p><p className="rounded border border-white/10 p-2 text-slate-300">PRIORITY <span className="float-right text-white">{analysis.priority}</span></p></div><section><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Key Metrics</p><ul className="mt-2 space-y-1 text-sm text-slate-200">{analysis.kpis.map((kpi) => <li key={kpi}>• {kpi}</li>)}</ul></section><button type="button" onClick={() => setPlanNotice(true)} className="w-full rounded-md bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950">Build Growth Plan →</button></div> : null}
  </aside>;
}
