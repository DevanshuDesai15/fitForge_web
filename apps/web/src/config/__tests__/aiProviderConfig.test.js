import { describe, expect, it } from "vitest";

import aiProviderConfig, {
  aiProviderConfig as namedAIProviderConfig,
  getAIProviderApiKey,
  getGeminiApiKey,
  normalizeAIProviderOptions,
} from "../aiProviderConfig";
import legacyGeminiConfig, {
  aiProviderConfig as configFromLegacyModule,
  geminiConfig,
} from "../geminiConfig";

describe("aiProviderConfig", () => {
  it("exposes provider-neutral settings with deprecated property aliases", () => {
    expect(namedAIProviderConfig).toBe(aiProviderConfig);
    expect(aiProviderConfig.provider).toBe("openrouter");
    expect(aiProviderConfig.useAIProvider).toBeTypeOf("boolean");
    expect(aiProviderConfig.providerPriority).toBeTypeOf("number");
    expect(aiProviderConfig.useGeminiAI).toBe(aiProviderConfig.useAIProvider);
    expect(aiProviderConfig.geminiPriority).toBe(
      aiProviderConfig.providerPriority
    );
    expect(getGeminiApiKey()).toBe(getAIProviderApiKey());
  });

  it("keeps the Gemini-named module as an identity-preserving shim", () => {
    expect(legacyGeminiConfig).toBe(aiProviderConfig);
    expect(configFromLegacyModule).toBe(aiProviderConfig);
    expect(geminiConfig).toBe(aiProviderConfig);
  });

  it("normalizes deprecated option properties at the configuration boundary", () => {
    expect(
      normalizeAIProviderOptions({
        useGeminiAI: false,
        geminiPriority: 0.25,
      })
    ).toEqual(
      expect.objectContaining({
        useAIProvider: false,
        providerPriority: 0.25,
      })
    );

    expect(
      normalizeAIProviderOptions({
        useAIProvider: true,
        providerPriority: 0.75,
        useGeminiAI: false,
        geminiPriority: 0.25,
      })
    ).toEqual(
      expect.objectContaining({
        useAIProvider: true,
        providerPriority: 0.75,
      })
    );
  });
});
