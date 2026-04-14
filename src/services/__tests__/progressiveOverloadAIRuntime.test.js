import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateWorkoutRecommendations, mockSetSupabase } = vi.hoisted(() => ({
  mockGenerateWorkoutRecommendations: vi.fn(),
  mockSetSupabase: vi.fn(),
}));

vi.mock("../geminiAIService", () => ({
  default: {
    generateWorkoutRecommendations: mockGenerateWorkoutRecommendations,
    setSupabase: mockSetSupabase,
  },
}));

vi.mock("../aiDatabaseService", () => ({
  default: {},
}));

import { ProgressiveOverloadAIService } from "../progressiveOverloadAI";

describe("ProgressiveOverloadAIService runtime AI flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses workout recommendations for workout suggestions so semantic retrieval can participate", async () => {
    const service = new ProgressiveOverloadAIService();
    service.setSupabase({ rpc: vi.fn() });

    vi.spyOn(service, "_getUserProgressionProfile").mockResolvedValue({
      experienceLevel: "intermediate",
      trainingFrequency: 4,
    });
    vi.spyOn(service, "_getRecentWorkoutHistory").mockResolvedValue([]);
    vi.spyOn(service, "analyzeWorkoutHistory").mockResolvedValue([
      {
        exerciseId: "bench-press",
        exerciseName: "Bench Press",
        currentWeight: 70,
        totalSessions: 5,
        confidenceLevel: 0.8,
      },
    ]);

    mockGenerateWorkoutRecommendations.mockResolvedValue({
      workoutPlan: {
        exercises: [
          {
            exerciseId: "bench-press",
            exerciseName: "Bench Press",
            sets: 4,
            reps: "6-8",
            weight: "72.5",
            restTime: 120,
            notes: "Drive through the top set.",
          },
        ],
      },
      reasoning: "Push strength emphasis.",
      estimatedDuration: 45,
      difficultyLevel: "intermediate",
    });

    const suggestions = await service.generateWorkoutSuggestions("user_123", {
      workoutType: "push",
      targetMuscleGroups: ["chest", "triceps"],
      availableTime: 45,
    });

    expect(mockGenerateWorkoutRecommendations).toHaveBeenCalledWith(
      expect.objectContaining({
        workoutType: "push",
        targetMuscleGroups: ["chest", "triceps"],
        availableTime: 45,
      }),
      expect.objectContaining({
        experienceLevel: "intermediate",
      }),
      []
    );

    expect(suggestions).toEqual([
      expect.objectContaining({
        exerciseId: "bench-press",
        exerciseName: "Bench Press",
        suggestedWeight: 72.5,
        suggestedReps: 8,
        suggestedSets: 4,
        restTime: 120,
        aiGenerated: true,
      }),
    ]);
  });
});
