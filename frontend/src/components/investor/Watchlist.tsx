"use client";

import React, { useEffect, useState } from "react";
import type { Company } from "@/types/company";

export default function Watchlist({ companies, onView, onCompare }: { companies: Company[]; onView: (company: Company) => void; onCompare: (company: Company) => void; }) {
    const [items, setItems] = useState<string[]>([]);
    const [persistent, setPersistent] = useState(false);

    useEffect(() => {
        const loadLocal = () => {
            const raw = window.localStorage.getItem('techatlas-watchlist');
            setItems(raw ? JSON.parse(raw) : []);
        };
        const load = async () => {
            try {
                const workspace = await fetch('/api/persistence/workspace');
                const workspaceData = await workspace.json() as { enabled?: boolean };
                if (!workspaceData.enabled) return loadLocal();
                const response = await fetch('/api/persistence/watchlist');
                const data = await response.json() as { enabled?: boolean; items?: string[] };
                if (response.ok && data.enabled && Array.isArray(data.items)) { setPersistent(true); setItems(data.items); return; }
            } catch { /* Keep the existing browser-only watchlist available. */ }
            loadLocal();
        };
        void load();
        const onStorage = () => void load();
        window.addEventListener('storage', onStorage);
        window.addEventListener('techatlas.watchlistUpdated', onStorage as any);
        return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('techatlas.watchlistUpdated', onStorage as any); };
    }, []);

    const remove = async (id: string) => {
        if (persistent) {
            try {
                const response = await fetch('/api/persistence/watchlist', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyId: id }) });
                if (response.ok) { setItems((current) => current.filter((item) => item !== id)); return; }
            } catch { /* Fall through to local storage. */ }
        }
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
            <div className="mt-3 text-sm text-slate-400">{persistent ? "Saved companies are available across this browser session." : "Saved companies are stored locally in your browser."}</div>
            <div className="mt-3">
                {items.length === 0 ? <div className="text-sm text-slate-400">No items yet</div> : (
                    <ul className="space-y-2">
                        {items.map((id) => { const company = companies.find((item) => item.id === id); return <li key={id} className="rounded border p-2"><p className="truncate text-sm text-slate-200">{company?.name ?? id}</p><div className="mt-2 flex gap-2"><button disabled={!company} onClick={() => company && onView(company)} className="rounded bg-white/6 px-2 py-1 text-xs disabled:opacity-40">View</button><button disabled={!company} onClick={() => company && onCompare(company)} className="rounded bg-white/6 px-2 py-1 text-xs disabled:opacity-40">Compare</button><button onClick={() => void remove(id)} className="rounded bg-white/6 px-2 py-1 text-xs">Remove</button></div></li>; })}
                    </ul>
                )}
            </div>
        </div>
    );
}
