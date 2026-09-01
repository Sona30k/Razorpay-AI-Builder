import { NextResponse } from "next/server";
import { isGrowthAnalysis } from "@/lib/growth-analysis";
import type { Company } from "@/types/company";
import { companyFunding, companyIndustry, companyInvestors, companyText } from "@/lib/companies";

export const runtime = "nodejs";

function companyContext(company: Company) {
  const fields: Record<string, string> = {};
  const add = (key: string, value: unknown) => {
    const text = companyText(value);
    if (text) fields[key] = text;
  };

  add("name", company.name);
  add("city", company.city);
  add("state", company.state);
  add("category", company.category);
  add("industry", companyIndustry(company));
  add("description", company.description);
  add("website", company.website);
  add("address", company.address);
  add("funding", companyFunding(company));
  add("investors", companyInvestors(company));
  return fields;
}

function demoAnalysis(company: Company) {
  const industry = companyIndustry(company) ?? companyText(company.category) ?? "technology";
  const city = companyText(company.city) ?? "its primary market";
  const funding = companyFunding(company);
  return {
    opportunity: `Build a focused ${industry} acquisition motion in ${city}.`,
    why: funding ? `The available funding context supports a measured go-to-market experiment, while the company can use its ${industry} positioning to focus demand.` : `The company's ${industry} positioning provides a clear base for a focused acquisition experiment.`,
    targetSegment: `High-intent customers and businesses in ${city} that need a clearer ${industry} solution.`,
    strategy: `Define one priority segment, create a segment-specific value proposition, and run a short partner and lifecycle campaign with weekly measurement.`,
    expectedImpact: "A clearer acquisition funnel, stronger activation, and a repeatable channel to scale after validation.",
    difficulty: "Medium" as const,
    priority: "High" as const,
    kpis: ["Qualified acquisition", "Activation rate", "Conversion rate", "Customer acquisition cost"]
  };
}

export async function POST(request: Request) {
  try {
    const { company } = await request.json() as { company?: Company };
    if (!company || !companyText(company.name) || !companyText(company.city)) {
      return NextResponse.json({ error: "Invalid company data." }, { status: 400 });
    }

    if (process.env.MOCK_AI_MODE === "true") {
      return NextResponse.json({ analysis: demoAnalysis(company), demo: true });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI analysis is not configured." }, { status: 503 });
    }

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.35,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "growth_analysis",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["opportunity", "why", "targetSegment", "strategy", "expectedImpact", "difficulty", "priority", "kpis"],
              properties: {
                opportunity: { type: "string" }, why: { type: "string" }, targetSegment: { type: "string" }, strategy: { type: "string" }, expectedImpact: { type: "string" },
                difficulty: { type: "string", enum: ["Low", "Medium", "High"] }, priority: { type: "string", enum: ["Low", "Medium", "High"] },
                kpis: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 }
              }
            }
          }
        },
        messages: [
          { role: "system", content: "You are a careful growth strategist. Base analysis only on supplied company facts. Do not claim unprovided facts. Give concrete, concise, commercially plausible recommendations." },
          { role: "user", content: `Analyze this company for one prioritized growth opportunity: ${JSON.stringify(companyContext(company))}` }
        ]
      })
    });
    if (!completion.ok) {
      const providerBody = await completion.json().catch(() => null) as { error?: { code?: string } } | null;
      console.error("OpenAI growth request failed", completion.status, providerBody?.error?.code ?? "no-code");
      return NextResponse.json(
        { error: "Unable to generate growth analysis right now." },
        { status: completion.status === 429 ? 429 : 502 }
      );
    }
    const payload = await completion.json();
    const content = payload.choices?.[0]?.message?.content;
    const analysis = typeof content === "string" ? JSON.parse(content) : null;
    if (!isGrowthAnalysis(analysis)) throw new Error("Invalid provider response");
    return NextResponse.json({ analysis, demo: false });
  } catch (error) {
    console.error("Growth analysis failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to generate growth analysis right now." }, { status: 502 });
  }
}
