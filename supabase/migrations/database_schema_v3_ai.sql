-- FitForge Supabase SQL Schema Migration - V3 (AI Tables)
-- Run this script in your Supabase SQL Editor.

-- 1. AI Suggestions Table
-- Stores generated progressive overload insights and plateau warnings.
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
    user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    next_workout_suggestions JSONB DEFAULT '[]'::jsonb,
    plateau_alerts JSONB DEFAULT '[]'::jsonb,
    progression_plan JSONB DEFAULT '{}'::jsonb,
    interactions JSONB DEFAULT '[]'::jsonb,
    model_version TEXT DEFAULT '1.0.0',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own AI suggestions" ON public.ai_suggestions FOR ALL USING (true);


-- 2. User Progression Profiles Table
-- Stores metadata customized for AI scaling algorithms.
CREATE TABLE IF NOT EXISTS public.user_progression_profiles (
    user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    personal_metrics JSONB DEFAULT '{}'::jsonb,
    progression_preferences JSONB DEFAULT '{}'::jsonb,
    performance_metrics JSONB DEFAULT '{}'::jsonb,
    ai_model_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_progression_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own Progression Profiles" ON public.user_progression_profiles FOR ALL USING (true);


-- 3. Exercise Analytics Table
-- Tracks detailed per-user, per-exercise data exclusively for RAG querying later.
CREATE TABLE IF NOT EXISTS public.exercise_analytics (
    id TEXT PRIMARY KEY, -- Composite key format: userId_exerciseId
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    performance_history JSONB DEFAULT '[]'::jsonb,
    progression_metrics JSONB DEFAULT '{}'::jsonb,
    ai_insights JSONB DEFAULT '{}'::jsonb,
    last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_exercise_analytics_user ON public.exercise_analytics(user_id);

ALTER TABLE public.exercise_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own Exercise Analytics" ON public.exercise_analytics FOR ALL USING (true);
