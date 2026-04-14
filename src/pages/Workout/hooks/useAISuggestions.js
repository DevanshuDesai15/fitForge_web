import { useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import ProgressiveOverloadAIService from "../../../services/progressiveOverloadAI";
import { useAuth } from "../../../contexts/AuthContext";
import { useSupabase } from "../../../hooks/useSupabase";

export const useAISuggestions = () => {
  const { currentUser } = useAuth();
  const supabase = useSupabase();

  useEffect(() => {
    ProgressiveOverloadAIService.setSupabase(supabase);
  }, [supabase]);

  const mutation = useMutation({
    mutationFn: async (exerciseNames) => {
      if (!currentUser || !exerciseNames?.length) return {};
      
      const suggestions = {};
      for (const exerciseName of exerciseNames) {
        try {
          const progression = await ProgressiveOverloadAIService.calculateNextProgression(
            currentUser.uid,
            exerciseName
          );

          if (progression && progression.confidenceLevel > 0.3) {
            suggestions[exerciseName] = progression;
          }
        } catch (error) {
          console.warn(`Failed to load AI suggestion for ${exerciseName}:`, error);
        }
      }
      return suggestions;
    }
  });

  const getSuggestionForExercise = useCallback(
    (exerciseName) => {
      return mutation.data ? mutation.data[exerciseName] || null : null;
    },
    [mutation.data]
  );

  const clearSuggestions = useCallback(() => {
    mutation.reset();
  }, [mutation]);

  return {
    aiSuggestions: mutation.data || {},
    loading: mutation.isPending,
    loadAISuggestions: mutation.mutateAsync,
    getSuggestionForExercise,
    clearSuggestions,
  };
};
