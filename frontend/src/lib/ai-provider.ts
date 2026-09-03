import { generateGeminiJson, GeminiProviderError } from "@/lib/gemini";
import { generateOllamaJson, OllamaProviderError } from "@/lib/ollama";

export class AiProviderError extends Error {
  constructor(public readonly status?: number) {
    super("AI provider request failed");
  }
}

export function isMockAiMode() {
  return process.env.MOCK_AI_MODE === "true";
}

/**
 * Selects a server-side provider. `auto` keeps local development on Ollama,
 * while Vercel prefers the hosted Gemini provider when it is explicitly set up.
 */
export async function generateAiJson(prompt: string, maxOutputTokens: number, _timeoutMs?: number) {
  const configured = process.env.AI_PROVIDER?.toLowerCase() ?? "auto";
  const provider = configured === "auto" ? (process.env.VERCEL === "1" ? "gemini" : "ollama") : configured;

  try {
    if (provider === "gemini") return await generateGeminiJson(prompt, maxOutputTokens);
    if (provider === "ollama") return await generateOllamaJson(prompt, maxOutputTokens);
    throw new AiProviderError(503);
  } catch (error) {
    if (error instanceof AiProviderError) throw error;
    if (error instanceof GeminiProviderError || error instanceof OllamaProviderError) throw new AiProviderError(error.status);
    throw new AiProviderError(502);
  }
}
