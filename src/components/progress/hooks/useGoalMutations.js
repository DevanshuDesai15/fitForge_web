import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useSupabase } from '../../../hooks/useSupabase';

const GOAL_QUERY_KEY = (userId) => ['goals', userId];

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const toNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const toNullIfEmpty = (value) => (value === '' || value == null ? null : value);

const setIfPresent = (target, source, sourceKey, targetKey = sourceKey, transform = (value) => value) => {
  if (hasOwn(source, sourceKey)) {
    target[targetKey] = transform(source[sourceKey]);
  }
};

export function mapGoalToDb(goal = {}, userId, options = {}) {
  return {
    user_id: userId,
    title: goal.title ?? '',
    description: goal.description ?? '',
    category: goal.category ?? null,
    type: goal.type ?? 'personal_record',
    target_value: toNumber(goal.targetValue ?? goal.target_value, 0),
    current_value: toNumber(goal.currentValue ?? goal.current_value, 0),
    unit: goal.unit ?? null,
    exercise_name: toNullIfEmpty(goal.exerciseName ?? goal.exercise_name ?? goal.title ?? ''),
    priority: goal.priority ?? 'medium',
    deadline: toNullIfEmpty(goal.deadline),
    completed: goal.completed ?? false,
    target_weight: toNullIfEmpty(goal.targetWeight ?? goal.target_weight),
    target_reps: toNullIfEmpty(goal.targetReps ?? goal.target_reps),
    target_sets: toNullIfEmpty(goal.targetSets ?? goal.target_sets),
    ...(options.createdAt !== undefined ? { created_at: options.createdAt } : {}),
    ...(options.updatedAt !== undefined ? { updated_at: options.updatedAt } : {}),
  };
}

export function mapGoalUpdateToDb(goal = {}) {
  const patch = {};

  setIfPresent(patch, goal, 'title');
  setIfPresent(patch, goal, 'description');
  setIfPresent(patch, goal, 'category');
  setIfPresent(patch, goal, 'type');
  setIfPresent(patch, goal, 'targetValue', 'target_value', (value) => toNumber(value, 0));
  setIfPresent(patch, goal, 'target_value', 'target_value', (value) => toNumber(value, 0));
  setIfPresent(patch, goal, 'currentValue', 'current_value', (value) => toNumber(value, 0));
  setIfPresent(patch, goal, 'current_value', 'current_value', (value) => toNumber(value, 0));
  setIfPresent(patch, goal, 'unit');
  setIfPresent(patch, goal, 'exerciseName', 'exercise_name', toNullIfEmpty);
  setIfPresent(patch, goal, 'exercise_name', 'exercise_name', toNullIfEmpty);
  setIfPresent(patch, goal, 'priority');
  setIfPresent(patch, goal, 'deadline', 'deadline', toNullIfEmpty);
  setIfPresent(patch, goal, 'completed');
  setIfPresent(patch, goal, 'targetWeight', 'target_weight', toNullIfEmpty);
  setIfPresent(patch, goal, 'target_weight', 'target_weight', toNullIfEmpty);
  setIfPresent(patch, goal, 'targetReps', 'target_reps', toNullIfEmpty);
  setIfPresent(patch, goal, 'target_reps', 'target_reps', toNullIfEmpty);
  setIfPresent(patch, goal, 'targetSets', 'target_sets', toNullIfEmpty);
  setIfPresent(patch, goal, 'target_sets', 'target_sets', toNullIfEmpty);

  return patch;
}

function requireUserId(userId) {
  if (!userId) {
    throw new Error('Goal mutations require an authenticated user');
  }
}

async function invalidateGoalQueries(queryClient, queryKey) {
  await queryClient.invalidateQueries({ queryKey });
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

function createTimestampBundle() {
  const updatedAt = new Date().toISOString();
  return {
    createdAt: updatedAt,
    updatedAt,
  };
}

export function createGoalMutationLayer({ supabase, queryClient, userId }) {
  const queryKey = GOAL_QUERY_KEY(userId);

  return {
    createGoal: async (goal) => {
      requireUserId(userId);
      const timestamps = createTimestampBundle();
      const payload = mapGoalToDb(goal, userId, timestamps);
      const data = await runInsertMutation({ supabase, table: 'goals', payload });
      await invalidateGoalQueries(queryClient, queryKey);
      return data;
    },
    updateGoal: async (id, goal) => {
      requireUserId(userId);
      const payload = {
        ...mapGoalUpdateToDb(goal),
        updated_at: new Date().toISOString(),
      };
      const data = await runUpdateMutation({ supabase, table: 'goals', id, payload, userId });
      await invalidateGoalQueries(queryClient, queryKey);
      return data;
    },
    deleteGoal: async (id) => {
      requireUserId(userId);
      const data = await runDeleteMutation({ supabase, table: 'goals', id, userId });
      if (data.deleted) {
        await invalidateGoalQueries(queryClient, queryKey);
      }
      return data;
    },
  };
}

export function useGoalMutations() {
  const { currentUser } = useAuth();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMemo(
    () =>
      createGoalMutationLayer({
        supabase,
        queryClient,
        userId: currentUser?.uid,
      }),
    [currentUser?.uid, queryClient, supabase]
  );
}
