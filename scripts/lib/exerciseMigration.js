export const DEFAULT_EMBEDDING_MODEL = "intfloat/e5-large-v2";

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const normalizeExerciseRecord = (exercise) => {
  const primaryMuscle = exercise.primary_muscle || exercise.muscle_groups?.[0] || null;
  const secondaryMuscles = exercise.secondary_muscles || exercise.muscle_groups?.slice(1) || [];
  const equipmentNeeded = exercise.equipment_needed || exercise.equipment || [];
  const muscles = [primaryMuscle, ...secondaryMuscles].filter(Boolean);

  return {
    source_id: String(exercise.id),
    slug: exercise.slug || slugify(exercise.title || exercise.name || String(exercise.id)),
    name: exercise.title || exercise.name || "Unnamed Exercise",
    description: exercise.description || "",
    steps: exercise.steps || [],
    body_part: primaryMuscle,
    target_muscle: primaryMuscle,
    equipment: Array.isArray(equipmentNeeded) ? equipmentNeeded.join(", ") : equipmentNeeded || null,
    muscles,
    difficulty: exercise.difficulty || null,
    video_urls: exercise.video_urls || {},
    url: exercise.url || null,
    primary_muscle: primaryMuscle,
    secondary_muscles: secondaryMuscles,
    equipment_needed: equipmentNeeded,
    exercise_types: exercise.exercise_types || [],
    pro_tips: exercise.pro_tips || [],
    common_mistakes: exercise.common_mistakes || [],
    extracted_at: exercise.extracted_at || null,
  };
};

export const buildExerciseEmbeddingInput = (exercise) => {
  const sections = [
    `name: ${exercise.name}`,
    `description: ${exercise.description || ""}`,
    `primary muscle: ${exercise.primary_muscle || exercise.target_muscle || ""}`,
    `secondary muscles: ${(exercise.secondary_muscles || []).join(", ")}`,
    `equipment: ${
      Array.isArray(exercise.equipment_needed)
        ? exercise.equipment_needed.join(", ")
        : exercise.equipment || ""
    }`,
    `exercise types: ${(exercise.exercise_types || []).join(", ")}`,
    `steps: ${(exercise.steps || []).join(" ")}`,
    `pro tips: ${(exercise.pro_tips || []).join(" ")}`,
    `common mistakes: ${(exercise.common_mistakes || []).join(" ")}`,
  ];

  return sections.join("\n").trim();
};

export const chunkRecords = (records, batchSize) => {
  const chunks = [];
  for (let index = 0; index < records.length; index += batchSize) {
    chunks.push(records.slice(index, index + batchSize));
  }
  return chunks;
};

export const toVectorLiteral = (values) => `[${values.join(",")}]`;

export const buildExerciseSearchQuery = (context = {}) => {
  const targetMuscles = Array.isArray(context.targetMuscleGroups)
    ? context.targetMuscleGroups.join(", ")
    : "";
  const equipment = Array.isArray(context.equipment)
    ? context.equipment.join(", ")
    : context.equipment || "";

  return [
    context.workoutType,
    targetMuscles,
    equipment,
    context.goal,
    context.recoveryStatus,
  ]
    .filter(Boolean)
    .join(" | ");
};
