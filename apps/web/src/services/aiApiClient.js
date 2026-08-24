let tokenProvider = null;

export class AiApiError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = "AiApiError";
    this.status = status;
  }
}

export function registerAiTokenProvider(provider) {
  if (typeof provider !== "function") {
    throw new TypeError("AI token provider must be a function");
  }

  const previousProvider = tokenProvider;
  tokenProvider = provider;

  return () => {
    if (tokenProvider === provider) {
      tokenProvider = previousProvider;
    }
  };
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function requestAi(operation, payload) {
  if (!tokenProvider) {
    throw new AiApiError("AI authentication is not configured");
  }

  const token = await tokenProvider();
  if (!token) {
    throw new AiApiError("Sign in to use AI features", 401);
  }

  const response = await fetch("/api/ai", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ operation, payload }),
  });
  const body = await parseJsonResponse(response);

  if (!response.ok) {
    throw new AiApiError(body?.error || "AI request failed", response.status);
  }

  return body;
}

export const aiApiClient = {
  async chat(systemPrompt, userPrompt) {
    const response = await requestAi("chat", {
      systemPrompt,
      userPrompt,
    });
    return response.content;
  },

  async embedding(query) {
    const response = await requestAi("embedding", { query });
    return response.embedding;
  },
};

export default aiApiClient;
