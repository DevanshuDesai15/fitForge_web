import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from './useSupabase';
import { listWorkouts } from '../services/workoutRepository';

export const workoutQueryKeys = {
  all: (userId) => ['workouts', userId],
  list: (userId, options = {}) => ['workouts', userId, 'list', options],
};

export function useWorkouts(options = {}, queryOptions = {}) {
  const { currentUser } = useAuth();
  const supabase = useSupabase();
  const userId = currentUser?.uid;

  return useQuery({
    queryKey: workoutQueryKeys.list(userId, options),
    queryFn: () => listWorkouts({ supabase, userId, ...options }),
    enabled: Boolean(userId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  });
}

export function useWorkoutReader() {
  const { currentUser } = useAuth();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const userId = currentUser?.uid;

  return useCallback((options = {}) => {
    if (!userId) return Promise.resolve([]);
    return queryClient.fetchQuery({
      queryKey: workoutQueryKeys.list(userId, options),
      queryFn: () => listWorkouts({ supabase, userId, ...options }),
      staleTime: 30 * 1000,
    });
  }, [queryClient, supabase, userId]);
}
