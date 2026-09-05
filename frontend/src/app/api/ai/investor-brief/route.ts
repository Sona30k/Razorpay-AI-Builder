import { NextResponse } from "next/server";
import type { Company } from "@/types/company";
import { companySector, formatFunding, investorNames } from "@/lib/investor";
import { generateAiJson, AiProviderError, isMockAiMode } from "@/lib/ai-provider";

export const runtime = "nodejs";
type Signal = { type: string; title: string; evidence: string; confidence: "Low" | "Medium" | "High" };

function demo(companies: Company[]) {
  const company = companies[0];
  const signals: Signal[] = !company ? [] : [
    { type: "Funding", title: formatFunding(company), evidence: company.funding ? "Reported funding field is available in TechAtlas." : "Funding is not disclosed in the available company record.", confidence: company.funding ? "Medium" : "Low" },
    { type: "Sector", title: companySector(company), evidence: "Sector is taken from the TechAtlas company profile.", confidence: companySector(company) === "Not available" ? "Low" : "High" },
    { type: "Geography", title: company.city || "Not available", evidence: company.city ? `Company record is associated with ${company.city}.` : "No city is available.", confidence: company.city ? "High" : "Low" },
  ];
  return { summary: `DEMO MODE — ${company ? `${company.name} is represented in the TechAtlas dataset as a ${companySector(company)} company in ${company.city || "an undisclosed city"}.` : "No company was provided."}`, signals, researchQuestions: company ? [`Which recent operating signals could validate ${company.name}'s customer traction?`, `Which comparable ${companySector(company)} companies are relevant for portfolio benchmarking?`] : [], note: "This is a research summary based only on available TechAtlas dataset information." };
}

function valid(value: unknown): value is { summary: string; signals: Signal[]; researchQuestions: string[]; note: string } {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return typeof data.summary === "string" && typeof data.note === "string" && Array.isArray(data.researchQuestions) && data.researchQuestions.every((item) => typeof item === "string") && Array.isArray(data.signals) && data.signals.every((signal) => signal && typeof signal === "object" && typeof (signal as Signal).type === "string" && typeof (signal as Signal).title === "string" && typeof (signal as Signal).evidence === "string" && ["Low", "Medium", "High"].includes((signal as Signal).confidence));
}

export async function POST(request: Request) {
  let companies: Company[] | undefined;
  try {
    ({ companies } = await request.json() as { companies?: Company[] });
    if (!Array.isArray(companies) || companies.length === 0) return NextResponse.json({ error: "At least one company is required." }, { status: 400 });
    if (isMockAiMode()) return NextResponse.json({ ...demo(companies), demo: true });
    const facts = companies.slice(0, 5).map((company) => ({ name: company.name, city: company.city, sector: companySector(company), funding: formatFunding(company), investors: investorNames(company) }));
    const result = await generateAiJson(`Use only these TechAtlas company facts: ${JSON.stringify(facts)}. Do not invent facts. Return JSON only with {summary,signals:[{type,title,evidence,confidence}],researchQuestions,note}. confidence must be Low, Medium, or High. note must say this is based on available TechAtlas dataset information.`, 1200, 15_000);
    if (!valid(result)) return NextResponse.json({ ...demo(companies), demo: true, fallback: true });
    return NextResponse.json({ ...result, demo: false });
  } catch (error) {
    if (Array.isArray(companies) && companies.length) return NextResponse.json({ ...demo(companies), demo: true, fallback: true });
    const status = error instanceof AiProviderError ? error.status : undefined;
    return NextResponse.json({ error: "Investor brief is temporarily unavailable. Please try again later." }, { status: status === 429 ? 429 : 502 });
  }
}
