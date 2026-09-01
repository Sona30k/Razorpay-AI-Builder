"use client";

import { useEffect, useState } from "react";
import type { Company } from "@/types/company";
import type { GrowthAnalysis, GrowthPlan, GrowthPlanAction } from "@/lib/growth-analysis";
import { ActionCenter } from "@/components/company/ActionCenter";

type Props = { company: Company; analysis: GrowthAnalysis; onBack: () => void };

export function GrowthPlanner({ company, analysis, onBack }: Props) {
  const [plan, setPlan] = useState<GrowthPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [demo, setDemo] = useState(false);
  const [complete, setComplete] = useState<Set<number>>(new Set());
  const [selectedAction, setSelectedAction] = useState<GrowthPlanAction | null>(null);

  const load = async () => {
    setLoading(true); setError(false);
    try {
      const response = await fetch("/api/ai/growth-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company, analysis }) });
      const body = await response.json();
      if (!response.ok || !body.plan) throw new Error("plan unavailable");
      setPlan(body.plan); setDemo(body.demo === true);
    } catch { setError(true); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  if (selectedAction) return <ActionCenter company={company} action={selectedAction} onBack={() => setSelectedAction(null)} />;
  return <aside className="theme-surface pointer-events-auto absolute right-5 top-12 z-30 max-h-[calc(100%-4rem)] w-[min(29rem,calc(100%-2.5rem))] overflow-y-auto rounded-lg border border-sky-200/15 bg-slate-950/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,.55)]">
    <button type="button" onClick={onBack} className="mb-4 text-xs text-sky-200">← Back to Analysis</button>
    <p className="text-[10px] tracking-[.18em] text-sky-300">AI GROWTH PLAN {demo ? <span className="ml-2 text-sky-200">DEMO MODE</span> : null}</p>
    <p className="mt-2 text-lg font-semibold text-white">{company.name}</p>
    <p className="text-xs text-sky-200">{[company.category, company.city].filter(Boolean).join(" · ")}</p>
    <div className="my-5 border-t border-white/10" />
    {loading ? <p className="animate-pulse text-sm text-slate-300">Building execution plan...</p> : null}
    {error ? <div><p className="text-sm text-slate-300">AI planning is temporarily unavailable. Please try again later.</p><button type="button" onClick={() => void load()} className="mt-4 rounded border border-sky-300/25 px-3 py-2 text-xs text-sky-200">Try Again</button></div> : null}
    {plan ? <div className="space-y-5"><p className="text-xs text-slate-400">{complete.size} / {plan.actions.length} actions completed</p><section><p className="text-[10px] tracking-[.16em] text-slate-500">GROWTH GOAL</p><p className="mt-1 text-sm text-slate-100">{plan.goal}</p></section><section><p className="text-[10px] tracking-[.16em] text-slate-500">STRATEGY</p><p className="mt-1 text-sm text-slate-200">{plan.strategy}</p></section><section><p className="text-[10px] tracking-[.16em] text-slate-500">EXECUTION PLAN</p><div className="mt-3 space-y-3">{plan.actions.map((action, index) => <article key={action.title} className="rounded border border-white/10 p-3"><div className="flex gap-3"><button type="button" aria-label={`Mark ${action.title} complete`} onClick={() => setComplete((current) => { const next = new Set(current); next.has(index) ? next.delete(index) : next.add(index); return next; })} className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${complete.has(index) ? "border-sky-300 bg-sky-300" : "border-slate-500"}`} /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-white">{String(index + 1).padStart(2, "0")} — {action.title}</p><p className="mt-1 text-xs leading-5 text-slate-300">{action.description}</p><p className="mt-2 text-[10px] text-sky-200">{action.priority} · {action.timeline} · {action.kpi}</p><p className="mt-1 text-xs text-slate-400">{action.expectedOutcome}</p><button type="button" onClick={() => setSelectedAction(action)} className="mt-3 text-xs font-medium text-sky-200 hover:text-white">Take Action →</button></div></div></article>)}</div></section><section><p className="text-[10px] tracking-[.16em] text-slate-500">EXPECTED OUTCOME</p><p className="mt-1 text-sm text-slate-200">{plan.expectedOutcome}</p></section><section><p className="text-[10px] tracking-[.16em] text-slate-500">RISKS</p><ul className="mt-2 space-y-1 text-sm text-slate-300">{plan.risks.map((risk) => <li key={risk}>• {risk}</li>)}</ul></section></div> : null}
  </aside>;
}
