import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS ?? 15000);

type GeminiJsonOptions = {
  maxOutputTokens?: number;
  temperature?: number;
  responseMimeType?: string;
};

type GeminiValidationOptions = GeminiJsonOptions & {
  maxAttempts?: number;
  validationMaxOutputTokens?: number;
};

type ValidationResult = {
  valid: boolean;
  reason?: string;
};

type GeminiQuotaStatus = {
  exhausted: boolean;
  lastErrorMessage: string | null;
  lastErrorAt: string | null;
};

let quotaStatus: GeminiQuotaStatus = {
  exhausted: false,
  lastErrorMessage: null,
  lastErrorAt: null,
};

// Fallback models in priority order
const MODELS = [
  process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }

  return new GoogleGenerativeAI(apiKey);
}

function parseAIJson(text: string) {
  const trimmed = text.trim();
  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(withoutFences);
  } catch {
    const firstBrace = withoutFences.indexOf("{");
    const lastBrace = withoutFences.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(withoutFences.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("Model returned invalid JSON");
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("AI request timed out")), timeoutMs);
    }),
  ]);
}

export function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error && error.message.toLowerCase().includes("timed out")
  );
}

export function isQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  return (
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("too many requests") ||
    message.includes("rate limit") ||
    message.includes("exceeded")
  );
}

export function getQuotaStatus(): GeminiQuotaStatus {
  return { ...quotaStatus };
}

function markQuotaStatus(errorMessage: string) {
  quotaStatus = {
    exhausted: true,
    lastErrorMessage: errorMessage,
    lastErrorAt: new Date().toISOString(),
  };
}

function clearQuotaStatus() {
  quotaStatus = {
    exhausted: false,
    lastErrorMessage: null,
    lastErrorAt: null,
  };
}

export async function getJsonFromGemini(
  prompt: string,
  options: GeminiJsonOptions = {},
) {
  const client = getClient();
  let lastError: Error | null = null;
  const maxOutputTokens = options.maxOutputTokens ?? 4096;
  const temperature = options.temperature ?? 0.2;
  const responseMimeType = options.responseMimeType ?? "application/json";

  for (const model of MODELS) {
    try {
      console.log(`[Gemini] Attempting request with model: ${model}`);

      const generativeModel = client.getGenerativeModel({
        model: model,
        generationConfig: {
          responseMimeType,
          temperature,
          maxOutputTokens,
        },
      });

      const response = await withTimeout(
        generativeModel.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      );

      const text = response.response.text();
      console.log(
        `[Gemini] Success with model: ${model}, response length: ${text.length}`,
      );

      clearQuotaStatus();

      return parseAIJson(text ?? "");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[Gemini] Model ${model} failed: ${errorMsg}`);
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this is a quota error, continue to next model
      if (isQuotaError(lastError)) {
        markQuotaStatus(errorMsg);
        console.log(`[Gemini] Quota exceeded, trying next model...`);
        continue;
      }

      // For other errors, still try next model
      continue;
    }
  }

  // All models failed
  console.error("[Gemini] All models failed:", lastError);
  throw lastError || new Error("All AI models failed to generate response");
}

function parseValidationResult(result: unknown): ValidationResult {
  if (typeof result === "boolean") {
    return { valid: result };
  }

  if (result && typeof result === "object") {
    const typedResult = result as { valid?: unknown; reason?: unknown };

    return {
      valid: typedResult.valid === true,
      reason:
        typeof typedResult.reason === "string" ? typedResult.reason : undefined,
    };
  }

  return {
    valid: false,
    reason: "Validator returned an invalid response",
  };
}

export async function getValidatedJsonFromGemini(
  prompt: string,
  buildValidationPrompt: (response: unknown) => string,
  options: GeminiValidationOptions = {},
) {
  const {
    maxAttempts = 3,
    validationMaxOutputTokens = 512,
    ...generationOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const aiOutput = await getJsonFromGemini(prompt, generationOptions);
    const validationPrompt = buildValidationPrompt(aiOutput);
    const validationOutput = await getJsonFromGemini(validationPrompt, {
      temperature: 0,
      maxOutputTokens: validationMaxOutputTokens,
    });

    const validation = parseValidationResult(validationOutput);

    if (validation.valid) {
      return aiOutput;
    }

    lastError = new Error(
      validation.reason ??
        `AI response failed validation on attempt ${attempt}`,
    );
    console.warn(
      `[Gemini] Validation failed on attempt ${attempt}: ${lastError.message}`,
    );
  }

  throw lastError || new Error("AI response failed validation");
}
