import * as GeminiSdk from "@google/genai";

export class GeminiProviderError extends Error { constructor(public readonly status?: number) { super("Gemini provider request failed"); } }

export async function generateGeminiJson(prompt: string, maxOutputTokens: number) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiProviderError(503);
  // The installed SDK exposes GoogleGenAI at runtime but omits it from its declarations.
  const ai = new (GeminiSdk as unknown as { GoogleGenAI: new (options: { apiKey: string }) => { models: { generateContent: (request: unknown) => Promise<{ text?: string }> } } }).GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || "gemini-3.6-flash", contents: prompt, config: { responseMimeType: "application/json", temperature: 0.25, maxOutputTokens, thinkingConfig: { thinkingBudget: 0 } } });
    if (!response.text) throw new Error("Empty Gemini response");
    return JSON.parse(response.text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "")) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) throw error;
    const status = typeof error === "object" && error && "status" in error && typeof (error as { status?: unknown }).status === "number" ? (error as { status: number }).status : undefined;
    throw new GeminiProviderError(status);
  }
}
