import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import { useSupabase } from "../../../hooks/useSupabase";

export const useWorkoutTemplates = () => {
  const { currentUser } = useAuth();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

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

      // Map back to camelCase for backwards-compatible frontend components
      return (data || []).map(tmpl => ({
        ...tmpl,
        userId: tmpl.user_id,
        estimatedDurationMinutes: tmpl.estimated_duration_minutes,
        isCustom: tmpl.is_custom,
        createdAt: tmpl.created_at,
      }));
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    templates,
    loading,
    error: error ? error.message : "",
    loadTemplates,
  };
};
