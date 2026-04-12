/* eslint-env node */
import fs from "fs/promises";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { HfInference } from "@huggingface/inference";

import {
  buildExerciseEmbeddingInput,
  chunkRecords,
  DEFAULT_EMBEDDING_MODEL,
  extractExerciseRecords,
  findStaleExerciseSlugs,
  selectBatchRange,
  toVectorLiteral,
  withRetries,
} from "./lib/exerciseMigration.js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const runtimeProcess = globalThis.process;

const BATCH_SIZE = Number.parseInt(runtimeProcess?.env.EXERCISE_IMPORT_BATCH_SIZE || "50", 10);
const EMBEDDING_MODEL =
  runtimeProcess?.env.VITE_HUGGINGFACE_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
const EXERCISE_IMPORT_FILE =
  runtimeProcess?.env.EXERCISE_IMPORT_FILE || "./UpdatedExerciseData.json";

const args = new Set(runtimeProcess?.argv.slice(2) || []);
const startBatchArg = (runtimeProcess?.argv.slice(2) || []).find((arg) => arg.startsWith("--start-batch="));
const endBatchArg = (runtimeProcess?.argv.slice(2) || []).find((arg) => arg.startsWith("--end-batch="));
const withEmbeddings = args.has("--with-embeddings");
const startBatch = startBatchArg ? Number.parseInt(startBatchArg.split("=")[1], 10) : 1;
const endBatch = endBatchArg ? Number.parseInt(endBatchArg.split("=")[1], 10) : null;

const supabaseUrl = runtimeProcess?.env.VITE_SUPABASE_URL;
const supabaseKey =
  runtimeProcess?.env.SUPABASE_SERVICE_ROLE_KEY || runtimeProcess?.env.VITE_SUPABASE_ANON_KEY;
const usingServiceRoleKey = !!runtimeProcess?.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  runtimeProcess?.exit(1);
}

if (!usingServiceRoleKey) {
  console.error(
    "Exercise import requires SUPABASE_SERVICE_ROLE_KEY. The anon key cannot upsert into public.exercises while RLS is enabled."
  );
  console.error(
    "Add SUPABASE_SERVICE_ROLE_KEY to .env.local and rerun this script."
  );
  runtimeProcess?.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const hfApiKey =
  runtimeProcess?.env.VITE_HUGGINGFACE_API_KEY || runtimeProcess?.env.VITE_HF_API_KEY || null;
const hfClient = withEmbeddings && hfApiKey ? new HfInference(hfApiKey) : null;

const generateEmbedding = async (text) => {
  if (!hfClient) {
    throw new Error("Hugging Face API key is required when --with-embeddings is enabled.");
  }

  const response = await hfClient.featureExtraction({
    model: EMBEDDING_MODEL,
    inputs: `passage: ${text}`,
  });

  return Array.isArray(response[0]) ? response[0] : response;
};

const readExercises = async () => {
  const raw = await fs.readFile(EXERCISE_IMPORT_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return extractExerciseRecords(parsed);
};

const upsertExercises = async (rows) => {
  const { error } = await withRetries(
    () =>
      supabase.from("exercises").upsert(rows, {
        onConflict: "slug",
      }),
    {
      retries: 5,
      delayMs: 1500,
    }
  );

  if (error) {
    throw error;
  }
};

const fetchExistingSlugs = async () => {
  const { data, error } = await withRetries(
    () => supabase.from("exercises").select("slug"),
    {
      retries: 5,
      delayMs: 1500,
    }
  );

  if (error) {
    throw error;
  }

  return (data || []).map((row) => row.slug).filter(Boolean);
};

const deleteStaleExercises = async (staleSlugs) => {
  if (staleSlugs.length === 0) {
    return 0;
  }

  const staleBatches = chunkRecords(staleSlugs, BATCH_SIZE);

  for (const batch of staleBatches) {
    const { error } = await withRetries(
      () => supabase.from("exercises").delete().in("slug", batch),
      {
        retries: 5,
        delayMs: 1500,
      }
    );

    if (error) {
      throw error;
    }
  }

  return staleSlugs.length;
};

const updateEmbeddings = async (rows) => {
  for (const row of rows) {
    const embeddingInput = buildExerciseEmbeddingInput(row);
    const embedding = await withRetries(() => generateEmbedding(embeddingInput), {
      retries: 5,
      delayMs: 1500,
    });

    await withRetries(async () => {
      const { error } = await supabase
        .from("exercises")
        .update({
          embedding: toVectorLiteral(embedding),
          embedding_model: EMBEDDING_MODEL,
          embedding_updated_at: new Date().toISOString(),
        })
        .eq("slug", row.slug);

      if (error) {
        throw error;
      }
    }, {
      retries: 5,
      delayMs: 1500,
    });
  }
};

const main = async () => {
  const existingSlugs = await fetchExistingSlugs();
  const rows = await readExercises();
  if (rows.length === 0) {
    throw new Error(`No exercises found in ${EXERCISE_IMPORT_FILE}. Aborting to avoid deleting all rows.`);
  }
  const importedSlugs = [...new Set(rows.map((row) => row.slug).filter(Boolean))];
  const batches = chunkRecords(rows, BATCH_SIZE);
  const selectedBatches = selectBatchRange(
    batches,
    Number.isInteger(startBatch) && startBatch > 0 ? startBatch : 1,
    Number.isInteger(endBatch) && endBatch > 0 ? endBatch : batches.length
  );

  if (selectedBatches.length === 0) {
    throw new Error(`No batches selected. startBatch=${startBatch} endBatch=${endBatch ?? batches.length}`);
  }

  console.log(
    `Importing ${rows.length} exercises from ${EXERCISE_IMPORT_FILE} across batches ${selectedBatches[0].batchNumber}-${selectedBatches[selectedBatches.length - 1].batchNumber} of ${batches.length}...`
  );

  for (const { batchNumber, rows: batch } of selectedBatches) {
    await upsertExercises(batch);
    console.log(`Upserted batch ${batchNumber}/${batches.length}`);

    if (withEmbeddings) {
      await updateEmbeddings(batch);
      console.log(`Embedded batch ${batchNumber}/${batches.length}`);
    }
  }

  const isFullImport =
    selectedBatches[0].batchNumber === 1 &&
    selectedBatches[selectedBatches.length - 1].batchNumber === batches.length;

  const deletedCount = isFullImport
    ? await deleteStaleExercises(findStaleExerciseSlugs(existingSlugs, importedSlugs))
    : 0;

  console.log(
    withEmbeddings
      ? `Imported and embedded selected batches for ${rows.length} exercises. Deleted ${deletedCount} stale exercises.`
      : `Imported selected batches for ${rows.length} exercises and deleted ${deletedCount} stale exercises. Re-run with --with-embeddings after the vector migration is applied.`
  );
};

main().catch((error) => {
  console.error("Exercise migration failed:", error);
  runtimeProcess?.exit(1);
});
