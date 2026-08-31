import { LOADING_STAGES } from "@/lib/constants";

type LoadingTextProps = {
  progress: number;
};

export function LoadingText({ progress }: LoadingTextProps) {
  const currentStage =
    LOADING_STAGES.find((stage) => progress >= stage.from && progress < stage.to) ??
    LOADING_STAGES[LOADING_STAGES.length - 1];

  return (
    <p
      key={currentStage.message}
      className="min-h-6 animate-[statusFade_420ms_ease-out] text-sm text-slate-300 sm:text-base"
      aria-live="polite"
    >
      {currentStage.message}
    </p>
  );
}
