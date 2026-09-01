import { NextResponse } from "next/server";
import type { GrowthPlanAction } from "@/lib/growth-analysis";
import type { Company } from "@/types/company";

export const runtime = "nodejs";

const validActions = new Set(["Create Campaign", "Create Landing Page", "Create Customer Segment", "Create Payment Link", "Track Conversion"]);

function isPlanAction(value: unknown): value is GrowthPlanAction {
  if (!value || typeof value !== "object") return false;
  const action = value as Record<string, unknown>;
  return ["title", "description", "priority", "timeline", "kpi", "expectedOutcome"].every((key) => typeof action[key] === "string" && action[key]);
}

function demoResult(company: Company, action: GrowthPlanAction, commerceAction: string) {
  if (commerceAction === "Create Payment Link") {
    const id = `${company.id}-${action.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return { title: "Payment link created", message: `A test payment link for ${company.name}'s growth campaign is ready for internal testing only.`, paymentLink: `https://demo.techatlas.local/pay/${id}`, transactionStatus: "Created" as const };
  }
  const outcomes: Record<string, string> = {
    "Create Campaign": `A demo campaign brief for ${action.title} is ready to review.`,
    "Create Landing Page": `A demo landing-page brief for ${company.name} is ready to review.`,
    "Create Customer Segment": `A demo ${company.city} customer segment is ready to review.`,
    "Track Conversion": "A demo conversion tracking checklist is ready to review.",
  };
  return { title: `${commerceAction} completed`, message: outcomes[commerceAction] ?? "The demo commerce action is ready to review." };
}

export async function POST(request: Request) {
  try {
    const { company, action, commerceAction } = await request.json() as { company?: Company; action?: unknown; commerceAction?: unknown };
    if (!company?.id || !company.name || !company.city || !isPlanAction(action) || typeof commerceAction !== "string" || !validActions.has(commerceAction)) return NextResponse.json({ error: "Invalid commerce input." }, { status: 400 });
    if (process.env.MOCK_COMMERCE_MODE === "true") return NextResponse.json({ result: demoResult(company, action, commerceAction), demo: true });
    return NextResponse.json({ error: "Commerce actions are not configured yet." }, { status: 503 });
  } catch {
    return NextResponse.json({ error: "Unable to complete this action." }, { status: 502 });
  }
}
