import { NextResponse } from "next/server";
import type { Company } from "@/types/company";
import type { GrowthPlanAction } from "@/lib/growth-analysis";
import { createRazorpayTestOrder, RazorpayProviderError, razorpayPublicConfig } from "@/lib/razorpay";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { company, action } = await request.json() as { company?: Company; action?: GrowthPlanAction };
    if (!company?.id || !company.name || !action?.title) return NextResponse.json({ error: "Invalid payment input." }, { status: 400 });
    const config = razorpayPublicConfig();
    if (!config) return NextResponse.json({ error: "Razorpay test mode is not configured." }, { status: 503 });
    const order = await createRazorpayTestOrder({ companyId: company.id, actionTitle: action.title });
    return NextResponse.json({ order, keyId: config.keyId, mode: config.mode });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create a test payment order." }, { status: error instanceof RazorpayProviderError ? error.status : 502 });
  }
}
