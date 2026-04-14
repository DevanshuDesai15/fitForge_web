-- Phase 3 closure: align the checked-in Clerk/Supabase schema with the
-- application's current runtime expectations and tighten permissive RLS.

-- Profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Workout templates
ALTER TABLE public.workout_templates
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS difficulty TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Workout programs
ALTER TABLE public.workout_programs
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS difficulty TEXT,
ADD COLUMN IF NOT EXISTS frequency TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS template_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Historical workouts
ALTER TABLE public.workouts
ADD COLUMN IF NOT EXISTS template_id TEXT,
ADD COLUMN IF NOT EXISTS template_name TEXT,
ADD COLUMN IF NOT EXISTS day_name TEXT,
ADD COLUMN IF NOT EXISTS weight_unit TEXT,
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Tighten RLS policies to the Clerk JWT subject instead of permissive USING (true).
DROP POLICY IF EXISTS "Users can Read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can Insert own profile" ON public.profiles;
CREATE POLICY "Users can Read own profile"
ON public.profiles FOR SELECT
USING ((auth.jwt() ->> 'sub') = id);
CREATE POLICY "Users can Update own profile"
ON public.profiles FOR UPDATE
USING ((auth.jwt() ->> 'sub') = id)
WITH CHECK ((auth.jwt() ->> 'sub') = id);
CREATE POLICY "Users can Insert own profile"
ON public.profiles FOR INSERT
WITH CHECK ((auth.jwt() ->> 'sub') = id);

DROP POLICY IF EXISTS "Users manage own templates" ON public.workout_templates;
CREATE POLICY "Users manage own templates"
ON public.workout_templates FOR ALL
USING ((auth.jwt() ->> 'sub') = user_id)
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users manage own programs" ON public.workout_programs;
CREATE POLICY "Users manage own programs"
ON public.workout_programs FOR ALL
USING ((auth.jwt() ->> 'sub') = user_id)
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users manage own workouts" ON public.workouts;
CREATE POLICY "Users manage own workouts"
ON public.workouts FOR ALL
USING ((auth.jwt() ->> 'sub') = user_id)
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users manage own goals" ON public.goals;
CREATE POLICY "Users manage own goals"
ON public.goals FOR ALL
USING ((auth.jwt() ->> 'sub') = user_id)
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users manage own AI suggestions" ON public.ai_suggestions;
CREATE POLICY "Users manage own AI suggestions"
ON public.ai_suggestions FOR ALL
USING ((auth.jwt() ->> 'sub') = user_id)
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users manage own Progression Profiles" ON public.user_progression_profiles;
CREATE POLICY "Users manage own Progression Profiles"
ON public.user_progression_profiles FOR ALL
USING ((auth.jwt() ->> 'sub') = user_id)
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users manage own Exercise Analytics" ON public.exercise_analytics;
CREATE POLICY "Users manage own Exercise Analytics"
ON public.exercise_analytics FOR ALL
USING ((auth.jwt() ->> 'sub') = user_id)
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);
