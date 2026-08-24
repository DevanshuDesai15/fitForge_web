import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  aiApiClient,
  registerAiTokenProvider,
  requestAi,
} from "../aiApiClient";

describe("aiApiClient", () => {
  let cleanupProvider;

  beforeEach(() => {
    vi.restoreAllMocks();
    cleanupProvider = undefined;
  });

  afterEach(() => {
    cleanupProvider?.();
  });

  it("requires a configured Clerk token provider", async () => {
    await expect(
      requestAi("chat", {
        systemPrompt: "system",
        userPrompt: "user",
      })
    ).rejects.toThrow("AI authentication is not configured");
  });

  it("rejects when Clerk does not return a session token", async () => {
    cleanupProvider = registerAiTokenProvider(
      vi.fn().mockResolvedValue(null)
    );

    await expect(
      requestAi("chat", {
        systemPrompt: "system",
        userPrompt: "user",
      })
    ).rejects.toMatchObject({
      message: "Sign in to use AI features",
      status: 401,
    });
  });

  it("posts an authenticated chat operation", async () => {
    const getToken = vi.fn().mockResolvedValue("clerk_token");
    cleanupProvider = registerAiTokenProvider(getToken);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ content: "{\"ok\":true}" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await aiApiClient.chat("system", "user");

    expect(result).toBe("{\"ok\":true}");
    expect(getToken).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith("/api/ai", {
      method: "POST",
      headers: {
        Authorization: "Bearer clerk_token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operation: "chat",
        payload: {
          systemPrompt: "system",
          userPrompt: "user",
        },
      }),
    });
  });

  it("posts an authenticated embedding operation", async () => {
    cleanupProvider = registerAiTokenProvider(
      vi.fn().mockResolvedValue("clerk_token")
    );
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ embedding: [0.1, 0.2] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await aiApiClient.embedding("query: squat");

    expect(result).toEqual([0.1, 0.2]);
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/ai",
      expect.objectContaining({
        body: JSON.stringify({
          operation: "embedding",
          payload: { query: "query: squat" },
        }),
      })
    );
  });

  it("throws an error containing the response status and safe message", async () => {
    cleanupProvider = registerAiTokenProvider(
      vi.fn().mockResolvedValue("clerk_token")
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(
      aiApiClient.chat("system", "user")
    ).rejects.toMatchObject({
      message: "Invalid session",
      status: 401,
    });
  });

  it("uses a generic message when an error response is not JSON", async () => {
    cleanupProvider = registerAiTokenProvider(
      vi.fn().mockResolvedValue("clerk_token")
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html>gateway failure</html>", { status: 502 })
    );

    await expect(
      aiApiClient.chat("system", "user")
    ).rejects.toMatchObject({
      message: "AI request failed",
      status: 502,
    });
  });

  it("restores the previous provider when registration cleanup runs", async () => {
    const firstCleanup = registerAiTokenProvider(
      vi.fn().mockResolvedValue("first_token")
    );
    const secondCleanup = registerAiTokenProvider(
      vi.fn().mockResolvedValue("second_token")
    );
    cleanupProvider = firstCleanup;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ content: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    secondCleanup();
    await aiApiClient.chat("system", "user");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/ai",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer first_token",
        }),
      })
    );
  });
});
