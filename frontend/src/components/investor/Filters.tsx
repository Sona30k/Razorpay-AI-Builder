"use client";

import React from "react";

export default function Filters({
    cities,
    industries,
    selectedCity,
    onCityChange,
    selectedIndustry,
    onIndustryChange,
    onMinFundingChange,
    onInvestorQueryChange,
    onQueryChange,
    sort,
    onSortChange
}: any) {
    return (
        <div className="theme-surface rounded-lg border p-4">
            <h3 className="text-sm font-medium">Filters</h3>
            <div className="mt-3 space-y-3 text-sm">
                <div>
                    <label className="block text-xs text-slate-400">City</label>
                    <select value={selectedCity} onChange={(e) => onCityChange(e.target.value)} className="mt-1 w-full rounded bg-transparent px-2 py-2">
                        {cities.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-slate-400">Industry</label>
                    <select value={selectedIndustry} onChange={(e) => onIndustryChange(e.target.value)} className="mt-1 w-full rounded bg-transparent px-2 py-2">
                        {industries.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-slate-400">Funding</label>
                    <select onChange={(e) => onMinFundingChange(e.target.value ? Number(e.target.value) : null)} className="mt-1 w-full rounded bg-transparent px-2 py-2">
                        <option value="">Any funding</option>
                        <option value="10000000">₹1 Cr+</option>
                        <option value="50000000">₹5 Cr+</option>
                        <option value="100000000">₹10 Cr+</option>
                        <option value="500000000">₹50 Cr+</option>
                        <option value="1000000000">₹100 Cr+</option>
                        <option value="-1">Unknown / undisclosed</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-slate-400">Investor</label>
                    <input onChange={(e) => onInvestorQueryChange(e.target.value)} placeholder="Search investor" className="mt-1 w-full rounded bg-transparent px-2 py-2" />
                </div>
                <div>
                    <label className="block text-xs text-slate-400">Search</label>
                    <input onChange={(e) => onQueryChange(e.target.value)} placeholder="Search companies" className="mt-1 w-full rounded bg-transparent px-2 py-2" />
                </div>
                <div>
                    <label className="block text-xs text-slate-400">Sort</label>
                    <select value={sort} onChange={(e) => onSortChange(e.target.value)} className="mt-1 w-full rounded bg-transparent px-2 py-2">
                        <option value="fund-desc">Funding: High → Low</option>
                        <option value="fund-asc">Funding: Low → High</option>
                        <option value="name">Company Name</option>
                        <option value="city">City</option>
                        <option value="industry">Industry</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
