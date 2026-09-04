"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Company } from "@/types/company";
import InvestorRadarDashboard from "@/components/investor/InvestorRadarDashboard";

export default function InvestorRadarPage() {
    const [companies, setCompanies] = useState<Company[]>([]);

    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const previousHtmlOverflow = html.style.overflow;
        const previousBodyOverflow = body.style.overflow;

        html.style.overflow = "auto";
        body.style.overflow = "auto";

        return () => {
            html.style.overflow = previousHtmlOverflow;
            body.style.overflow = previousBodyOverflow;
        };
    }, []);

    useEffect(() => {
        fetch('/company-data/companies.json')
            .then((r) => r.ok ? r.json() : [])
            .then((data) => setCompanies(Array.isArray(data) ? data as Company[] : []))
            .catch(() => setCompanies([]));
    }, []);

    return (
        <div className="investor-radar atlas-bg min-h-screen">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-wide">INVESTOR RADAR</h1>
                        <p className="mt-1 text-sm text-slate-300">Discover India's technology companies through funding, sector, geography, and business intelligence.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/" aria-label="Back to globe" className="inline-flex items-center gap-2 rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400 hover:bg-slate-800">
                            <span aria-hidden="true">←</span>
                            Back
                        </Link>
                    </div>
                </div>

                <div className="mt-6">
                    <InvestorRadarDashboard companies={companies} />
                </div>
            </div>
        </div>
    );
}
