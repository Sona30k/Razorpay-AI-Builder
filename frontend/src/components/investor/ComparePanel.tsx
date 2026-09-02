"use client";

import React from "react";
import type { Company } from "@/types/company";
import { companySector, formatFunding, investorNames } from "@/lib/investor";

export default function ComparePanel({ companies, onClose }: { companies: Company[]; onClose: any }) {
    if (!companies || companies.length === 0) return null;
    return (
        <div className="fixed inset-0 z-40 flex items-end justify-center">
            <div className="theme-surface w-full max-w-6xl rounded-t-lg border p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">COMPANY COMPARISON</h3>
                    <button onClick={onClose} className="rounded bg-white/6 px-2 py-1">Close</button>
                </div>
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                <th className="text-left">Field</th>
                                {companies.map(c => <th key={c.id} className="text-left pl-4">{c.name}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td className="text-slate-400">City</td>{companies.map(c => <td key={c.id} className="pl-4">{c.city || 'Not available'}</td>)}</tr>
                            <tr><td className="text-slate-400">Industry</td>{companies.map(c => <td key={c.id} className="pl-4">{companySector(c)}</td>)}</tr>
                            <tr><td className="text-slate-400">Funding</td>{companies.map(c => <td key={c.id} className="pl-4">{formatFunding(c)}</td>)}</tr>
                            <tr><td className="text-slate-400">Investors</td>{companies.map(c => <td key={c.id} className="pl-4">{investorNames(c).join(', ') || 'Not available'}</td>)}</tr>
                            <tr><td className="text-slate-400">Website</td>{companies.map(c => <td key={c.id} className="pl-4">{c.website || 'Not available'}</td>)}</tr>
                            <tr><td className="text-slate-400">Data confidence</td>{companies.map(c => <td key={c.id} className="pl-4">{[c.city, companySector(c), c.description].filter(Boolean).length >= 3 ? 'Medium' : 'Low'}</td>)}</tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
