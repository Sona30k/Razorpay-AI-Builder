"use client";

import React, { useMemo } from "react";
import type { Company } from "@/types/company";
import { companySector, investorNames } from "@/lib/investor";

export default function InvestorProfile({ investorName, onClose, companies }: { investorName: string | null; onClose: () => void; companies: Company[] }) {
    const matched = useMemo(() => !investorName ? [] : companies.filter((company) => investorNames(company).some((name) => name.toLowerCase() === investorName.toLowerCase())), [companies, investorName]);
    const cityDist = useMemo(() => {
        const map: Record<string, number> = {};
        matched.forEach((c) => { const city = c.city || 'Unknown'; map[city] = (map[city] || 0) + 1; });
        return map;
    }, [matched]);
    const industryDist = useMemo(() => {
        const map: Record<string, number> = {};
        matched.forEach((c) => { const ind = companySector(c); map[ind] = (map[ind] || 0) + 1; });
        return map;
    }, [matched]);

    if (!investorName) return null;
    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="theme-surface max-w-3xl rounded border p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">{investorName}</h3>
                        <p className="text-sm text-slate-400">Companies associated with this investor in the TechAtlas dataset</p>
                    </div>
                    <div><button onClick={onClose} className="rounded bg-white/6 px-2 py-1">Close</button></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm font-medium">Portfolio companies found in TechAtlas</p>
                        <p className="mt-2 text-2xl font-semibold">{matched.length} Companies</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium">City Distribution</p>
                        <ul className="mt-2 text-sm">
                            {Object.entries(cityDist).map(([k, v]) => <li key={k}>{k} — {v}</li>)}
                        </ul>
                    </div>
                    <div className="col-span-2">
                        <p className="text-sm font-medium">Industry Distribution</p>
                        <ul className="mt-2 text-sm">
                            {Object.entries(industryDist).map(([k, v]) => <li key={k}>{k} — {v}</li>)}
                        </ul>
                    </div>
                </div>
                <div className="mt-6">
                    <h4 className="text-sm font-medium">Companies</h4>
                    <ul className="mt-2 space-y-2">
                        {matched.map((c) => (
                            <li key={c.id} className="rounded border p-2">{c.name} · {c.city || 'Not available'} · {c.industry || c.category || 'Not available'}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
