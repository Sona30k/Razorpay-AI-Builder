"use client";

import type { Company } from "@/types/company";
import { companySector, formatFunding, investorNames } from "@/lib/investor";

type Props = {
  companies: Company[];
  onClose: () => void;
};

export default function ComparePanel({ companies, onClose }: Props) {
  if (companies.length < 2) return null;

  const rows = [
    { label: "City", value: (company: Company) => company.city || "Not available" },
    { label: "Industry", value: companySector },
    { label: "Funding", value: formatFunding },
    { label: "Investors", value: (company: Company) => investorNames(company).join(", ") || "Not available" },
    { label: "Website", value: (company: Company) => company.website || "Not available" },
    { label: "Data confidence", value: (company: Company) => [company.city, companySector(company), company.description].filter(Boolean).length >= 3 ? "Medium" : "Low" },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Company comparison">
      <section className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-slate-600 bg-slate-900 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.6)] sm:max-h-[calc(100vh-3rem)]">
        <header className="flex items-center justify-between gap-4 border-b border-slate-700 px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-sky-300">Investor Radar</p>
            <h3 className="mt-1 text-base font-semibold sm:text-lg">Company Comparison</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 transition hover:border-sky-400 hover:bg-slate-700">Close</button>
        </header>

        <div className="overflow-auto p-3 sm:p-5">
          <table className="min-w-[44rem] w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-slate-900 text-slate-100">
              <tr className="border-b border-slate-700">
                <th scope="col" className="w-36 px-3 py-3 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Field</th>
                {companies.map((company) => <th key={company.id} scope="col" className="min-w-[15rem] px-3 py-3 font-semibold text-slate-50">{company.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-slate-800 last:border-0">
                  <th scope="row" className="bg-slate-900/60 px-3 py-3 align-top text-xs font-medium uppercase tracking-[0.1em] text-slate-400">{row.label}</th>
                  {companies.map((company) => <td key={company.id} className="break-words px-3 py-3 align-top leading-6 text-slate-100">{row.value(company)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
