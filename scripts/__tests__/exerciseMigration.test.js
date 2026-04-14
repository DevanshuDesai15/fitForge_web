import { describe, expect, it } from "vitest";

import {
  withRetries,
  buildExerciseEmbeddingInput,
  buildExerciseSearchQuery,
  chunkRecords,
  extractExerciseRecords,
  findStaleExerciseSlugs,
  normalizeExerciseRecord,
  selectBatchRange,
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
      variations: ["Chest-supported row"],
      safety_considerations: ["Keep the spine neutral"],
      tags: ["Back", "Kettlebell"],
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
        variations: ["Chest-supported row"],
        safety_considerations: ["Keep the spine neutral"],
        tags: ["Back", "Kettlebell"],
      })
    );
  });

  it("supports the updated exercise export shape and prefers enhanced descriptions", () => {
    const rows = extractExerciseRecords([
      {
        data: [
          {
            id: "0001",
            title: "Kettlebell Single Arm Row",
            slug: "kettlebell-single-arm-row",
            description: "Old description",
            enhanced_description: "Updated description",
            primary_muscle: "Back",
            secondary_muscles: ["Rhomboids"],
            equipment_needed: ["Kettlebell"],
            steps: ["Hinge", "Row"],
            variations: ["Single Arm Dumbbell Row"],
            safety_considerations: ["Brace your core"],
            tags: ["Beginner", "Back"],
          },
        ],
      },
    ]);

    expect(rows).toEqual([
      expect.objectContaining({
        source_id: "0001",
        slug: "kettlebell-single-arm-row",
        name: "Kettlebell Single Arm Row",
        description: "Updated description",
        body_part: "Back",
        target_muscle: "Back",
        variations: ["Single Arm Dumbbell Row"],
        safety_considerations: ["Brace your core"],
        tags: ["Beginner", "Back"],
      }),
    ]);
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
      variations: ["Dumbbell bench press"],
      safety_considerations: ["Use a spotter for heavy sets"],
      tags: ["Chest", "Compound"],
    });

    expect(input).toContain("name: Bench Press");
    expect(input).toContain("primary muscle: Pectoralis Major");
    expect(input).toContain("equipment: Barbell, Bench");
    expect(input).toContain("common mistakes: Bouncing the bar");
    expect(input).toContain("variations: Dumbbell bench press");
    expect(input).toContain("safety considerations: Use a spotter for heavy sets");
    expect(input).toContain("tags: Chest, Compound");
  });

  it("chunks records and serializes pgvector literals", () => {
    expect(chunkRecords([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(toVectorLiteral([0.1, 0.2, 0.3])).toBe("[0.1,0.2,0.3]");
  });

  it("selects a resumable batch range using 1-based batch numbers", () => {
    expect(selectBatchRange([[1], [2], [3], [4]], 2, 3)).toEqual([
      { batchNumber: 2, rows: [2] },
      { batchNumber: 3, rows: [3] },
    ]);
  });

  it("finds stale exercise slugs to delete after a successful import", () => {
    expect(
      findStaleExerciseSlugs(
        ["kettlebell-single-arm-row", "bench-press", "old-row"],
        ["kettlebell-single-arm-row", "bench-press"]
      )
    ).toEqual(["old-row"]);
  });

  it("retries transient async failures before succeeding", async () => {
    let attempts = 0;

    const result = await withRetries(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error("fetch failed");
        }

        return "ok";
      },
      { retries: 3, delayMs: 0 }
    );

    expect(result).toBe("ok");
    expect(attempts).toBe(3);
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
