"use client";

import React, { useEffect, useState } from "react";
import type { Company } from "@/types/company";

export default function Watchlist({ companies, onView, onCompare }: { companies: Company[]; onView: (company: Company) => void; onCompare: (company: Company) => void; }) {
    const [items, setItems] = useState<string[]>([]);

    useEffect(() => {
        const load = () => {
            const raw = window.localStorage.getItem('techatlas-watchlist');
            setItems(raw ? JSON.parse(raw) : []);
        };
        load();
        const onStorage = () => load();
        window.addEventListener('storage', onStorage);
        window.addEventListener('techatlas.watchlistUpdated', onStorage as any);
        return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('techatlas.watchlistUpdated', onStorage as any); };
    }, []);

    const remove = (id: string) => {
        const raw = window.localStorage.getItem('techatlas-watchlist');
        const arr = raw ? JSON.parse(raw) : [];
        const next = arr.filter((x: string) => x !== id);
        window.localStorage.setItem('techatlas-watchlist', JSON.stringify(next));
        setItems(next);
        window.dispatchEvent(new Event('techatlas.watchlistUpdated'));
    };

    return (
        <div className="theme-surface rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">My Watchlist</h4>
                <span className="text-sm text-slate-400">WATCHLIST ({items.length})</span>
            </div>
            <div className="mt-3 text-sm text-slate-400">Saved companies are stored locally in your browser.</div>
            <div className="mt-3">
                {items.length === 0 ? <div className="text-sm text-slate-400">No items yet</div> : (
                    <ul className="space-y-2">
                        {items.map((id) => { const company = companies.find((item) => item.id === id); return <li key={id} className="rounded border p-2"><p className="truncate text-sm text-slate-200">{company?.name ?? id}</p><div className="mt-2 flex gap-2"><button disabled={!company} onClick={() => company && onView(company)} className="rounded bg-white/6 px-2 py-1 text-xs disabled:opacity-40">View</button><button disabled={!company} onClick={() => company && onCompare(company)} className="rounded bg-white/6 px-2 py-1 text-xs disabled:opacity-40">Compare</button><button onClick={() => remove(id)} className="rounded bg-white/6 px-2 py-1 text-xs">Remove</button></div></li>; })}
                    </ul>
                )}
            </div>
        </div>
    );
}
