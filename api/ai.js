import { verifyToken as verifyClerkToken } from "@clerk/backend";

const MAX_SYSTEM_PROMPT_LENGTH = 12_000;
const MAX_USER_PROMPT_LENGTH = 24_000;
const MAX_EMBEDDING_QUERY_LENGTH = 2_000;
const MAX_REQUEST_BODY_BYTES = 40_000;

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_CHAT_MODEL = "openai/gpt-5-mini";
const DEFAULT_EMBEDDING_MODEL = "intfloat/multilingual-e5-large";
const DEFAULT_TEMPERATURE = 0.4;
const DEFAULT_MAX_TOKENS = 4000;

const isBoundedString = (value, maxLength) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.length <= maxLength;

const getAuthorizedParties = (value = "") =>
  value
    .split(",")
    .map((party) => party.trim())
    .filter(Boolean);

const getBearerToken = (authorization = "") => {
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
};

const getRequestBody = (body) => {
  if (typeof body !== "string") {
    return body;
  }

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const getRequestBodySize = (body) => {
  try {
    const serialized = typeof body === "string" ? body : JSON.stringify(body);
    return Buffer.byteLength(serialized || "", "utf8");
  } catch {
    return Number.POSITIVE_INFINITY;
  }
};

const sendJson = (response, status, body) => response.status(status).json(body);

export const createOpenRouterClient = (apiKey) => {
  const request = async (path, body) => {
    const response = await fetch(`${OPENROUTER_BASE_URL}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://fitforge.app",
        "X-OpenRouter-Title": "FitForge",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter request failed with status ${response.status}`);
    }

    return response.json();
  };

  return {
    chatCompletion: (body) => request("chat/completions", body),
    featureExtraction: (body) => request("embeddings", body),
  };
};

export const createAiHandler = ({
  verifyToken,
  createInferenceClient,
  env,
}) =>
  async function handler(request, response) {
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return sendJson(response, 405, { error: "Method not allowed" });
    }

    const authorizedParties = getAuthorizedParties(
      env.CLERK_AUTHORIZED_PARTIES
    );
    const clerkVerificationKey = env.CLERK_JWT_KEY || env.CLERK_SECRET_KEY;

    if (
      !env.OPENROUTER_API_KEY ||
      !clerkVerificationKey ||
      authorizedParties.length === 0
    ) {
      return sendJson(response, 503, {
        error: "AI service is not configured",
      });
    }

    if (getRequestBodySize(request.body) > MAX_REQUEST_BODY_BYTES) {
      return sendJson(response, 413, {
        error: "Request body is too large",
      });
    }

    const token = getBearerToken(
      request.headers?.authorization || request.headers?.Authorization
    );

    if (!token) {
      return sendJson(response, 401, { error: "Authentication required" });
    }

    const verificationOptions = {
      authorizedParties,
      ...(env.CLERK_JWT_KEY
        ? { jwtKey: env.CLERK_JWT_KEY }
        : { secretKey: env.CLERK_SECRET_KEY }),
    };

    try {
      await verifyToken(token, verificationOptions);
    } catch {
      return sendJson(response, 401, { error: "Invalid session" });
    }

    const body = getRequestBody(request.body);
    const operation = body?.operation;
    const payload = body?.payload;

    if (operation !== "chat" && operation !== "embedding") {
      return sendJson(response, 400, {
        error: "Unsupported AI operation",
      });
    }

    if (
      operation === "chat" &&
      (!isBoundedString(
        payload?.systemPrompt,
        MAX_SYSTEM_PROMPT_LENGTH
      ) ||
        !isBoundedString(payload?.userPrompt, MAX_USER_PROMPT_LENGTH))
    ) {
      return sendJson(response, 400, { error: "Invalid chat payload" });
    }

    if (
      operation === "embedding" &&
      !isBoundedString(payload?.query, MAX_EMBEDDING_QUERY_LENGTH)
    ) {
      return sendJson(response, 400, {
        error: "Invalid embedding payload",
      });
    }

    const client = createInferenceClient(env.OPENROUTER_API_KEY);

    try {
      if (operation === "chat") {
        const providerResponse = await client.chatCompletion({
          model: env.OPENROUTER_MODEL || DEFAULT_CHAT_MODEL,
          messages: [
            { role: "system", content: payload.systemPrompt },
            { role: "user", content: payload.userPrompt },
          ],
          temperature: DEFAULT_TEMPERATURE,
          max_tokens: DEFAULT_MAX_TOKENS,
          reasoning: { effort: "low", exclude: true },
          response_format: { type: "json_object" },
        });

        if (providerResponse.choices?.[0]?.finish_reason === "length") {
          return sendJson(response, 502, {
            error: "AI provider response was truncated",
          });
        }

        return sendJson(response, 200, {
          content: providerResponse.choices?.[0]?.message?.content ?? "{}",
        });
      }

      const providerResponse = await client.featureExtraction({
        model:
          env.OPENROUTER_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
        input: payload.query,
      });
      const embedding = providerResponse?.data?.[0]?.embedding
        || providerResponse?.[0]
        || providerResponse;

      return sendJson(response, 200, { embedding });
    } catch {
      return sendJson(response, 502, {
        error: "AI provider request failed",
      });
    }
  };

const handler = createAiHandler({
  verifyToken: verifyClerkToken,
  createInferenceClient: createOpenRouterClient,
  env: process.env,
});

export default handler;
