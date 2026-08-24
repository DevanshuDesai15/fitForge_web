import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGenerateProgressionSuggestions = vi.fn();
const mockSetSupabase = vi.fn();

vi.mock("../huggingFaceService", () => ({
  default: {
    setSupabase: mockSetSupabase,
    generateProgressionSuggestions: mockGenerateProgressionSuggestions,
    generateBatchProgressionSuggestions: vi.fn(),
    generatePlateauInterventions: vi.fn(),
    generateWorkoutRecommendations: vi.fn(),
    generateWorkoutAnalysis: vi.fn(),
    isAvailable: vi.fn(),
    getUsageStats: vi.fn(),
    cleanup: vi.fn(),
  },
}));

describe("aiProviderService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates through the canonical service when the provider is enabled", async () => {
    const { AIProviderService } = await import("../aiProviderService");
    const providerResult = {
      primarySuggestion: { exerciseId: "squat", confidence: 0.9 },
    };
    const provider = {
      generateProgressionSuggestions: mockGenerateProgressionSuggestions,
    };
    mockGenerateProgressionSuggestions.mockResolvedValue(providerResult);
    const service = new AIProviderService(
      { useAIProvider: true, emergencyDisable: false },
      provider
    );
    const analysis = {
      exerciseId: "squat",
      exerciseName: "Squat",
      totalSessions: 4,
    };

    await expect(
      service.generateProgressionSuggestions(analysis, {}, [])
    ).resolves.toBe(providerResult);
    expect(mockGenerateProgressionSuggestions).toHaveBeenCalledWith(
      analysis,
      {},
      []
    );
  });

  it("forwards the Supabase client to providers that support it", async () => {
    const { AIProviderService } = await import("../aiProviderService");
    const service = new AIProviderService(
      { useAIProvider: true, emergencyDisable: false },
      { setSupabase: mockSetSupabase }
    );
    const supabase = { from: vi.fn() };

    service.setSupabase(supabase);

    expect(mockSetSupabase).toHaveBeenCalledWith(supabase);
  });

  it("keeps the Gemini-named service exports as identity-preserving aliases", async () => {
    const canonical = await import("../aiProviderService");
    const legacy = await import("../geminiAIService");

    expect(legacy.default).toBe(canonical.default);
    expect(legacy.GeminiAIService).toBe(canonical.AIProviderService);
    expect(legacy.getGeminiModel).toBe(canonical.getAIProviderModel);
    expect(legacy.generateWorkoutAnalysis).toBe(
      canonical.generateWorkoutAnalysis
    );
  });

  it("keeps Gemini-era naming out of active AI consumers", () => {
    const activeConsumers = [
      "src/services/huggingFaceService.js",
      "src/services/progressiveOverloadAI.js",
      "src/pages/Workout/hooks/useAICoach.js",
    ];

    const legacyMatches = activeConsumers.flatMap((path) => {
      const source = readFileSync(resolve(process.cwd(), path), "utf8");
      return source
        .split("\n")
        .map((line, index) => ({ path, line: index + 1, text: line.trim() }))
        .filter(({ text }) => /gemini/i.test(text));
    });

    expect(legacyMatches).toEqual([]);
  });
});
