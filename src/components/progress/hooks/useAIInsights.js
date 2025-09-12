import { useState, useCallback } from "react";
import ProgressiveOverloadAIService from "../../../services/progressiveOverloadAI";
import { useAuth } from "../../../contexts/AuthContext";

export const useAIInsights = () => {
  const [aiInsights, setAiInsights] = useState([]);
  const [progressionAnalyses, setProgressionAnalyses] = useState([]);
  const [aiService] = useState(() => ProgressiveOverloadAIService);

  const { currentUser } = useAuth();

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

  const loadAIInsights = useCallback(
    async (exerciseNames) => {
      if (!exerciseNames.length) return;

      try {
        // Load progression analyses for all exercises
        const analyses = await aiService.analyzeWorkoutHistory(currentUser.uid);
        setProgressionAnalyses(analyses);

        // Generate AI insights for weight progress
        const insights = analyses
          .filter((analysis) => analysis.totalSessions >= 3) // Only show insights for exercises with enough data
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

        setAiInsights(insights);
      } catch (error) {
        console.error("Error loading AI insights:", error);
      }
    },
    [currentUser.uid, aiService, generateProgressionInsightMessage]
  );

  return {
    aiInsights,
    progressionAnalyses,
    loadAIInsights,
  };
};
