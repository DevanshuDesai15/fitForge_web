import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './useSupabase';
import { useAuth } from '../contexts/AuthContext';

export function useProfile() {
  const supabase = useSupabase();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Fetch Profile
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser?.uid) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.uid)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, sync it
          return null;
        }
        throw error;
      }
      return data;
    },
    enabled: !!currentUser?.uid,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update Profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.uid,
          ...updatedData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', currentUser?.uid], data);
      // Also invalidate to be safe
      queryClient.invalidateQueries({ queryKey: ['profile', currentUser?.uid] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending
  };
}
