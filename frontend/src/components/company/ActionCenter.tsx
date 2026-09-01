"use client";

import { useState } from "react";
import type { Company } from "@/types/company";
import type { GrowthPlanAction } from "@/lib/growth-analysis";

type CommerceAction = "Create Campaign" | "Create Landing Page" | "Create Customer Segment" | "Create Payment Link" | "Track Conversion";
type CommerceResult = { title: string; message: string; paymentLink?: string; transactionStatus?: "Created" | "Pending" | "Successful" };
type Props = { company: Company; action: GrowthPlanAction; onBack: () => void };

const commerceOptions: CommerceAction[] = ["Create Campaign", "Create Landing Page", "Create Customer Segment", "Create Payment Link", "Track Conversion"];

export function ActionCenter({ company, action, onBack }: Props) {
  const [selectedOption, setSelectedOption] = useState<CommerceAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<CommerceResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<"Created" | "Pending" | "Successful" | null>(null);

  const runAction = async (commerceAction: CommerceAction) => {
    setSelectedOption(commerceAction); setLoading(true); setError(false); setResult(null); setTransactionStatus(null);
    try {
      const response = await fetch("/api/commerce/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company, action, commerceAction }) });
      const body = await response.json();
      if (!response.ok || !body.result) throw new Error("commerce action unavailable");
      setResult(body.result);
      if (body.result.paymentLink) setTransactionStatus("Created");
    } catch { setError(true); } finally { setLoading(false); }
  };

  const copyLink = async () => {
    if (!result?.paymentLink) return;
    try { await navigator.clipboard.writeText(result.paymentLink); setCopied(true); } catch { setCopied(false); }
  };

  const simulatePayment = () => {
    setTransactionStatus("Pending");
    window.setTimeout(() => setTransactionStatus("Successful"), 650);
  };

  return <aside className="theme-surface pointer-events-auto absolute inset-x-4 top-16 bottom-4 z-30 max-h-none overflow-y-auto rounded-lg border border-sky-200/15 bg-slate-950/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,.55)] lg:inset-x-auto lg:right-5 lg:top-12 lg:bottom-auto lg:max-h-[calc(100%-4rem)] lg:w-[min(29rem,calc(100%-2.5rem))] lg:p-5">
    <button type="button" onClick={onBack} className="mb-4 text-xs text-sky-200">← Back to Growth Plan</button>
    <p className="text-[10px] tracking-[.18em] text-sky-300">ACTION CENTER <span className="ml-2 text-sky-200">DEMO MODE</span></p>
    <p className="mt-2 text-lg font-semibold text-white">{company.name}</p><p className="text-xs text-sky-200">{[company.category, company.city].filter(Boolean).join(" · ")}</p>
    <div className="my-5 border-t border-white/10" />
    <section><p className="text-[10px] tracking-[.16em] text-slate-500">SELECTED GROWTH ACTION</p><p className="mt-1 text-sm font-medium text-white">{action.title}</p><p className="mt-1 text-xs leading-5 text-slate-300">{action.description}</p></section>
    <section className="mt-5"><p className="text-[10px] tracking-[.16em] text-slate-500">RECOMMENDED NEXT STEPS</p><ol className="mt-2 space-y-1 text-sm text-slate-200"><li>1. Create campaign</li><li>2. Create landing page</li><li>3. Reach target customers</li><li>4. Track campaign performance</li></ol></section>
    <section className="mt-5"><p className="text-[10px] tracking-[.16em] text-slate-500">COMMERCE OPTIONS</p><div className="mt-3 grid grid-cols-2 gap-2">{commerceOptions.map((option) => <button key={option} type="button" onClick={() => option === "Create Payment Link" ? (setSelectedOption(option), setResult(null), setError(false)) : void runAction(option)} disabled={loading} className="rounded border border-sky-300/20 px-3 py-2 text-left text-xs text-sky-100 hover:bg-sky-400/10 disabled:opacity-50">{option}</button>)}</div></section>
    {selectedOption === "Create Payment Link" && !result && !loading ? <section className="mt-5 rounded border border-sky-300/20 p-3"><p className="text-[10px] tracking-[.16em] text-sky-300">CREATE PAYMENT LINK <span className="ml-1 text-sky-200">DEMO MODE</span></p><p className="mt-3 text-xs text-slate-400">Product / Campaign</p><p className="text-sm text-white">Growth Campaign</p><p className="mt-3 text-xs text-slate-400">Amount</p><p className="text-sm text-white">₹10,000</p><p className="mt-3 text-xs text-slate-400">Description</p><p className="text-sm text-white">{company.city} customer acquisition campaign</p><button type="button" onClick={() => void runAction("Create Payment Link")} className="mt-4 w-full rounded bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950">Generate Payment Link</button></section> : null}
    {loading ? <p className="mt-5 animate-pulse text-sm text-slate-300">Creating action...</p> : null}
    {error ? <div className="mt-5"><p className="text-sm text-slate-300">Unable to complete this action.</p><button type="button" onClick={() => selectedOption && void runAction(selectedOption)} className="mt-3 rounded border border-sky-300/25 px-3 py-2 text-xs text-sky-200">Try Again</button></div> : null}
    {result ? <section className="mt-5 rounded border border-emerald-300/25 bg-emerald-300/5 p-3"><p className="text-[10px] tracking-[.16em] text-emerald-200">ACTION COMPLETED SUCCESSFULLY</p><p className="mt-2 text-sm font-medium text-white">{result.title}</p><p className="mt-1 text-xs leading-5 text-slate-300">{result.message}</p>{result.paymentLink ? <div className="mt-4 border-t border-white/10 pt-3"><p className="text-[10px] tracking-[.16em] text-sky-200">PAYMENT LINK CREATED</p><a href={result.paymentLink} className="mt-2 block break-all text-xs text-sky-200 underline" target="_blank" rel="noreferrer">{result.paymentLink}</a><div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">{(["Created", "Pending", "Successful"] as const).map((status, index) => <div key={status} className="flex items-center gap-2"><span className={transactionStatus === status ? "text-emerald-200" : "text-slate-600"}>{status}</span>{index < 2 ? <span>→</span> : null}</div>)}</div><p className="mt-2 text-[10px] tracking-[.12em] text-amber-200">DEMO PAYMENT · NO REAL MONEY WILL BE CHARGED</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => void copyLink()} className="rounded border border-sky-300/25 px-3 py-2 text-xs text-sky-200">{copied ? "Copied" : "Copy Link"}</button>{transactionStatus !== "Successful" ? <button type="button" onClick={simulatePayment} disabled={transactionStatus === "Pending"} className="rounded border border-emerald-300/25 px-3 py-2 text-xs text-emerald-200 disabled:opacity-50">{transactionStatus === "Pending" ? "Simulating..." : "Simulate Test Payment"}</button> : null}</div></div> : null}</section> : null}
  </aside>;
}
