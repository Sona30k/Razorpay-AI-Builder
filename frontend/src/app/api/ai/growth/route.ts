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

export async function POST(request: Request) {
  try {
    const { company } = await request.json() as { company?: Company };
    if (!company || !companyText(company.name) || !companyText(company.city)) {
      return NextResponse.json({ error: "Invalid company data." }, { status: 400 });
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
    if (!completion.ok) throw new Error("Provider request failed");
    const payload = await completion.json();
    const content = payload.choices?.[0]?.message?.content;
    const analysis = typeof content === "string" ? JSON.parse(content) : null;
    if (!isGrowthAnalysis(analysis)) throw new Error("Invalid provider response");
    return NextResponse.json({ analysis });
  } catch {
    return NextResponse.json({ error: "Unable to generate growth analysis right now." }, { status: 502 });
  }
}
