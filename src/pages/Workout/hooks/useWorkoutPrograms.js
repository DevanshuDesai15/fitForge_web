import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useSupabase } from '../../../hooks/useSupabase';

const toArray = (value) => (Array.isArray(value) ? value : []);

function deriveMuscleGroups(exercises = []) {
  const groups = new Map();

  for (const exercise of toArray(exercises)) {
    const rawName = exercise.muscleGroup || exercise.target || exercise.bodyPart;
    if (!rawName) continue;

    const name = String(rawName).trim();
    const id = name.toLowerCase();

    if (!groups.has(id)) {
      groups.set(id, { id, name });
    }
  }

  return Array.from(groups.values());
}

function mapTemplateRowToDay(template, index) {
  if (!template) return null;

  const exercises = toArray(template.exercises);

  return {
    id: template.id,
    templateId: template.id,
    name: template.name || `Day ${index + 1}`,
    focus: template.description || '',
    exercises,
    muscleGroups: deriveMuscleGroups(exercises),
    category: template.category || 'Strength Training',
    difficulty: template.difficulty || 'Intermediate',
  };
}

/**
 * One-time cleanup: delete seeded (is_custom = false) templates and any
 * programs that reference them. Runs once per user, tracked via localStorage.
 */
async function cleanupSeededData(supabase, userId) {
  const cleanupKey = `fitforge_seeded_cleanup_${userId}`;
  if (localStorage.getItem(cleanupKey)) return;

  try {
    // Find all non-custom templates
    const { data: seededTemplates } = await supabase
      .from('workout_templates')
      .select('id')
      .eq('user_id', userId)
      .eq('is_custom', false);

    if (seededTemplates && seededTemplates.length > 0) {
      const seededIds = seededTemplates.map(t => t.id);

      // Find programs that reference these templates
      const { data: allPrograms } = await supabase
        .from('workout_programs')
        .select('id, template_ids')
        .eq('user_id', userId);

      // Delete programs whose template_ids are entirely seeded
      for (const program of (allPrograms || [])) {
        const tIds = toArray(program.template_ids);
        const allSeeded = tIds.length > 0 && tIds.every(id => seededIds.includes(id));
        if (allSeeded) {
          await supabase.from('workout_programs').delete().eq('id', program.id);
        }
      }

      // Delete the seeded templates
      await supabase
        .from('workout_templates')
        .delete()
        .eq('user_id', userId)
        .eq('is_custom', false);
    }
  } catch (error) {
    console.error('Error cleaning up seeded data:', error);
  }

  localStorage.setItem(cleanupKey, 'true');
}

export const useWorkoutPrograms = () => {
  const { currentUser } = useAuth();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  const {
    data: programs = [],
    isLoading: loading,
    error,
    refetch: loadPrograms,
  } = useQuery({
    queryKey: ['workoutPrograms', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) {
        return [];
      }

      // One-time cleanup of any previously seeded data
      await cleanupSeededData(supabase, currentUser.uid);

      const fetchPrograms = async () => {
        const result = await supabase
          .from('workout_programs')
          .select('*')
          .eq('user_id', currentUser.uid)
          .order('created_at', { ascending: false });

        if (result.error) throw result.error;
        return result.data || [];
      };

      const programRows = await fetchPrograms();

      const { data: templateRows, error: templateError } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('user_id', currentUser.uid);

      if (templateError) throw templateError;

      const templateById = new Map((templateRows || []).map((template) => [template.id, template]));

      return programRows.map((program) => {
        const templateIds = toArray(program.template_ids);
        const days = templateIds
          .map((templateId, index) => mapTemplateRowToDay(templateById.get(templateId), index))
          .filter(Boolean);

        return {
          id: program.id,
          name: program.name,
          description: program.description,
          category: program.category,
          difficulty: program.difficulty,
          frequency: program.frequency,
          duration: program.duration,
          templateIds,
          days,
          userId: program.user_id,
          createdAt: program.created_at,
          updatedAt: program.updated_at,
          isFromTemplate:
            templateIds.length > 0 &&
            templateIds.every((templateId) => templateById.get(templateId)?.is_custom === false),
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!currentUser) return;

    const subscription = supabase
      .channel('workout_programs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_programs',
          filter: `user_id=eq.${currentUser.uid}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['workoutPrograms', currentUser.uid] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser, supabase, queryClient]);

  return {
    programs,
    loading,
    error: error ? error.message : '',
    loadPrograms,
  };
};
