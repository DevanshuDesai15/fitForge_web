import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEmbedding = vi.fn();

vi.mock("../aiApiClient", () => ({
  default: {
    embedding: mockEmbedding,
  },
}));

describe("ExerciseVectorSearchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests one prefixed embedding and passes its vector to Supabase", async () => {
    const { ExerciseVectorSearchService } = await import(
      "../exerciseVectorSearchService"
    );
    const rpc = vi.fn().mockResolvedValue({
      data: [{ id: "bench-press" }],
      error: null,
    });
    const service = new ExerciseVectorSearchService();
    service.setSupabase({ rpc });
    mockEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);

    const result = await service.searchRelevantExercises(
      {
        workoutType: "strength",
        targetMuscleGroups: ["chest", "triceps"],
        equipment: ["barbell"],
        goal: "hypertrophy",
      },
      { limit: 3, bodyPart: "chest" }
    );

    expect(mockEmbedding).toHaveBeenCalledWith(
      "query: strength | chest, triceps | barbell | hypertrophy"
    );
    expect(rpc).toHaveBeenCalledWith("match_exercises", {
      query_embedding: "[0.1,0.2,0.3]",
      match_count: 3,
      filter_body_part: "chest",
    });
    expect(result).toEqual([{ id: "bench-press" }]);
  });

  it("does not call Supabase when embedding generation fails", async () => {
    const { ExerciseVectorSearchService } = await import(
      "../exerciseVectorSearchService"
    );
    const rpc = vi.fn();
    const service = new ExerciseVectorSearchService();
    service.setSupabase({ rpc });
    mockEmbedding.mockRejectedValue(new Error("AI request failed"));

    await expect(
      service.searchRelevantExercises({ workoutType: "strength" })
    ).rejects.toThrow("AI request failed");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("skips the API and database for an empty search context", async () => {
    const { ExerciseVectorSearchService } = await import(
      "../exerciseVectorSearchService"
    );
    const rpc = vi.fn();
    const service = new ExerciseVectorSearchService();
    service.setSupabase({ rpc });

    await expect(service.searchRelevantExercises({})).resolves.toEqual([]);
    expect(mockEmbedding).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
});
