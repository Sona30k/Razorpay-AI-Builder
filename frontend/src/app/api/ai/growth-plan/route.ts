import { NextResponse } from "next/server";
import { isGrowthAnalysis, isGrowthPlan, type GrowthAnalysis } from "@/lib/growth-analysis";
import type { Company } from "@/types/company";

export const runtime = "nodejs";

function demoPlan(company: Company, analysis: GrowthAnalysis) {
  const segment = company.city || "the priority market";
  return {
    goal: analysis.opportunity,
    strategy: analysis.strategy,
    actions: [
      { title: "Define priority segment", description: `Document the highest-intent ${segment} segment and its core need.`, priority: "High", timeline: "Week 1", kpi: "Qualified leads", expectedOutcome: "A focused ideal customer profile." },
      { title: "Create focused proposition", description: "Turn the growth opportunity into one segment-specific landing and sales message.", priority: "High", timeline: "Week 1-2", kpi: "Conversion rate", expectedOutcome: "A clearer path from interest to activation." },
      { title: "Launch channel experiment", description: "Run one measurable partner or lifecycle campaign for the priority segment.", priority: "High", timeline: "Week 2-4", kpi: "Activated customers", expectedOutcome: "Evidence for the most effective acquisition channel." },
      { title: "Instrument the funnel", description: "Track acquisition, activation, conversion, and customer acquisition cost weekly.", priority: "Medium", timeline: "Week 2", kpi: "Funnel completion", expectedOutcome: "Reliable weekly growth decisions." },
      { title: "Scale validated motion", description: "Expand the best-performing segment and channel after the initial measurement cycle.", priority: "Medium", timeline: "Week 5-6", kpi: "Growth rate", expectedOutcome: analysis.expectedImpact }
    ],
    expectedOutcome: analysis.expectedImpact,
    risks: ["Weak segment-message fit", "Insufficient conversion data", "Channel acquisition cost exceeding target"]
  };
}

export async function POST(request: Request) {
  try {
    const { company, analysis } = await request.json() as { company?: Company; analysis?: unknown };
    if (!company?.name || !company.city || !isGrowthAnalysis(analysis)) return NextResponse.json({ error: "Invalid planning input." }, { status: 400 });
    if (process.env.MOCK_AI_MODE === "true") return NextResponse.json({ plan: demoPlan(company, analysis), demo: true });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "AI planning is temporarily unavailable. Please try again later." }, { status: 503 });
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", temperature: 0.3, response_format: { type: "json_object" }, messages: [
        { role: "system", content: "Create a concise, practical growth execution plan. Return only JSON with goal, strategy, expectedOutcome, actions (4-6), and risks. Every action needs title, description, priority (Low/Medium/High), timeline, kpi, expectedOutcome. Do not invent company facts." },
        { role: "user", content: JSON.stringify({ company: { name: company.name, city: company.city, state: company.state, category: company.category, description: company.description, website: company.website }, growthAnalysis: analysis }) }
      ] })
    });
    if (!response.ok) return NextResponse.json({ error: "AI planning is temporarily unavailable. Please try again later." }, { status: response.status === 429 ? 429 : 502 });
    const payload = await response.json();
    const plan = JSON.parse(payload.choices?.[0]?.message?.content ?? "null");
    if (!isGrowthPlan(plan)) throw new Error("Invalid plan response");
    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ error: "AI planning is temporarily unavailable. Please try again later." }, { status: 502 });
  }
}
