"use client";

import { useState } from "react";
import type { Company } from "@/types/company";
import type { GrowthPlanAction } from "@/lib/growth-analysis";

type CommerceAction = "Create Campaign" | "Create Landing Page" | "Create Customer Segment" | "Create Payment Link" | "Track Conversion";
type CommerceResult = { title: string; message: string; paymentLink?: string; transactionStatus?: "Created" | "Pending" | "Successful" };
type Props = { company: Company; action: GrowthPlanAction; onBack: () => void };
type RazorpayCheckout = { open: () => void };
type RazorpayConstructor = new (options: { key: string; amount: number; currency: string; name: string; description: string; order_id: string; handler: (payment: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void }) => RazorpayCheckout;

const commerceOptions: CommerceAction[] = ["Create Campaign", "Create Landing Page", "Create Customer Segment", "Create Payment Link", "Track Conversion"];

export function ActionCenter({ company, action, onBack }: Props) {
  const [selectedOption, setSelectedOption] = useState<CommerceAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<CommerceResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<"Created" | "Pending" | "Successful" | null>(null);
  const [paymentMode, setPaymentMode] = useState<"demo" | "test">("demo");

  const runAction = async (commerceAction: CommerceAction) => {
    setSelectedOption(commerceAction); setLoading(true); setError(false); setResult(null); setTransactionStatus(null);
    try {
      const response = await fetch("/api/commerce/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company, action, commerceAction }) });
      const body = await response.json();
      if (!response.ok || !body.result) throw new Error("commerce action unavailable");
      setResult(body.result);
      setPaymentMode(body.demo === true ? "demo" : "test");
      void fetch("/api/persistence/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "action-outcome", companyId: company.id, payload: { commerceAction, result: body.result } }) });
      if (body.result.paymentLink) setTransactionStatus("Created");
    } catch { setError(true); } finally { setLoading(false); }
  };

  const loadRazorpay = async () => {
    if (typeof window === "undefined") return null;
    const existing = (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;
    if (existing) return existing;
    return await new Promise<RazorpayConstructor | null>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve((window as Window & { Razorpay?: RazorpayConstructor }).Razorpay ?? null);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  };

  const generatePayment = async () => {
    setLoading(true); setError(false); setResult(null); setTransactionStatus(null);
    try {
      const configResponse = await fetch("/api/payments/config");
      const config = await configResponse.json() as { razorpay?: { keyId: string } | null };
      if (!config.razorpay) { await runAction("Create Payment Link"); return; }
      const response = await fetch("/api/payments/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company, action }) });
      const body = await response.json() as { order?: { id?: string; orderId: string; amount: number; currency: string }; keyId?: string };
      if (!response.ok || !body.order || !body.keyId) throw new Error("test payment order unavailable");
      const Razorpay = await loadRazorpay();
      if (!Razorpay) throw new Error("checkout unavailable");
      setPaymentMode("test"); setTransactionStatus("Created");
      new Razorpay({ key: body.keyId, amount: body.order.amount, currency: body.order.currency, name: "TechAtlas AI", description: `${company.name} growth action`, order_id: body.order.orderId, handler: async (payment) => {
        setTransactionStatus("Pending");
        const verification = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payment) });
        if (verification.ok) {
          setTransactionStatus("Successful");
          setResult({ title: "Test payment verified", message: "Razorpay test-mode payment verification completed. No live money was charged.", transactionStatus: "Successful" });
        } else setError(true);
      } }).open();
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
    {selectedOption === "Create Payment Link" && !result && !loading ? <section className="mt-5 rounded border border-sky-300/20 p-3"><p className="text-[10px] tracking-[.16em] text-sky-300">CREATE PAYMENT LINK</p><p className="mt-3 text-xs text-slate-400">Product / Campaign</p><p className="text-sm text-white">Growth Campaign</p><p className="mt-3 text-xs text-slate-400">Amount</p><p className="text-sm text-white">₹100</p><p className="mt-3 text-xs text-slate-400">Description</p><p className="text-sm text-white">{company.city} customer acquisition campaign</p><button type="button" onClick={() => void generatePayment()} className="mt-4 w-full rounded bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950">Generate Test Payment</button></section> : null}
    {loading ? <p className="mt-5 animate-pulse text-sm text-slate-300">Creating action...</p> : null}
    {error ? <div className="mt-5"><p className="text-sm text-slate-300">Unable to complete this action.</p><button type="button" onClick={() => selectedOption && void runAction(selectedOption)} className="mt-3 rounded border border-sky-300/25 px-3 py-2 text-xs text-sky-200">Try Again</button></div> : null}
    {result ? <section className="mt-5 rounded border border-emerald-300/25 bg-emerald-300/5 p-3"><p className="text-[10px] tracking-[.16em] text-emerald-200">ACTION COMPLETED SUCCESSFULLY</p><p className="mt-2 text-sm font-medium text-white">{result.title}</p><p className="mt-1 text-xs leading-5 text-slate-300">{result.message}</p>{result.paymentLink ? <div className="mt-4 border-t border-white/10 pt-3"><p className="text-[10px] tracking-[.16em] text-sky-200">PAYMENT LINK CREATED</p><a href={result.paymentLink} className="mt-2 block break-all text-xs text-sky-200 underline" target="_blank" rel="noreferrer">{result.paymentLink}</a><PaymentState mode={paymentMode} status={transactionStatus} copied={copied} onCopy={copyLink} onSimulate={simulatePayment} /></div> : null}{paymentMode === "test" && !result.paymentLink ? <div className="mt-4 border-t border-white/10 pt-3"><p className="text-[10px] tracking-[.16em] text-amber-200">RAZORPAY TEST MODE · NO LIVE MONEY WILL BE CHARGED</p><PaymentState mode={paymentMode} status={transactionStatus} copied={false} onCopy={copyLink} onSimulate={simulatePayment} /></div> : null}</section> : null}
  </aside>;
}

function PaymentState({ mode, status, copied, onCopy, onSimulate }: { mode: "demo" | "test"; status: "Created" | "Pending" | "Successful" | null; copied: boolean; onCopy: () => void; onSimulate: () => void }) {
  return <><div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">{(["Created", "Pending", "Successful"] as const).map((step, index) => <div key={step} className="flex items-center gap-2"><span className={status === step ? "text-emerald-200" : "text-slate-600"}>{step}</span>{index < 2 ? <span>→</span> : null}</div>)}</div>{mode === "demo" ? <><p className="mt-2 text-[10px] tracking-[.12em] text-amber-200">DEMO PAYMENT · NO REAL MONEY WILL BE CHARGED</p><div className="mt-3 flex gap-2"><button type="button" onClick={onCopy} className="rounded border border-sky-300/25 px-3 py-2 text-xs text-sky-200">{copied ? "Copied" : "Copy Link"}</button>{status !== "Successful" ? <button type="button" onClick={onSimulate} disabled={status === "Pending"} className="rounded border border-emerald-300/25 px-3 py-2 text-xs text-emerald-200 disabled:opacity-50">{status === "Pending" ? "Simulating..." : "Simulate Test Payment"}</button> : null}</div></> : null}</>;
}
