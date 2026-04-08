/* eslint-env node */
import fs from "fs/promises";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { HfInference } from "@huggingface/inference";

import {
  buildExerciseEmbeddingInput,
  chunkRecords,
  DEFAULT_EMBEDDING_MODEL,
  normalizeExerciseRecord,
  toVectorLiteral,
} from "./lib/exerciseMigration.js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const runtimeProcess = globalThis.process;

const BATCH_SIZE = Number.parseInt(runtimeProcess?.env.EXERCISE_IMPORT_BATCH_SIZE || "50", 10);
const EMBEDDING_MODEL =
  runtimeProcess?.env.VITE_HUGGINGFACE_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;

const args = new Set(runtimeProcess?.argv.slice(2) || []);
const withEmbeddings = args.has("--with-embeddings");

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
  const raw = await fs.readFile("./MergedData.json", "utf8");
  const parsed = JSON.parse(raw);
  return (parsed.products || []).map(normalizeExerciseRecord);
};

const upsertExercises = async (rows) => {
  const { error } = await supabase.from("exercises").upsert(rows, {
    onConflict: "slug",
  });

  if (error) {
    throw error;
  }
};

const updateEmbeddings = async (rows) => {
  for (const row of rows) {
    const embeddingInput = buildExerciseEmbeddingInput(row);
    const embedding = await generateEmbedding(embeddingInput);
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
  }
};

const main = async () => {
  const rows = await readExercises();
  const batches = chunkRecords(rows, BATCH_SIZE);

  console.log(`Importing ${rows.length} exercises in ${batches.length} batches...`);

  for (const [index, batch] of batches.entries()) {
    await upsertExercises(batch);
    console.log(`Upserted batch ${index + 1}/${batches.length}`);

    if (withEmbeddings) {
      await updateEmbeddings(batch);
      console.log(`Embedded batch ${index + 1}/${batches.length}`);
    }
  }

  console.log(
    withEmbeddings
      ? `Imported and embedded ${rows.length} exercises.`
      : `Imported ${rows.length} exercises. Re-run with --with-embeddings after the vector migration is applied.`
  );
};

main().catch((error) => {
  console.error("Exercise migration failed:", error);
  runtimeProcess?.exit(1);
});
