"use client";

import Link from "next/link";
import { useEffect } from "react";
import MerchantGrowthDashboard from "@/components/merchant/MerchantGrowthDashboard";

export default function MerchantGrowthPage() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    html.style.overflow = "auto";
    body.style.overflow = "auto";
    return () => { html.style.overflow = previousHtmlOverflow; body.style.overflow = previousBodyOverflow; };
  }, []);

  return <div className="investor-radar atlas-bg min-h-screen"><main className="mx-auto max-w-7xl px-5 py-7 sm:px-8"><header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[.2em] text-sky-300">AI Growth Agent</p><h1 className="mt-2 text-3xl font-semibold">Merchant Growth Intelligence</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Analyze customer behavior and discover opportunities to grow revenue.</p></div><Link href="/" aria-label="Back to globe" className="inline-flex items-center gap-2 rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400 hover:bg-slate-800"><span aria-hidden="true">←</span>Back</Link></header><MerchantGrowthDashboard /></main></div>;
}
