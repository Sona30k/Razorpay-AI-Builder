export class OllamaProviderError extends Error {
  constructor(public readonly status?: number) {
    super("Local AI provider request failed");
  }
}

function cleanJson(value: string) {
  return value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
}

/** Calls the locally running Ollama service from the server only. */
export async function generateOllamaJson(prompt: string, maxOutputTokens: number) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || "qwen2.5:0.5b",
        prompt,
        format: "json",
        stream: false,
        options: { temperature: 0.2, num_predict: maxOutputTokens },
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!response.ok) throw new OllamaProviderError(response.status);

    const body = await response.json() as { response?: unknown };
    if (typeof body.response !== "string" || !body.response.trim()) throw new OllamaProviderError(502);
    return JSON.parse(cleanJson(body.response)) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof OllamaProviderError) throw error;
    throw new OllamaProviderError(503);
  }
}
