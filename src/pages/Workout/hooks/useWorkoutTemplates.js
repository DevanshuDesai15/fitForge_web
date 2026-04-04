import { useQuery } from '@tanstack/react-query';
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

function mapTemplateRowToWorkoutDay(template) {
  const exercises = toArray(template.exercises);

  return {
    id: template.id,
    templateId: template.id,
    name: template.name || 'Workout Day',
    focus: template.description || '',
    exercises,
    muscleGroups: deriveMuscleGroups(exercises),
    category: template.category || 'Strength Training',
    difficulty: template.difficulty || 'Intermediate',
  };
}

export const useWorkoutTemplates = () => {
  const { currentUser } = useAuth();
  const supabase = useSupabase();

  const {
    data: templates = [],
    isLoading: loading,
    error,
    refetch: loadTemplates
  } = useQuery({
    queryKey: ['workoutTemplates', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];
      
      const { data, error: err } = await supabase
        .from("workout_templates")
        .select("*")
        .eq("user_id", currentUser.uid)
        .order("created_at", { ascending: false });

      if (err) throw err;

      return (data || []).map((tmpl) => ({
        ...tmpl,
        userId: tmpl.user_id,
        estimatedDurationMinutes: tmpl.estimated_duration_minutes,
        isCustom: tmpl.is_custom,
        createdAt: tmpl.created_at,
        updatedAt: tmpl.updated_at,
        workoutDays:
          Array.isArray(tmpl.workoutDays) && tmpl.workoutDays.length > 0
            ? tmpl.workoutDays
            : [mapTemplateRowToWorkoutDay(tmpl)],
      }));
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  return {
    templates,
    loading,
    error: error ? error.message : "",
    loadTemplates,
  };
};
