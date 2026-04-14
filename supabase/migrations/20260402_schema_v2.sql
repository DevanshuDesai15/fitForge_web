-- FitForge Supabase SQL Schema Migration - V2 (CLERK FIX)
-- Since Clerk user IDs are strings (e.g. user_2...), we MUST use TEXT for Profiles and references.
-- If you already ran the first script, please run this to replace/update the tables!

DROP TABLE IF EXISTS public.exercise_analytics CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.workouts CASCADE;
DROP TABLE IF EXISTS public.workout_programs CASCADE;
DROP TABLE IF EXISTS public.workout_templates CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Enable pgvector for future AI RAG search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the Profiles table 
-- (Links securely to Clerk IDs)
CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY, -- Changed to TEXT for Clerk compatibility
    display_name TEXT,
    email TEXT,
    age INTEGER,
    bodyweight_kg NUMERIC,
    training_frequency INTEGER,
    preferred_progression_style TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Wait until Clerk JWT integration to fully enforce RLS, or enable basic policies:
CREATE POLICY "Users can Read own profile" ON public.profiles FOR SELECT USING (true); -- simplify during migration
CREATE POLICY "Users can Update own profile" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Users can Insert own profile" ON public.profiles FOR INSERT WITH CHECK (true);

-- 3. Create the Main Exercises Library Table
-- Replaces MergedData.json
CREATE TABLE public.exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    steps JSONB DEFAULT '[]'::jsonb,
    body_part TEXT,
    target_muscle TEXT,
    equipment TEXT,
    muscles JSONB DEFAULT '[]'::jsonb,
    difficulty TEXT,
    video_urls JSONB DEFAULT '{}'::jsonb,
    embedding vector(3072), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercises are viewable by everyone" ON public.exercises FOR SELECT USING (true);

-- 4. Workout Templates Table
CREATE TABLE public.workout_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    estimated_duration_minutes INTEGER,
    is_custom BOOLEAN DEFAULT true,
    exercises JSONB DEFAULT '[]'::jsonb, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own templates" ON public.workout_templates FOR ALL USING (true);

-- 5. Workout Programs Table
CREATE TABLE public.workout_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    schedule JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own programs" ON public.workout_programs FOR ALL USING (true);

-- 6. Historical Workouts (The Logbook)
CREATE TABLE public.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    duration_seconds INTEGER,
    total_volume_kg NUMERIC,
    notes TEXT,
    exercises JSONB DEFAULT '[]'::jsonb, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workouts" ON public.workouts FOR ALL USING (true);

-- 7. User Goals Tracking Table
CREATE TABLE public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, 
    target_value NUMERIC NOT NULL,
    current_value NUMERIC DEFAULT 0,
    deadline TIMESTAMP WITH TIME ZONE,
    exercise_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON public.goals FOR ALL USING (true);
