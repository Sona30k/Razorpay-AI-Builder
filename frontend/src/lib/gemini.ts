import * as GeminiSdk from "@google/genai";

export class GeminiProviderError extends Error { constructor(public readonly status?: number) { super("Gemini provider request failed"); } }

function parseJson(text: string) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(cleaned) as unknown; } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) throw new SyntaxError("Gemini did not return a JSON object.");
    return JSON.parse(cleaned.slice(start, end + 1)) as unknown;
  }
}

function retryDelay(error: unknown, status: number | undefined) {
  if (status !== 429) return 700;
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/retry(?: in|Delay[^0-9]*)([0-9.]+)s/i);
  if (!match) return 5_000;
  return Math.min(25_000, Math.max(1_000, Math.ceil(Number(match[1]) * 1_000)));
}

export async function generateGeminiJson(prompt: string, maxOutputTokens: number) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiProviderError(503);
  // The installed SDK exposes GoogleGenAI at runtime but omits it from its declarations.
  const ai = new (GeminiSdk as unknown as { GoogleGenAI: new (options: { apiKey: string }) => { models: { generateContent: (request: unknown) => Promise<{ text?: string }> } } }).GoogleGenAI({ apiKey });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite", contents: prompt, config: { responseMimeType: "application/json", temperature: 0.25, maxOutputTokens } });
      if (!response.text) throw new Error("Empty Gemini response");
      return parseJson(response.text);
    } catch (error) {
      if (error instanceof SyntaxError) throw error;
      const status = typeof error === "object" && error && "status" in error && typeof (error as { status?: unknown }).status === "number" ? (error as { status: number }).status : undefined;
      if (attempt === 0 && (status === 429 || status === 503)) { await new Promise((resolve) => setTimeout(resolve, retryDelay(error, status))); continue; }
      throw new GeminiProviderError(status);
    }
  }
  throw new GeminiProviderError(503);
}
