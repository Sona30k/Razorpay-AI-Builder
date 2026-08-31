"use client";

import type { City } from "@/lib/cities";

type CityInfoProps = {
    city: City | null;
};

export function CityInfo({ city }: CityInfoProps) {
    if (!city) {
        return null;
    }

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-3 sm:bottom-6 sm:px-0">
            <div className="pointer-events-auto min-w-[164px] rounded-lg border border-sky-400/20 bg-slate-950/70 px-3.5 py-2.5 shadow-[0_0_24px_rgba(56,189,248,0.12)] backdrop-blur-md">
                <div className="text-[9px] uppercase tracking-[0.22em] text-slate-400">City</div>
                <div className="mt-1.5 text-lg font-semibold text-white">{city.name}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-sky-200">Technology Hub</div>
            </div>
        </div>
    );
}
