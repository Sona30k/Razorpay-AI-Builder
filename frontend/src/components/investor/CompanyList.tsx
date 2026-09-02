"use client";

import React from "react";
import type { Company } from "@/types/company";
import CompanyCard from "./CompanyCard";

export default function CompanyList({ companies, onSelectInvestor, onView, compareIds, setCompareIds }: { companies: Company[]; onSelectInvestor: (name: string) => void; onView: (company: Company) => void; compareIds: string[]; setCompareIds: (update: (previous: string[]) => string[]) => void }) {
    const handleCompare = (company: Company) => {
        setCompareIds((prev: string[]) => prev.includes(company.id) ? prev.filter((p) => p !== company.id) : (prev.length < 4 ? [...prev, company.id] : prev));
    };
    const handleWatch = (company: Company) => {
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
                companies.map((c) => (
                    <CompanyCard key={c.id} company={c} onView={onView} onCompare={handleCompare} onWatch={handleWatch} onSelectInvestor={onSelectInvestor} />
                ))
            )}
        </div>
    );
}
