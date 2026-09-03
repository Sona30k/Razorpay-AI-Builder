import { NextResponse } from "next/server";
import { RazorpayProviderError, verifyRazorpayPayment } from "@/lib/razorpay";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = await request.json() as Record<string, unknown>;
    if (typeof orderId !== "string" || typeof paymentId !== "string" || typeof signature !== "string") return NextResponse.json({ error: "Invalid payment verification input." }, { status: 400 });
    if (!verifyRazorpayPayment({ orderId, paymentId, signature })) return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    return NextResponse.json({ verified: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to verify payment." }, { status: error instanceof RazorpayProviderError ? error.status : 502 });
  }
}
