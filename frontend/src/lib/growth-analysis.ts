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
