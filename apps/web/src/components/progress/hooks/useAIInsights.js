import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ProgressiveOverloadAIService from "../../../services/progressiveOverloadAI";
import { useAuth } from "../../../contexts/AuthContext";
import { useSupabase } from "../../../hooks/useSupabase";

export const useAIInsights = () => {
  const [aiService] = useState(() => ProgressiveOverloadAIService);
  const { currentUser } = useAuth();
  const supabase = useSupabase();

  useEffect(() => {
    aiService.setSupabase(supabase);
  }, [supabase, aiService]);

  const generateProgressionInsightMessage = useCallback((analysis) => {
    const trend = analysis.progressionTrend;
    const rate = analysis.progressionRate;
    const sessions = analysis.totalSessions;

    if (trend === "improving") {
      return `Great progress! You're gaining ${rate.toFixed(
        1
      )}kg per week on average over ${sessions} sessions. Keep up the consistent training.`;
    } else if (trend === "maintaining") {
      return `You're maintaining strength levels. Consider progressive overload techniques to continue advancing.`;
    } else {
      return `Performance has declined recently. Consider reviewing your recovery, nutrition, or training intensity.`;
    }
  }, []);

  const { data, refetch: loadAIInsights } = useQuery({
    queryKey: ['aiInsights', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return { analyses: [], insights: [] };

      const analyses = await aiService.analyzeWorkoutHistory(currentUser.uid);
      const insights = analyses
        .filter((analysis) => analysis.totalSessions >= 3)
        .map((analysis) => ({
          exerciseId: analysis.exerciseId,
          exerciseName: analysis.exerciseName,
          type: "progression_trend",
          title: `${analysis.exerciseName} Progression Analysis`,
          message: generateProgressionInsightMessage(analysis),
          confidenceLevel: analysis.confidenceLevel,
          trend: analysis.progressionTrend,
          data: analysis,
        }));

      return { analyses, insights };
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  return {
    aiInsights: data?.insights || [],
    progressionAnalyses: data?.analyses || [],
    loadAIInsights,
  };
};
