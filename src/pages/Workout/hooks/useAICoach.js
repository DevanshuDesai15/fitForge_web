import { useState, useCallback } from "react";
import { generateWorkoutAnalysis } from "../../../services/geminiAIService";

export const useAICoach = () => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const getAIAnalysis = useCallback(async (exercise) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const completedSets =
        exercise.sets?.filter((set) => set.completed && set.reps) || [];
      if (completedSets.length === 0) {
        throw new Error("No completed sets to analyze.");
      }

      const analysisResult = await generateWorkoutAnalysis(
        exercise,
        completedSets
      );
      setAnalysis(analysisResult);
    } catch (err) {
      console.error("Error getting AI analysis:", err);
      setError(err.message || "Failed to get AI analysis.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, analysis, error, getAIAnalysis };
};
