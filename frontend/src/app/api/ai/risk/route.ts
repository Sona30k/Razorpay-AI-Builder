import { NextResponse } from "next/server";
import { generateOllamaJson, OllamaProviderError } from "@/lib/ollama";
import type { Company } from "@/types/company";
import { isGrowthAnalysis } from "@/lib/growth-analysis";
import { companyIndustry, companyText } from "@/lib/companies";
export const runtime = "nodejs";
const levels = new Set(["Low", "Medium", "High"]);
const riskCategories = ["Competition Risk", "Market Risk", "Funding Risk", "Customer Acquisition Risk", "Execution Risk", "Geographic Risk"];

type RiskAnalysis = { overallRisk: "Low" | "Medium" | "High"; overallScore: number; summary: string; keyRisk: string; recommendation: string; risks: { category: string; level: "Low" | "Medium" | "High"; score: number; reason: string; mitigation: string }[] };

function normalizedLevel(value: unknown) {
  if (typeof value !== "string") return null;
  const level = `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}`;
  return levels.has(level) ? level as RiskAnalysis["overallRisk"] : null;
}

function normalizedAnalysis(value: unknown): RiskAnalysis | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.risks) || data.risks.length !== 6 || typeof data.summary !== "string" || typeof data.keyRisk !== "string" || typeof data.recommendation !== "string") return null;

  const risks = data.risks.map((item) => {
    if (!item || typeof item !== "object") return null;
    const risk = item as Record<string, unknown>;
    const level = normalizedLevel(risk.level);
    const score = typeof risk.score === "number" ? risk.score : Number(risk.score);
    if (typeof risk.category !== "string" || !level || !Number.isFinite(score) || score < 0 || score > 100 || typeof risk.reason !== "string" || typeof risk.mitigation !== "string") return null;
    return { category: risk.category, level, score: Math.round(score), reason: risk.reason, mitigation: risk.mitigation };
  });

  if (risks.some((risk) => !risk) || new Set(risks.map((risk) => risk!.category.toLowerCase())).size !== riskCategories.length) return null;
  if (!riskCategories.every((category) => risks.some((risk) => risk!.category.toLowerCase() === category.toLowerCase()))) return null;

  const averageScore = Math.round(risks.reduce((total, risk) => total + risk!.score, 0) / risks.length);
  const overallRisk = normalizedLevel(data.overallRisk) ?? (averageScore > 66 ? "High" : averageScore > 40 ? "Medium" : "Low");
  const rawOverallScore = typeof data.overallScore === "number" ? data.overallScore : Number(data.overallScore);
  const overallScore = Number.isFinite(rawOverallScore) && rawOverallScore >= 0 && rawOverallScore <= 100 ? Math.round(rawOverallScore) : averageScore;

  return { overallRisk, overallScore, summary: data.summary, keyRisk: data.keyRisk, recommendation: data.recommendation, risks: risks as RiskAnalysis["risks"] };
}
function demo(company: Company) { const seed = [...`${company.id}-${company.city}-${company.category}`].reduce((total, character) => (total * 31 + character.charCodeAt(0)) % 53, 0); const risks = ["Competition", "Market", "Funding", "Customer Acquisition", "Execution", "Geographic"].map((category, index) => { const score = 28 + ((seed + index * 11) % 48); return { category: `${category} Risk`, level: score > 66 ? "High" as const : score > 40 ? "Medium" as const : "Low" as const, score, reason: company.description ? `TechAtlas estimated ${category.toLowerCase()} risk from the available ${company.city} company profile.` : "Insufficient data available.", mitigation: "Validate assumptions with focused research and measured pilots." }; }); const key = risks.slice().sort((a, b) => b.score - a.score)[0]; const overallScore = Math.round(risks.reduce((total, risk) => total + risk.score, 0) / risks.length); return { overallRisk: overallScore > 66 ? "High" : overallScore > 40 ? "Medium" : "Low", overallScore, summary: `TechAtlas estimated risks based on available company and market information for ${company.name}.`, risks, keyRisk: key.category, recommendation: `Prioritize ${key.category.toLowerCase()} before scaling.` }; }
export async function POST(request: Request) { try { const { company, growthAnalysis } = await request.json() as { company?: Company; growthAnalysis?: unknown }; if (!company || !companyText(company.name)) return NextResponse.json({ error: "Invalid company data." }, { status: 400 }); if (growthAnalysis && !isGrowthAnalysis(growthAnalysis)) return NextResponse.json({ error: "Invalid growth analysis provided." }, { status: 400 }); const validGrowthAnalysis = isGrowthAnalysis(growthAnalysis) ? growthAnalysis : null; if (process.env.MOCK_AI_MODE === "true") return NextResponse.json({ analysis: demo(company), demo: true }); const compactGrowth = validGrowthAnalysis ? { opportunity: validGrowthAnalysis.opportunity.slice(0, 360), targetSegment: validGrowthAnalysis.targetSegment.slice(0, 240), strategy: validGrowthAnalysis.strategy.slice(0, 360) } : null; const compactCompany = { name: companyText(company.name), city: companyText(company.city), industry: companyIndustry(company), category: companyText(company.category), description: companyText(company.description)?.slice(0, 500) ?? "Insufficient data available." }; const value = await generateOllamaJson(`Use only the supplied company facts and growth analysis. Return JSON only with exactly six risks in this order: Competition Risk, Market Risk, Funding Risk, Customer Acquisition Risk, Execution Risk, Geographic Risk. Each risk must have category, level, score, reason, and mitigation. level must be exactly "Low", "Medium", or "High". score must be an integer from 0 to 100. overallRisk must be exactly "Low", "Medium", or "High". Do not use pipe characters in any enum value. Required shape: {"overallRisk":"Medium","overallScore":50,"summary":"string","keyRisk":"string","recommendation":"string","risks":[{"category":"Competition Risk","level":"Medium","score":50,"reason":"string","mitigation":"string"},{"category":"Market Risk","level":"Medium","score":50,"reason":"string","mitigation":"string"},{"category":"Funding Risk","level":"Medium","score":50,"reason":"string","mitigation":"string"},{"category":"Customer Acquisition Risk","level":"Medium","score":50,"reason":"string","mitigation":"string"},{"category":"Execution Risk","level":"Medium","score":50,"reason":"string","mitigation":"string"},{"category":"Geographic Risk","level":"Medium","score":50,"reason":"string","mitigation":"string"}]}. Do not invent facts; state "Insufficient data available." when company information is missing. Company: ${JSON.stringify(compactCompany)}. Growth analysis: ${JSON.stringify(compactGrowth)}.`, 1400); const analysis = normalizedAnalysis(value); if (!analysis) return NextResponse.json({ error: "Unable to generate risk analysis right now." }, { status: 502 }); return NextResponse.json({ analysis, demo: false }); } catch (error) { const status = error instanceof OllamaProviderError ? error.status : undefined; return NextResponse.json({ error: "Unable to generate risk analysis right now." }, { status: status === 429 ? 429 : 502 }); } }
