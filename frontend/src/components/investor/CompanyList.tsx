"use client";

import React, { useEffect, useState } from "react";
import type { Company } from "@/types/company";
import CompanyCard from "./CompanyCard";

const PAGE_SIZE = 60;

export default function CompanyList({ companies, onSelectInvestor, onView, compareIds, setCompareIds }: { companies: Company[]; onSelectInvestor: (name: string) => void; onView: (company: Company) => void; compareIds: string[]; setCompareIds: (update: (previous: string[]) => string[]) => void }) {
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    useEffect(() => setVisibleCount(PAGE_SIZE), [companies]);
    const handleCompare = (company: Company) => {
        setCompareIds((prev: string[]) => prev.includes(company.id) ? prev.filter((p) => p !== company.id) : (prev.length < 4 ? [...prev, company.id] : prev));
    };
    const handleWatch = async (company: Company) => {
        try {
            const workspace = await fetch('/api/persistence/workspace');
            const config = await workspace.json() as { enabled?: boolean };
            if (config.enabled) {
                const response = await fetch('/api/persistence/watchlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyId: company.id }) });
                if (response.ok) { window.dispatchEvent(new Event('techatlas.watchlistUpdated')); return; }
            }
        } catch { /* Browser storage remains the non-configured fallback. */ }
        const key = 'techatlas-watchlist';
        const raw = window.localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        if (!arr.includes(company.id)) arr.push(company.id);
        window.localStorage.setItem(key, JSON.stringify(arr));
        window.dispatchEvent(new Event('techatlas.watchlistUpdated'));
    };
    return (
        <div>
            {companies.length === 0 ? (
                <div className="theme-surface rounded-lg border p-6 text-center text-slate-400">NO COMPANIES FOUND<br />Try changing filters.</div>
            ) : (
                companies.slice(0, visibleCount).map((c) => (
                    <CompanyCard key={c.id} company={c} isCompared={compareIds.includes(c.id)} onView={onView} onCompare={handleCompare} onWatch={(company) => void handleWatch(company)} onSelectInvestor={onSelectInvestor} />
                ))
            )}
            {companies.length > visibleCount ? <div className="mt-5 flex flex-col items-center gap-2"><button type="button" onClick={() => setVisibleCount((current) => current + PAGE_SIZE)} className="rounded border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-500/20">Load more companies</button><p className="text-xs text-slate-400">Showing {Math.min(visibleCount, companies.length)} of {companies.length}</p></div> : null}
        </div>
    );
}
