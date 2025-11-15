const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROK_MODEL || "grok-4-fast";
const DEFAULT_TIMEOUT_MS = Number(process.env.GROK_TIMEOUT_MS ?? 45000);
const MAX_RETRIES = Number(process.env.GROK_MAX_RETRIES ?? 2);

export type GrokMessageRole = "system" | "user" | "assistant";

export type GrokMessage = {
  role: GrokMessageRole;
  content: string;
};

type CallOptions = {
  temperature?: number;
  maxOutputTokens?: number;
};

export class GrokConfigurationError extends Error {
  constructor(message = "GROK_API_KEY is not configured on the server.") {
    super(message);
    this.name = "GrokConfigurationError";
  }
}

export class GrokRequestError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "GrokRequestError";
    this.status = status;
  }
}

export function hasGrokConfig(): boolean {
  return Boolean(process.env.GROK_API_KEY);
}

export async function callGrok(
  messages: GrokMessage[],
  options: CallOptions = {},
) {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new GrokConfigurationError();
  }

  const model = process.env.GROK_MODEL || DEFAULT_MODEL;
  const payload: Record<string, unknown> = {
    model,
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  };

  if (typeof options.temperature === "number") {
    payload.temperature = options.temperature;
  }

  if (typeof options.maxOutputTokens === "number") {
    payload.max_tokens = options.maxOutputTokens;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const attempts = Number.isFinite(MAX_RETRIES) && MAX_RETRIES > 0 ? MAX_RETRIES : 1;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(GROK_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.error?.message || "Grok request failed.";
        throw new GrokRequestError(message, response.status);
      }

      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const lowerMessage = lastError.message?.toLowerCase?.() ?? "";

      const isTimeout =
        lastError.name === "TimeoutError" ||
        lastError.name === "AbortError" ||
        lowerMessage.includes("timeout");

      const isNetworkError =
        lastError instanceof TypeError ||
        lowerMessage.includes("fetch failed") ||
        lowerMessage.includes("connect");

      if (attempt < attempts - 1 && (isTimeout || isNetworkError)) {
        await delay(200 * (attempt + 1));
        continue;
      }

      if (lastError instanceof GrokRequestError) {
        throw lastError;
      }

      if (isTimeout) {
        throw new GrokRequestError("Grok request timed out. Please try again.");
      }

      if (isNetworkError) {
        throw new GrokRequestError("Unable to reach Grok. Check your internet connection.");
      }

      throw lastError;
    }
  }

  throw lastError ?? new GrokRequestError("Unknown Grok request failure.");
}

export function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const casted = payload as { choices?: unknown };
  const { choices } = casted;

  if (Array.isArray(choices) && choices.length) {
    const message = (choices[0] as { message?: { content?: string } })?.message;
    const content = message?.content;
    if (typeof content === "string" && content.trim()) {
      return content.trim();
    }
  }

  return "";
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
