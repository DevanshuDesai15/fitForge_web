import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { useAuth } from '../contexts/AuthContext';

const CACHE_KEY = 'fitforge_custom_exercises';

const readCache = () => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || []; }
    catch { return []; }
};

const writeCache = (exercises) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(exercises));
};

const rowToExercise = (row) => ({
    name: row.name,
    primaryMuscles: row.muscle_group ? [row.muscle_group] : [],
    muscles: row.muscle_group || 'Various',
    muscleGroups: row.muscle_group || 'Various',
    equipment: row.equipment || 'Various',
    difficulty: row.difficulty || 'Intermediate',
    isCustom: true,
});

export const useCustomExercises = () => {
    const supabase = useSupabase();
    const { currentUser } = useAuth();

    // Seed from cache so the list is immediately available before the network resolves.
    const [customExercises, setCustomExercises] = useState(readCache);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: sbError } = await supabase
                .from('user_custom_exercises')
                .select('name, muscle_group, equipment, difficulty')
                .order('created_at', { ascending: false });

            if (sbError) throw sbError;

            const mapped = data.map(rowToExercise);
            setCustomExercises(mapped);
            writeCache(mapped);
        } catch (err) {
            console.error('useCustomExercises: fetch failed', err);
            setError(err);
            // Keep serving from cache — do not wipe state.
        } finally {
            setLoading(false);
        }
    }, [supabase, currentUser]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const saveCustomExercise = useCallback(async ({ name, muscleGroup }) => {
        if (!currentUser || !name?.trim()) return;

        const trimmed = name.trim();

        // Optimistic: add to local state + cache immediately.
        const newEntry = rowToExercise({
            name: trimmed,
            muscle_group: muscleGroup || null,
            equipment: 'Various',
            difficulty: 'Intermediate',
        });

        setCustomExercises((prev) => {
            const deduped = prev.filter(
                (e) => e.name.toLowerCase() !== trimmed.toLowerCase()
            );
            const updated = [newEntry, ...deduped];
            writeCache(updated);
            return updated;
        });

        // Persist to Supabase. Upsert so re-adding the same name is a no-op.
        try {
            const { error: sbError } = await supabase
                .from('user_custom_exercises')
                .upsert(
                    {
                        user_id: currentUser.uid,
                        name: trimmed,
                        muscle_group: muscleGroup || null,
                        equipment: 'Various',
                        difficulty: 'Intermediate',
                    },
                    { onConflict: 'user_id,name' }
                );

            if (sbError) throw sbError;
        } catch (err) {
            console.error('useCustomExercises: save failed', err);
            // Optimistic update already applied; degrade gracefully.
        }
    }, [supabase, currentUser]);

    return { customExercises, loading, error, saveCustomExercise, refresh };
};
