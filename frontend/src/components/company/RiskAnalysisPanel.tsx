"use client";

import { useEffect, useState } from "react";
import type { Company } from "@/types/company";
import type { GrowthAnalysis } from "@/lib/growth-analysis";

type Risk = { category: string; level: "Low" | "Medium" | "High"; score: number; reason: string; mitigation: string };
type Response = { analysis?: { overallRisk: string; overallScore: number; summary: string; risks: Risk[]; keyRisk: string; recommendation: string }; demo?: boolean; error?: string };

export function RiskAnalysisPanel({ company, analysis, onBack, onContinue }: { company: Company; analysis?: GrowthAnalysis | null; onBack: () => void; onContinue: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<Response["analysis"] | null>(null);
    const [demo, setDemo] = useState(false);

    const load = async () => {
        setLoading(true); setError(null);
        try {
            const resp = await fetch("/api/ai/risk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company, growthAnalysis: analysis }) });
            const body = await resp.json() as Response;
            if (!resp.ok || !body.analysis) throw new Error(body.error ?? "analysis unavailable");
            setData(body.analysis); setDemo(body.demo === true);
            void fetch("/api/persistence/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "risk-analysis", companyId: company.id, payload: body.analysis }) });
        } catch (err) {
            setError((err as Error)?.message ?? "Unable to load risk analysis");
        } finally { setLoading(false); }
    };

    useEffect(() => { void load(); }, [company.id]);

    return (
        <aside className="theme-surface pointer-events-auto absolute inset-x-4 top-20 bottom-4 z-30 max-h-none overflow-y-auto rounded-lg border border-sky-200/12 bg-slate-950/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-md lg:inset-x-auto lg:right-5 lg:top-24 lg:bottom-auto lg:max-h-[calc(100%-7rem)] lg:w-[min(36rem,calc(100%-2.5rem))] lg:p-5 xl:right-8">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-medium tracking-[0.18em] text-sky-300">AI RISK ANALYSIS {demo ? <span className="ml-2 rounded border border-sky-300/25 px-1.5 py-0.5 text-[9px] text-sky-200">DEMO MODE</span> : null}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{company.name}</p>
                    <p className="mt-1 text-xs text-sky-200">{[company.industry, company.city].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={onBack} className="rounded-md border border-white/10 px-3 py-1 text-xs text-slate-200">← Back to Analysis</button>
                </div>
            </div>

            <div className="my-4 border-t border-white/8" />
            <p className="mb-4 text-xs leading-5 text-slate-400">TechAtlas estimated risks based on available company and market information. This is not a financial, credit, legal, or investment rating.</p>
            {loading ? <div className="space-y-2 text-sm text-slate-300"><p className="animate-pulse">Analyzing risks...</p></div> : null}
            {error ? <div><p className="text-sm text-slate-300">Risk analysis is temporarily unavailable. Please try again later.</p><button onClick={load} className="mt-3 rounded-md border border-sky-300/25 px-3 py-2 text-xs font-medium text-sky-200 hover:bg-sky-400/10">Try Again</button></div> : null}

            {data ? (
                <div className="space-y-4">
                    <section className="grid grid-cols-3 items-center gap-4">
                        <div className="col-span-2">
                            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">OVERALL RISK</p>
                            <p className="mt-2 text-3xl font-bold text-white">{data.overallScore} <span className="text-sm font-normal text-slate-300">/ 100</span></p>
                            <p className="mt-1 text-sm font-semibold text-sky-300">{data.overallRisk.toUpperCase()}</p>
                            <p className="mt-2 text-sm text-slate-300">{data.summary}</p>
                        </div>
                        <div className="col-span-1 text-right">
                            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">KEY RISK</p>
                            <p className="mt-2 text-sm text-white">{data.keyRisk}</p>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 gap-3">
                        {data.risks.map((r) => (
                            <details key={r.category} className="rounded border border-white/6 bg-slate-900/40 p-3">
                                <summary className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <p className="text-xs font-semibold text-white">{r.category}</p>
                                        <p className="text-sm text-slate-300">{r.level} — {r.score} / 100</p>
                                    </div>
                                </summary>
                                <div className="mt-3 text-sm text-slate-300">
                                    <p className="font-medium text-slate-400">Reason:</p>
                                    <p className="mt-1">{r.reason}</p>
                                    <p className="mt-3 font-medium text-slate-400">Mitigation:</p>
                                    <p className="mt-1">{r.mitigation}</p>
                                </div>
                            </details>
                        ))}
                    </div>

                    <section>
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">RECOMMENDATION</p>
                        <p className="mt-2 text-sm text-slate-300">{data.recommendation}</p>
                    </section>
                    <button type="button" onClick={onContinue} className="w-full rounded-md bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950">Continue to Growth Plan →</button>
                </div>
            ) : null}
        </aside>
    );
}
