"use client";

import React from "react";
import type { Company } from "@/types/company";
import { companySector, formatFunding, investorNames } from "@/lib/investor";

export default function CompanyCard({ company, onView, onCompare, onWatch, onSelectInvestor }: { company: Company; onView: (company: Company) => void; onCompare: (company: Company) => void; onWatch: (company: Company) => void; onSelectInvestor: (name: string) => void; }) {
    const investors = investorNames(company);
    return (
        <div className="theme-surface mb-3 flex w-full items-start justify-between gap-4 rounded-lg border p-4">
            <div>
                <h4 className="text-lg font-semibold">{company.name}</h4>
                <p className="text-sm text-slate-400">{companySector(company)} · {company.city || 'Not available'}</p>
                <div className="mt-3 text-sm">
                    <p className="text-xs text-slate-400">Funding</p>
                    <p className="mt-1">{formatFunding(company)}</p>
                    <p className="mt-2 text-xs text-slate-400">Investors</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">{investors.length ? investors.map((investor) => <button key={investor} onClick={() => onSelectInvestor(investor)} className="rounded border border-sky-400/20 bg-sky-500/10 px-2 py-0.5 text-left text-xs text-sky-200 hover:bg-sky-500/20">{investor}</button>) : <span>Not available</span>}</div>
                </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
                <button onClick={() => onView(company)} className="rounded bg-white/6 px-3 py-2 text-sm">View Company</button>
                <div className="flex gap-2">
                    <button onClick={() => onCompare(company)} className="rounded bg-white/6 px-3 py-2 text-sm">Compare</button>
                    <button onClick={() => onWatch(company)} className="rounded bg-white/6 px-3 py-2 text-sm">Watchlist</button>
                </div>
            </div>
        </div>
    );
}
