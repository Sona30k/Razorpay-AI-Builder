import { NextResponse } from "next/server";
import { deriveMerchantGrowth, type MerchantData, type MerchantOpportunity } from "@/lib/merchant";
import { generateAiJson, AiProviderError, isMockAiMode } from "@/lib/ai-provider";
export const runtime = "nodejs";
const types = new Set(["upsell", "cross_sell", "product_improvement", "campaign"]);
const priorities = new Set(["High", "Medium", "Low"]);
function validData(value: unknown): value is MerchantData { return !!value && typeof value === "object" && Array.isArray((value as MerchantData).products) && Array.isArray((value as MerchantData).combinations) && (value as MerchantData).products.length > 0; }
function validatedOutput(value: unknown, merchant: MerchantData): { summary: string; opportunities: MerchantOpportunity[] } | null {
  if (!value || typeof value !== "object") return null;

  const data = value as Record<string, unknown>;
  if (typeof data.summary !== "string" || !Array.isArray(data.opportunities)) return null;

  const productNames = new Set(merchant.products.map((product) => product.product));
  const evidenceNumbers = [
    ...merchant.products.flatMap((product) => [product.views, product.detailViews, product.addToCart, product.purchases, product.revenue]),
    ...merchant.combinations.map((combination) => combination.customersPurchasingBoth),
  ].map(String);

  const opportunities = data.opportunities.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Partial<MerchantOpportunity>;
    const type = typeof candidate.type === "string" ? candidate.type.replace(/-/g, "_") : "";
    const priority = typeof candidate.priority === "string" ? `${candidate.priority.charAt(0).toUpperCase()}${candidate.priority.slice(1).toLowerCase()}` : "";
    const evidence = typeof candidate.evidence === "string" ? candidate.evidence : "";
    const normalizedEvidence = evidence.replace(/[^0-9]/g, "");

    if (!types.has(type) || !priorities.has(priority) || typeof candidate.product !== "string" || !productNames.has(candidate.product) || (candidate.relatedProduct && !productNames.has(candidate.relatedProduct)) || !evidenceNumbers.some((number) => normalizedEvidence.includes(number)) || typeof candidate.recommendation !== "string" || typeof candidate.expectedImpact !== "string" || !Array.isArray(candidate.metrics) || candidate.metrics.length === 0) return [];

    return [{
      id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id : `merchant-opportunity-${index + 1}`,
      type: type as MerchantOpportunity["type"],
      title: typeof candidate.title === "string" && candidate.title.trim() ? candidate.title : candidate.product,
      priority: priority as MerchantOpportunity["priority"],
      product: candidate.product,
      relatedProduct: typeof candidate.relatedProduct === "string" ? candidate.relatedProduct : "",
      evidence,
      recommendation: candidate.recommendation,
      expectedImpact: candidate.expectedImpact,
      metrics: candidate.metrics.filter((metric): metric is string => typeof metric === "string"),
    }];
  });

  return opportunities.length ? { summary: data.summary, opportunities } : null;
}
export async function POST(request: Request) { try { const { merchant } = await request.json() as { merchant?: MerchantData }; if (!validData(merchant)) return NextResponse.json({ error: "Invalid merchant data." }, { status: 400 }); if (isMockAiMode()) return NextResponse.json({ summary: "DEMO MODE — Opportunities are deterministically derived from the supplied historical merchant event data.", opportunities: deriveMerchantGrowth(merchant), demo: true }); const output = await generateAiJson(`Use only this merchant data: ${JSON.stringify(merchant)}. Return JSON only. Generate 3 or 4 opportunities. Each opportunity must use one exact type value: "upsell", "cross_sell", "product_improvement", or "campaign". Never write a pipe character in type. Each priority must be exactly "High", "Medium", or "Low". product and relatedProduct must exactly match product names in the data. Every evidence string must name a supplied product and include one exact supplied number. Do not invent values, relationships, or product names. Required shape: {"summary":"string","opportunities":[{"id":"string","type":"product_improvement","title":"string","priority":"High","product":"exact product from data","relatedProduct":"","evidence":"exact product and supplied number","recommendation":"string","expectedImpact":"string","metrics":["string"]}]}.`, 1800); const result = validatedOutput(output, merchant); if (!result) return NextResponse.json({ error: "Growth analysis is temporarily unavailable. Please try again later." }, { status: 502 }); return NextResponse.json({ ...result, demo: false }); } catch (error) { const status = error instanceof AiProviderError ? error.status : undefined; return NextResponse.json({ error: "Growth analysis is temporarily unavailable. Please try again later." }, { status: status === 429 ? 429 : 502 }); } }
