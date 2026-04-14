-- Phase 4 + Phase 5C foundation:
-- 1. Preserve the richer exercise-library metadata from MergedData.json
-- 2. Resize embeddings to a practical Hugging Face dimension
-- 3. Add vector-search primitives for semantic exercise retrieval

ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS source_id TEXT,
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS primary_muscle TEXT,
ADD COLUMN IF NOT EXISTS secondary_muscles JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS equipment_needed JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS exercise_types JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pro_tips JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS common_mistakes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS extracted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS embedding_model TEXT,
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.exercises
ALTER COLUMN embedding TYPE vector(1024);

CREATE INDEX IF NOT EXISTS exercises_embedding_idx
ON public.exercises
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE OR REPLACE FUNCTION public.match_exercises(
  query_embedding vector(1024),
  match_count integer DEFAULT 5,
  filter_body_part text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  slug text,
  name text,
  description text,
  body_part text,
  target_muscle text,
  equipment text,
  difficulty text,
  similarity double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    exercises.id,
    exercises.slug,
    exercises.name,
    exercises.description,
    exercises.body_part,
    exercises.target_muscle,
    exercises.equipment,
    exercises.difficulty,
    1 - (exercises.embedding <=> query_embedding) AS similarity
  FROM public.exercises
  WHERE exercises.embedding IS NOT NULL
    AND (filter_body_part IS NULL OR exercises.body_part = filter_body_part)
  ORDER BY exercises.embedding <=> query_embedding
  LIMIT match_count;
$$;
