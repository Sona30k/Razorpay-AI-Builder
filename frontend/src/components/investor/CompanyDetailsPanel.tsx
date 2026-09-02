"use client";

import type { Company } from "@/types/company";
import { companySector, formatFunding, investorNames } from "@/lib/investor";

export default function CompanyDetailsPanel({ company, onClose }: { company: Company | null; onClose: () => void }) {
  if (!company) return null;
  const investors = investorNames(company);
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-label={`${company.name} details`}>
    <section className="theme-surface flex h-full w-full max-w-md flex-col overflow-y-auto rounded-lg border p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.16em] text-sky-300">Company intelligence</p><h2 className="mt-2 text-2xl font-semibold">{company.name}</h2><p className="mt-1 text-sm text-slate-400">{companySector(company)} · {company.city || "Not available"}</p></div><button onClick={onClose} className="rounded border border-white/10 px-2 py-1 text-sm text-slate-300 hover:bg-white/5">Close</button></div>
      <div className="mt-6 grid grid-cols-2 gap-3"><Detail label="Funding" value={formatFunding(company)} /><Detail label="Location" value={company.city || "Not available"} /><Detail label="Business model" value={company.businessModel || "Insufficient data available."} /><Detail label="Data confidence" value={[company.city, company.description, companySector(company)].filter(Boolean).length >= 3 ? "Medium" : "Low"} /></div>
      <div className="mt-6"><p className="text-xs uppercase tracking-[0.14em] text-slate-400">Description</p><p className="mt-2 text-sm leading-6 text-slate-200">{company.description || "Insufficient data available."}</p></div>
      <div className="mt-6"><p className="text-xs uppercase tracking-[0.14em] text-slate-400">Investors</p><div className="mt-2 flex flex-wrap gap-2">{investors.length ? investors.map((investor) => <span key={investor} className="rounded border border-sky-400/20 bg-sky-500/10 px-2 py-1 text-xs text-sky-100">{investor}</span>) : <p className="text-sm text-slate-400">Insufficient data available.</p>}</div></div>
      {company.website ? <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-fit rounded border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-100 hover:bg-sky-500/20">Visit website</a> : null}
    </section>
  </div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded border border-white/10 p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 break-words text-sm text-slate-100">{value}</p></div>; }
