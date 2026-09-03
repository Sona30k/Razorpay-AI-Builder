import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export class RazorpayProviderError extends Error {
  constructor(public readonly status: number, message = "Payment provider is unavailable.") {
    super(message);
  }
}

type RazorpayOrder = { id: string; amount: number; currency: string; status: string };

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new RazorpayProviderError(503, "Payments are not configured.");
  if (process.env.RAZORPAY_MODE !== "test") throw new RazorpayProviderError(503, "Only Razorpay test mode is enabled.");
  return { keyId, keySecret };
}

export function razorpayPublicConfig() {
  if (process.env.RAZORPAY_MODE !== "test" || !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return { keyId: process.env.RAZORPAY_KEY_ID, mode: "test" as const };
}

export async function createRazorpayTestOrder(input: { companyId: string; actionTitle: string }) {
  const { keyId, keySecret } = credentials();
  const amount = Number(process.env.RAZORPAY_TEST_AMOUNT_PAISE ?? 10000);
  if (!Number.isSafeInteger(amount) || amount < 100) throw new RazorpayProviderError(500, "Invalid test payment amount.");
  const receipt = `ta_${randomUUID().replace(/-/g, "").slice(0, 30)}`;
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, currency: "INR", receipt, notes: { company_id: input.companyId, action: input.actionTitle, environment: "test" } }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new RazorpayProviderError(response.status);
  const data = await response.json() as RazorpayOrder;
  if (!data.id || data.amount !== amount || data.currency !== "INR") throw new RazorpayProviderError(502);
  return { orderId: data.id, amount: data.amount, currency: data.currency, receipt };
}

export function verifyRazorpayPayment(input: { orderId: string; paymentId: string; signature: string }) {
  const { keySecret } = credentials();
  const expected = createHmac("sha256", keySecret).update(`${input.orderId}|${input.paymentId}`).digest("hex");
  const actual = Buffer.from(input.signature);
  const expectedBuffer = Buffer.from(expected);
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}
