import { describe, expect, it } from "vitest";

import {
  buildExerciseEmbeddingInput,
  buildExerciseSearchQuery,
  chunkRecords,
  normalizeExerciseRecord,
  toVectorLiteral,
} from "../lib/exerciseMigration";

describe("exercise migration helpers", () => {
  it("normalizes MergedData exercises into the Supabase row shape", () => {
    const row = normalizeExerciseRecord({
      id: "0001",
      title: "Kettlebell Single Arm Row",
      slug: "kettlebell-single-arm-row",
      description: "Builds back strength.",
      steps: ["Hinge", "Row"],
      primary_muscle: "Latissimus Dorsi",
      secondary_muscles: ["Rhomboids", "Biceps Brachii"],
      equipment_needed: ["Kettlebell"],
      exercise_types: ["Strength"],
      pro_tips: ["Drive the elbow back"],
      common_mistakes: ["Twisting the torso"],
      video_urls: { "720p": "https://example.com/video.mp4" },
      url: "https://example.com/exercise",
      extracted_at: "2025-08-21T12:33:02.597650",
    });

    expect(row).toEqual(
      expect.objectContaining({
        source_id: "0001",
        slug: "kettlebell-single-arm-row",
        name: "Kettlebell Single Arm Row",
        body_part: "Latissimus Dorsi",
        target_muscle: "Latissimus Dorsi",
        equipment: "Kettlebell",
        muscles: ["Latissimus Dorsi", "Rhomboids", "Biceps Brachii"],
        primary_muscle: "Latissimus Dorsi",
        secondary_muscles: ["Rhomboids", "Biceps Brachii"],
        equipment_needed: ["Kettlebell"],
      })
    );
  });

  it("builds embedding input from the normalized exercise metadata", () => {
    const input = buildExerciseEmbeddingInput({
      name: "Bench Press",
      description: "A classic horizontal press.",
      primary_muscle: "Pectoralis Major",
      secondary_muscles: ["Anterior Deltoids", "Triceps"],
      equipment_needed: ["Barbell", "Bench"],
      exercise_types: ["Strength"],
      steps: ["Set your grip", "Lower the bar", "Press"],
      pro_tips: ["Keep your shoulder blades set"],
      common_mistakes: ["Bouncing the bar"],
    });

    expect(input).toContain("name: Bench Press");
    expect(input).toContain("primary muscle: Pectoralis Major");
    expect(input).toContain("equipment: Barbell, Bench");
    expect(input).toContain("common mistakes: Bouncing the bar");
  });

  it("chunks records and serializes pgvector literals", () => {
    expect(chunkRecords([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(toVectorLiteral([0.1, 0.2, 0.3])).toBe("[0.1,0.2,0.3]");
  });

  it("builds a semantic search query from workout context", () => {
    expect(
      buildExerciseSearchQuery({
        workoutType: "upper body strength",
        targetMuscleGroups: ["chest", "triceps"],
        equipment: ["barbell", "bench"],
        recoveryStatus: "normal",
      })
    ).toBe("upper body strength | chest, triceps | barbell, bench | normal");
  });
});
