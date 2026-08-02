import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAiHandler } from "../ai";

const validEnv = {
  HUGGINGFACE_API_KEY: "hf_server_secret",
  HUGGINGFACE_MODEL: "server-chat-model",
  HUGGINGFACE_EMBEDDING_MODEL: "server-embedding-model",
  CLERK_SECRET_KEY: "sk_test_secret",
  CLERK_AUTHORIZED_PARTIES: "http://localhost:3000,https://fitforge.example",
};

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function createRequest(overrides = {}) {
  return {
    method: "POST",
    headers: {
      authorization: "Bearer clerk_session_token",
    },
    body: {
      operation: "chat",
      payload: {
        systemPrompt: "Return JSON.",
        userPrompt: "Analyze this workout.",
      },
    },
    ...overrides,
  };
}

function createHarness(env = validEnv) {
  const verifyToken = vi.fn().mockResolvedValue({ sub: "user_123" });
  const chatCompletion = vi.fn().mockResolvedValue({
    choices: [{ message: { content: "{\"ok\":true}" } }],
  });
  const featureExtraction = vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]);
  const createInferenceClient = vi.fn(() => ({
    chatCompletion,
    featureExtraction,
  }));
  const handler = createAiHandler({
    verifyToken,
    createInferenceClient,
    env,
  });

  return {
    handler,
    verifyToken,
    createInferenceClient,
    chatCompletion,
    featureExtraction,
  };
}

async function invoke(harness, request = createRequest()) {
  const response = createResponse();
  await harness.handler(request, response);
  return response;
}

describe("Vercel AI function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 405 for non-POST requests", async () => {
    const harness = createHarness();

    const response = await invoke(
      harness,
      createRequest({ method: "GET" })
    );

    expect(response.statusCode).toBe(405);
    expect(response.headers.Allow).toBe("POST");
    expect(response.body).toEqual({ error: "Method not allowed" });
    expect(harness.verifyToken).not.toHaveBeenCalled();
  });

  it("returns 401 when the bearer token is missing", async () => {
    const harness = createHarness();

    const response = await invoke(
      harness,
      createRequest({ headers: {} })
    );

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: "Authentication required" });
    expect(harness.verifyToken).not.toHaveBeenCalled();
  });

  it("returns 401 when Clerk verification fails", async () => {
    const harness = createHarness();
    harness.verifyToken.mockRejectedValue(new Error("sensitive Clerk detail"));

    const response = await invoke(harness);

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: "Invalid session" });
    expect(JSON.stringify(response.body)).not.toContain("sensitive");
  });

  it("passes the server verification configuration to Clerk", async () => {
    const harness = createHarness();

    await invoke(harness);

    expect(harness.verifyToken).toHaveBeenCalledWith("clerk_session_token", {
      authorizedParties: [
        "http://localhost:3000",
        "https://fitforge.example",
      ],
      secretKey: "sk_test_secret",
    });
  });

  it("returns 503 when required server configuration is missing", async () => {
    const harness = createHarness({
      CLERK_SECRET_KEY: "sk_test_secret",
      CLERK_AUTHORIZED_PARTIES: "http://localhost:3000",
    });

    const response = await invoke(harness);

    expect(response.statusCode).toBe(503);
    expect(response.body).toEqual({ error: "AI service is not configured" });
    expect(harness.verifyToken).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown operation", async () => {
    const harness = createHarness();

    const response = await invoke(
      harness,
      createRequest({
        body: { operation: "delete-model", payload: {} },
      })
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: "Unsupported AI operation" });
    expect(harness.createInferenceClient).not.toHaveBeenCalled();
  });

  it("returns 413 for an oversized serialized request body", async () => {
    const harness = createHarness();

    const response = await invoke(
      harness,
      createRequest({
        body: JSON.stringify({
          operation: "chat",
          payload: {
            systemPrompt: "system",
            userPrompt: "user",
            ignoredPadding: "x".repeat(40_000),
          },
        }),
      })
    );

    expect(response.statusCode).toBe(413);
    expect(response.body).toEqual({ error: "Request body is too large" });
    expect(harness.verifyToken).not.toHaveBeenCalled();
    expect(harness.createInferenceClient).not.toHaveBeenCalled();
  });

  it.each([
    ["empty system prompt", { systemPrompt: "", userPrompt: "valid" }],
    ["empty user prompt", { systemPrompt: "valid", userPrompt: "  " }],
    [
      "oversized system prompt",
      { systemPrompt: "s".repeat(12_001), userPrompt: "valid" },
    ],
    [
      "oversized user prompt",
      { systemPrompt: "valid", userPrompt: "u".repeat(24_001) },
    ],
  ])("returns 400 for an %s", async (_name, payload) => {
    const harness = createHarness();

    const response = await invoke(
      harness,
      createRequest({ body: { operation: "chat", payload } })
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: "Invalid chat payload" });
    expect(harness.createInferenceClient).not.toHaveBeenCalled();
  });

  it.each([
    ["empty", ""],
    ["whitespace", "  "],
    ["oversized", "q".repeat(2_001)],
  ])("returns 400 for an %s embedding query", async (_name, query) => {
    const harness = createHarness();

    const response = await invoke(
      harness,
      createRequest({
        body: { operation: "embedding", payload: { query } },
      })
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: "Invalid embedding payload" });
    expect(harness.createInferenceClient).not.toHaveBeenCalled();
  });

  it("returns chat content using only server-controlled model settings", async () => {
    const harness = createHarness();
    const request = createRequest({
      body: {
        operation: "chat",
        payload: {
          systemPrompt: "Return JSON.",
          userPrompt: "Analyze this workout.",
          model: "attacker-model",
          maxTokens: 1_000_000,
        },
      },
    });

    const response = await invoke(harness, request);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ content: "{\"ok\":true}" });
    expect(harness.createInferenceClient).toHaveBeenCalledWith(
      "hf_server_secret"
    );
    expect(harness.chatCompletion).toHaveBeenCalledWith({
      model: "server-chat-model",
      messages: [
        { role: "system", content: "Return JSON." },
        { role: "user", content: "Analyze this workout." },
      ],
      temperature: 0.4,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });
  });

  it("returns a flattened embedding vector", async () => {
    const harness = createHarness();

    const response = await invoke(
      harness,
      createRequest({
        body: {
          operation: "embedding",
          payload: { query: "query: bench press" },
        },
      })
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ embedding: [0.1, 0.2, 0.3] });
    expect(harness.featureExtraction).toHaveBeenCalledWith({
      model: "server-embedding-model",
      inputs: "query: bench press",
    });
  });

  it("does not expose provider error details", async () => {
    const harness = createHarness();
    harness.chatCompletion.mockRejectedValue(
      new Error("provider response included hf_server_secret")
    );

    const response = await invoke(harness);

    expect(response.statusCode).toBe(502);
    expect(response.body).toEqual({ error: "AI provider request failed" });
    expect(JSON.stringify(response.body)).not.toContain("hf_server_secret");
  });
});
