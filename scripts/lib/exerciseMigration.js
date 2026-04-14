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
  const description =
    exercise.enhanced_description ||
    exercise.description ||
    exercise.original_description ||
    "";

  return {
    source_id: String(exercise.id),
    slug: exercise.slug || slugify(exercise.title || exercise.name || String(exercise.id)),
    name: exercise.title || exercise.name || "Unnamed Exercise",
    description,
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
    variations: exercise.variations || [],
    safety_considerations: exercise.safety_considerations || [],
    tags: exercise.tags || [],
    extracted_at: exercise.extracted_at || null,
  };
};

export const extractExerciseRecords = (parsed) => {
  if (Array.isArray(parsed?.products)) {
    return parsed.products.map(normalizeExerciseRecord);
  }

  if (Array.isArray(parsed)) {
    if (parsed.every((item) => Array.isArray(item?.data))) {
      return parsed.flatMap((item) => item.data.map(normalizeExerciseRecord));
    }

    return parsed.map(normalizeExerciseRecord);
  }

  if (Array.isArray(parsed?.data)) {
    return parsed.data.map(normalizeExerciseRecord);
  }

  return [];
};

export const findStaleExerciseSlugs = (existingSlugs = [], importedSlugs = []) => {
  const importedSlugSet = new Set(importedSlugs.filter(Boolean));
  return existingSlugs.filter((slug) => slug && !importedSlugSet.has(slug));
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
    `variations: ${(exercise.variations || []).join(", ")}`,
    `safety considerations: ${(exercise.safety_considerations || []).join(" ")}`,
    `tags: ${(exercise.tags || []).join(", ")}`,
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

export const selectBatchRange = (batches, startBatch = 1, endBatch = batches.length) => {
  return batches
    .map((rows, index) => ({ batchNumber: index + 1, rows }))
    .filter(({ batchNumber }) => batchNumber >= startBatch && batchNumber <= endBatch);
};

export const toVectorLiteral = (values) => `[${values.join(",")}]`;

export const withRetries = async (fn, options = {}) => {
  const retries = Number.isInteger(options.retries) ? options.retries : 3;
  const delayMs = Number.isInteger(options.delayMs) ? options.delayMs : 1000;
  let lastError;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === retries - 1) {
        throw error;
      }

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError;
};

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
