-- FitForge Supabase SQL Schema Migration
-- Paste this entirely into the Supabase SQL Editor to build your database!

-- 1. Enable pgvector for future AI RAG search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the Profiles table 
-- (Links securely to Clerk/Supabase Auth UUIDs)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY, -- Will map to your Auth User ID
    display_name TEXT,
    email TEXT,
    age INTEGER,
    bodyweight_kg NUMERIC,
    training_frequency INTEGER,
    preferred_progression_style TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can Read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can Update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can Insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Create the Main Exercises Library Table
-- This replaces MergedData.json
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
    embedding vector(3072), -- For future Hugging Face similarity search!
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Exercises are public read-only
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercises are viewable by everyone" ON public.exercises FOR SELECT USING (true);


-- 4. Workout Templates Table
CREATE TABLE public.workout_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    estimated_duration_minutes INTEGER,
    is_custom BOOLEAN DEFAULT true,
    exercises JSONB DEFAULT '[]'::jsonb, -- Using JSONB for simple array of exercise objects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own templates" ON public.workout_templates FOR ALL USING (auth.uid() = user_id);


-- 5. Workout Programs Table
CREATE TABLE public.workout_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    schedule JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own programs" ON public.workout_programs FOR ALL USING (auth.uid() = user_id);


-- 6. Historical Workouts (The Logbook)
CREATE TABLE public.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    duration_seconds INTEGER,
    total_volume_kg NUMERIC,
    notes TEXT,
    exercises JSONB DEFAULT '[]'::jsonb, -- Storing sets, reps, weight structurally
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workouts" ON public.workouts FOR ALL USING (auth.uid() = user_id);


-- 7. User Goals Tracking Table
CREATE TABLE public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., 'weight', 'reps', 'frequency'
    target_value NUMERIC NOT NULL,
    current_value NUMERIC DEFAULT 0,
    deadline TIMESTAMP WITH TIME ZONE,
    exercise_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

-- 8. Analytics (Tracking AI plateaus and progressions over time)
CREATE TABLE public.exercise_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    max_weight NUMERIC,
    trend TEXT, -- 'improving', 'plateau', 'declining'
    ai_suggestions JSONB DEFAULT '[]'::jsonb,
    last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.exercise_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own analytics" ON public.exercise_analytics FOR ALL USING (auth.uid() = user_id);
