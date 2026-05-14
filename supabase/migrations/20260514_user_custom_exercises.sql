-- User-created custom exercises, scoped per user.
-- These appear in the swap/add dialog and persist across devices.

CREATE TABLE IF NOT EXISTS public.user_custom_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    muscle_group TEXT,
    equipment TEXT DEFAULT 'Various',
    difficulty TEXT DEFAULT 'Intermediate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, name)
);

ALTER TABLE public.user_custom_exercises ENABLE ROW LEVEL SECURITY;

-- Users can only read, insert, update, and delete their own custom exercises.
CREATE POLICY "Users manage own custom exercises"
    ON public.user_custom_exercises
    FOR ALL
    USING  ((auth.jwt() ->> 'sub') = user_id)
    WITH CHECK ((auth.jwt() ->> 'sub') = user_id);
