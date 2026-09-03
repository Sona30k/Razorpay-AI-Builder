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

export async function generateGeminiJson(prompt: string, maxOutputTokens: number) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiProviderError(503);
  // The installed SDK exposes GoogleGenAI at runtime but omits it from its declarations.
  const ai = new (GeminiSdk as unknown as { GoogleGenAI: new (options: { apiKey: string }) => { models: { generateContent: (request: unknown) => Promise<{ text?: string }> } } }).GoogleGenAI({ apiKey });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || "gemini-3.6-flash", contents: prompt, config: { responseMimeType: "application/json", temperature: 0.25, maxOutputTokens, thinkingConfig: { thinkingBudget: 0 } } });
      if (!response.text) throw new Error("Empty Gemini response");
      return parseJson(response.text);
    } catch (error) {
      if (error instanceof SyntaxError) throw error;
      const status = typeof error === "object" && error && "status" in error && typeof (error as { status?: unknown }).status === "number" ? (error as { status: number }).status : undefined;
      if (attempt === 0 && (status === 429 || status === 503)) { await new Promise((resolve) => setTimeout(resolve, 700)); continue; }
      throw new GeminiProviderError(status);
    }
  }
  throw new GeminiProviderError(503);
}
