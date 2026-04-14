import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSupabase } from '../../../hooks/useSupabase';
import { safeCapture } from '../../../services/analyticsService';
import {
  mapProgramToDb,
  mapProgramUpdateToDb,
  mapTemplateToDb,
  mapTemplateUpdateToDb,
  mapWorkoutToDb,
  mapWorkoutUpdateToDb,
} from '../../../services/workoutDataService';

const QUERY_KEYS = {
  templates: (userId) => ['workoutTemplates', userId],
  programs: (userId) => ['workoutPrograms', userId],
  workouts: (userId) => ['workouts', userId],
};

const toArray = (value) => (Array.isArray(value) ? value : []);

function createTimestampBundle() {
  const updatedAt = new Date().toISOString();
  return {
    createdAt: updatedAt,
    updatedAt,
  };
}

function requireUserId(userId) {
  if (!userId) {
    throw new Error('Workout mutations require an authenticated user');
  }
}

async function invalidateWorkoutQueries(queryClient, queryKey) {
  await queryClient.invalidateQueries({ queryKey });
}

export function mapWorkoutDayToTemplateInput(day = {}, defaults = {}) {
  const exercises = toArray(day.exercises);

  return {
    name: day.name ?? defaults.name ?? 'Workout Day',
    description: day.focus ?? defaults.description ?? '',
    category: day.category ?? defaults.category,
    difficulty: day.difficulty ?? defaults.difficulty,
    exercises,
    estimatedDurationMinutes:
      day.estimatedDurationMinutes ??
      defaults.estimatedDurationMinutes ??
      (exercises.length > 0 ? exercises.length * 8 : null),
    isCustom: defaults.isCustom ?? true,
  };
}

export async function syncProgramTemplateIds({
  days = [],
  existingTemplateIds = [],
  createTemplate,
  updateTemplate,
  deleteTemplate,
  defaults = {},
  removeMissing = false,
}) {
  const normalizedDays = [];
  const templateIds = [];
  const createdTemplateIds = [];
  const removedTemplateIds = removeMissing
    ? existingTemplateIds.filter((templateId) => {
        return !toArray(days).some((day) => {
          const persistedTemplateId =
            typeof day?.templateId === 'string' && day.templateId.length > 0
              ? day.templateId
              : null;
          return persistedTemplateId === templateId;
        });
      })
    : [];

  const rollback = async () => {
    for (const templateId of [...createdTemplateIds].reverse()) {
      try {
        await deleteTemplate(templateId);
      } catch (cleanupError) {
        console.error('Error rolling back created workout template:', cleanupError);
      }
    }
  };

  const commitRemovals = async () => {
    for (const templateId of removedTemplateIds) {
      await deleteTemplate(templateId);
    }
  };

  try {
    for (const day of toArray(days)) {
      const templateInput = mapWorkoutDayToTemplateInput(day, defaults);
      const persistedTemplateId =
        typeof day?.templateId === 'string' && day.templateId.length > 0
          ? day.templateId
          : null;

      if (persistedTemplateId) {
        await updateTemplate(persistedTemplateId, templateInput);
        templateIds.push(persistedTemplateId);
        normalizedDays.push({
          ...day,
          id: day.id ?? persistedTemplateId,
          templateId: persistedTemplateId,
        });
        continue;
      }

      const createdTemplate = await createTemplate(templateInput);
      createdTemplateIds.push(createdTemplate.id);
      templateIds.push(createdTemplate.id);
      normalizedDays.push({
        ...day,
        id: day.id ?? createdTemplate.id,
        templateId: createdTemplate.id,
      });
    }
  } catch (error) {
    await rollback();
    throw error;
  }

  return {
    templateIds,
    days: normalizedDays,
    rollback,
    commitRemovals,
  };
}

async function runInsertMutation({ supabase, table, payload }) {
  const { data, error } = await supabase
    .from(table)
    .insert([payload])
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function runUpdateMutation({ supabase, table, id, payload, userId }) {
  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function runDeleteMutation({ supabase, table, id, userId }) {
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;

  const deleted = Array.isArray(data) ? data.length > 0 : Boolean(data);

  return {
    deleted,
    id: Array.isArray(data) && data[0]?.id ? data[0].id : id,
  };
}

function createEntityMutations({
  supabase,
  queryClient,
  userId,
  table,
  mapToDb,
  mapUpdateToDb,
  queryKey,
}) {
  const invalidate = () => invalidateWorkoutQueries(queryClient, queryKey);

  return {
    create: async (value) => {
      requireUserId(userId);
      const timestamps = createTimestampBundle();
      const payload = mapToDb(value, userId, timestamps);
      const data = await runInsertMutation({ supabase, table, payload });
      await invalidate();
      return data;
    },
    update: async (id, value) => {
      requireUserId(userId);
      const payload = {
        ...mapUpdateToDb(value),
        updated_at: new Date().toISOString(),
      };
      const data = await runUpdateMutation({ supabase, table, id, payload, userId });
      await invalidate();
      return data;
    },
    remove: async (id) => {
      requireUserId(userId);
      const data = await runDeleteMutation({ supabase, table, id, userId });
      if (data.deleted) {
        await invalidate();
      }
      return data;
    },
  };
}

export function createWorkoutMutationLayer({ supabase, queryClient, userId }) {
  const templates = createEntityMutations({
    supabase,
    queryClient,
    userId,
    table: 'workout_templates',
    mapToDb: mapTemplateToDb,
    mapUpdateToDb: mapTemplateUpdateToDb,
    queryKey: QUERY_KEYS.templates(userId),
  });

  const programs = createEntityMutations({
    supabase,
    queryClient,
    userId,
    table: 'workout_programs',
    mapToDb: mapProgramToDb,
    mapUpdateToDb: mapProgramUpdateToDb,
    queryKey: QUERY_KEYS.programs(userId),
  });

  const workouts = createEntityMutations({
    supabase,
    queryClient,
    userId,
    table: 'workouts',
    mapToDb: mapWorkoutToDb,
    mapUpdateToDb: mapWorkoutUpdateToDb,
    queryKey: QUERY_KEYS.workouts(userId),
  });

  return {
    createTemplate: templates.create,
    updateTemplate: templates.update,
    deleteTemplate: templates.remove,
    createProgram: programs.create,
    updateProgram: programs.update,
    deleteProgram: programs.remove,
    createWorkout: workouts.create,
    updateWorkout: workouts.update,
    deleteWorkout: workouts.remove,
  };
}

export function useWorkoutMutations() {
  const { currentUser } = useAuth();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  return useMemo(() => {
    const layer = createWorkoutMutationLayer({
      supabase,
      queryClient,
      userId: currentUser?.uid,
    });

    return {
      ...layer,
      createTemplate: async (value) => {
        const data = await layer.createTemplate(value);
        safeCapture(posthog, 'workout_template_created', {
          template_id: data?.id,
          template_name: data?.name,
          exercise_count: Array.isArray(data?.exercises) ? data.exercises.length : undefined,
        });
        return data;
      },
      deleteTemplate: async (id) => {
        const data = await layer.deleteTemplate(id);
        safeCapture(posthog, 'workout_template_deleted', { template_id: id });
        return data;
      },
      createProgram: async (value) => {
        const data = await layer.createProgram(value);
        safeCapture(posthog, 'workout_program_created', {
          program_id: data?.id,
          program_name: data?.name,
          day_count: Array.isArray(data?.template_ids) ? data.template_ids.length : undefined,
        });
        return data;
      },
    };
  }, [currentUser?.uid, queryClient, supabase, posthog]);
}
