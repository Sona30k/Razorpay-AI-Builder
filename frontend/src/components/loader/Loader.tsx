"use client";

import { useEffect, useMemo, useState } from "react";
import { LoadingText } from "@/components/loader/LoadingText";
import { LOADING_DURATION_MS } from "@/lib/constants";

type LoaderProps = {
  onComplete: () => void;
};

export function Loader({ onComplete }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const roundedProgress = useMemo(() => Math.min(100, Math.round(progress)), [progress]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduceMotion ? 900 : LOADING_DURATION_MS;
    const startTime = performance.now();
    let animationFrame = 0;
    let exitTimer = 0;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);

      setProgress(easedProgress * 100);

      if (rawProgress < 1) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      setProgress(100);
      setIsExiting(true);
      exitTimer = window.setTimeout(onComplete, reduceMotion ? 80 : 620);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <section
      className={`absolute inset-0 z-20 flex items-center justify-center overflow-hidden bg-[#050608] px-6 transition-opacity duration-700 ease-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      aria-label="Loading TechAtlas AI"
      aria-busy={!isExiting}
    >
      <div className="loader-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(106,168,255,0.13),transparent_32rem)]" />

      <div className="relative flex w-full max-w-3xl flex-col items-center text-center">
        <p className="animate-[brandEnter_760ms_ease-out_both] text-[clamp(2.8rem,10vw,7.4rem)] font-semibold leading-none tracking-[0.16em] text-white">
          TECHATLAS
        </p>
        <p className="mt-5 animate-[subtitleEnter_900ms_180ms_ease-out_both] text-xs font-medium tracking-[0.38em] text-slate-300 sm:text-sm">
          INDIA&apos;S TECHNOLOGY ECOSYSTEM
        </p>

        <div className="mt-16 w-full max-w-xl animate-[subtitleEnter_900ms_320ms_ease-out_both]">
          <div className="mb-5 flex items-end justify-between gap-6">
            <LoadingText progress={roundedProgress} />
            <span className="min-w-16 text-right text-sm tabular-nums text-slate-100 sm:text-base">
              {roundedProgress}%
            </span>
          </div>

          <div
            className="h-px w-full overflow-hidden bg-white/12"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={roundedProgress}
          >
            <div
              className="h-full bg-gradient-to-r from-atlas-blue via-atlas-cyan to-white shadow-[0_0_24px_rgba(114,243,255,0.55)] transition-[width] duration-150 ease-out"
              style={{ width: `${roundedProgress}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
