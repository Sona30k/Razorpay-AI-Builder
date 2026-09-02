import type { Company } from "@/types/company";
import { companyFunding, companyIndustry, companyInvestors, companyText } from "@/lib/companies";

type Props = {
    company: Company | null;
    onClose: () => void;
    onExploreAI: () => void;
    hasAnalysis?: boolean;
};

export function CompanyPanel({ company, onClose, onExploreAI, hasAnalysis = false }: Props) {
    if (!company) return null;

    const category = companyText(company.category);
    const industry = companyIndustry(company);
    const description = companyText(company.description);
    const address = companyText(company.address);
    const website = companyText(company.website);
    const funding = companyFunding(company);
    const investors = companyInvestors(company);
    const categoryLine = [category, industry && industry !== category ? industry : undefined, companyText(company.city)]
        .filter(Boolean)
        .join(" · ");

    return (
        <aside className={`theme-surface pointer-events-auto absolute left-5 top-24 z-20 max-h-[calc(100%-20rem)] w-[min(18rem,calc(100%-2.5rem))] overflow-y-auto rounded-lg border border-white/10 bg-slate-950/85 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.38)] backdrop-blur-md text-slate-100 lg:left-[16rem] lg:top-32 lg:max-h-[calc(100%-9rem)] lg:w-[17.5rem] xl:w-[22rem] ${hasAnalysis ? "hidden" : ""}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-base font-semibold tracking-wide">{company.name}</p>
                    {categoryLine ? <p className="mt-1 text-xs text-sky-300">{categoryLine}</p> : null}
                </div>
                <button type="button" onClick={onClose} aria-label="Close company details" className="text-slate-400 transition hover:text-white">✕</button>
            </div>

            {description ? <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p> : null}

            {address ? <section className="mt-4 text-sm">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Location</p>
                <p className="mt-1 text-sm text-slate-200">{address}</p>
            </section> : null}

            {funding ? <section className="mt-4 text-sm">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Funding</p>
                <p className="mt-1 text-sm text-slate-200">{funding}</p>
            </section> : null}

            {investors ? <section className="mt-4 text-sm">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Investors</p>
                <p className="mt-1 text-sm text-slate-200">{investors}</p>
            </section> : null}

            {website ? <div className="mt-5 border-t border-white/10 pt-3">
                <a href={website} target="_blank" rel="noreferrer" className="text-xs font-medium text-sky-300 transition hover:text-sky-100">Open website ↗</a>
            </div> : null}

            <button
                type="button"
                onClick={onExploreAI}
                className="mt-5 w-full rounded-md border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-left text-xs font-medium text-sky-100 transition hover:bg-sky-400/20"
            >
                Explore with AI →
            </button>
        </aside>
    );
}
