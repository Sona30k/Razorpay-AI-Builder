export type GrowthAnalysis = {
  opportunity: string;
  why: string;
  targetSegment: string;
  strategy: string;
  expectedImpact: string;
  difficulty: "Low" | "Medium" | "High";
  priority: "Low" | "Medium" | "High";
  kpis: string[];
};

const levels = new Set(["Low", "Medium", "High"]);

export function isGrowthAnalysis(value: unknown): value is GrowthAnalysis {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Record<string, unknown>;
  return ["opportunity", "why", "targetSegment", "strategy", "expectedImpact"].every((key) => typeof analysis[key] === "string" && analysis[key].trim())
    && typeof analysis.difficulty === "string" && levels.has(analysis.difficulty)
    && typeof analysis.priority === "string" && levels.has(analysis.priority)
    && Array.isArray(analysis.kpis) && analysis.kpis.length > 0 && analysis.kpis.every((kpi) => typeof kpi === "string");
}

export type GrowthPlan = {
  goal: string;
  strategy: string;
  expectedOutcome: string;
  actions: Array<{ title: string; description: string; priority: "Low" | "Medium" | "High"; timeline: string; kpi: string; expectedOutcome: string }>;
  risks: string[];
};

export type GrowthPlanAction = GrowthPlan["actions"][number];

export function isGrowthPlan(value: unknown): value is GrowthPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Record<string, unknown>;
  return typeof plan.goal === "string" && typeof plan.strategy === "string" && typeof plan.expectedOutcome === "string" && Array.isArray(plan.risks)
    && Array.isArray(plan.actions) && plan.actions.length >= 4 && plan.actions.length <= 6
    && plan.actions.every((action) => action && typeof action === "object" && ["title", "description", "timeline", "kpi", "expectedOutcome"].every((key) => typeof (action as Record<string, unknown>)[key] === "string") && levels.has((action as Record<string, unknown>).priority as string));
}
