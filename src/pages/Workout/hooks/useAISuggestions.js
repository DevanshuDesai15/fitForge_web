import { useState, useCallback } from "react";
import ProgressiveOverloadAIService from "../../../services/progressiveOverloadAI";
import { useAuth } from "../../../contexts/AuthContext";

export const useAISuggestions = () => {
  const [aiSuggestions, setAiSuggestions] = useState({});
  const [loading, setLoading] = useState(false);

  const { currentUser } = useAuth();

  const loadAISuggestions = useCallback(
    async (exerciseNames) => {
      if (!currentUser || !exerciseNames.length) return;

      setLoading(true);

      try {
        const suggestions = {};

        // Load AI suggestions for each exercise
        for (const exerciseName of exerciseNames) {
          try {
            const progression =
              await ProgressiveOverloadAIService.getProgressionSuggestion(
                currentUser.uid,
                exerciseName
              );

            if (progression && progression.confidenceLevel > 0.3) {
              suggestions[exerciseName] = progression;
            }
          } catch (error) {
            console.warn(
              `Failed to load AI suggestion for ${exerciseName}:`,
              error
            );
          }
        }

        setAiSuggestions(suggestions);
      } catch (error) {
        console.error("Error loading AI suggestions:", error);
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  const getSuggestionForExercise = useCallback(
    (exerciseName) => {
      return aiSuggestions[exerciseName] || null;
    },
    [aiSuggestions]
  );

  const clearSuggestions = useCallback(() => {
    setAiSuggestions({});
  }, []);

  return {
    aiSuggestions,
    loading,
    loadAISuggestions,
    getSuggestionForExercise,
    clearSuggestions,
  };
};
