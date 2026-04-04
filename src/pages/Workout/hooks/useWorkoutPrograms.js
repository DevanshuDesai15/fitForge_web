import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useSupabase } from '../../../hooks/useSupabase';
import { programTemplates } from '../components/programTemplates';
import {
  createWorkoutMutationLayer,
  mapWorkoutDayToTemplateInput,
} from './useWorkoutMutations';

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

function mapDefaultProgram(program) {
  return {
    ...program,
    templateIds: [],
    isFromTemplate: true,
    days: toArray(program.days).map((day, index) => ({
      ...day,
      id: `starter-${program.id}-${index + 1}`,
      templateId: `starter-${program.id}-${index + 1}`,
      muscleGroups: deriveMuscleGroups(day.exercises),
    })),
  };
}

export async function seedStarterProgramsWithMutations({
  createTemplate,
  createProgram,
}) {
  for (const program of programTemplates) {
    const templateIds = [];

    for (const day of toArray(program.days)) {
      const templateRow = await createTemplate(
        mapWorkoutDayToTemplateInput(day, {
          description: program.description || '',
          category: program.category,
          difficulty: program.difficulty,
          isCustom: false,
        })
      );
      templateIds.push(templateRow.id);
    }

    await createProgram({
      name: program.name,
      description: program.description || '',
      category: program.category ?? null,
      difficulty: program.difficulty ?? null,
      frequency: program.frequency ?? null,
      duration: program.duration ?? null,
      templateIds,
    });
  }
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
        return programTemplates.map(mapDefaultProgram);
      }

      const fetchPrograms = async () => {
        const result = await supabase
          .from('workout_programs')
          .select('*')
          .eq('user_id', currentUser.uid)
          .order('created_at', { ascending: false });

        if (result.error) throw result.error;
        return result.data || [];
      };

      let programRows = await fetchPrograms();

      if (programRows.length === 0) {
        const mutationLayer = createWorkoutMutationLayer({
          supabase,
          queryClient,
          userId: currentUser.uid,
        });

        await seedStarterProgramsWithMutations({
          createTemplate: mutationLayer.createTemplate,
          createProgram: mutationLayer.createProgram,
        });
        programRows = await fetchPrograms();
      }

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
