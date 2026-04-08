import geminiConfig from "../config/geminiConfig";
import huggingFaceService from "./huggingFaceService";

const buildWorkoutAnalysisFallback = (exercise, completedSets) => {
  const avgWeight =
    completedSets.reduce((sum, set) => sum + parseFloat(set.weight || 0), 0) /
    completedSets.length;
  const avgReps =
    completedSets.reduce((sum, set) => sum + parseFloat(set.reps || 0), 0) /
    completedSets.length;

  return {
    avgWeight: `${avgWeight.toFixed(1)}lbs`,
    avgReps: avgReps.toFixed(1),
    formScore: "90%",
    insight: `Solid work on ${exercise.name}. Keep form consistent and progress gradually next session.`,
    quality: "Good",
    confidence: "80%",
  };
};

const mockGenerateWorkoutAnalysis = async (exercise, completedSets) =>
  buildWorkoutAnalysisFallback(exercise, completedSets);

class GeminiAIService {
  constructor(config = geminiConfig, provider = huggingFaceService) {
    this.config = config;
    this.provider = provider;
    this.disabled = !config.apiKey || config.emergencyDisable;
  }

  setSupabase(supabase) {
    this.provider.setSupabase?.(supabase);
  }

  async generateProgressionSuggestions(analysisData, userProfile, workoutHistory) {
    try {
      if (this.disabled || !this.config.useGeminiAI) {
        return this._generateFallbackSuggestion(analysisData);
      }

      const result = await this.provider.generateProgressionSuggestions(
        analysisData,
        userProfile,
        workoutHistory
      );

      return result || this._generateFallbackSuggestion(analysisData);
    } catch (error) {
      console.error("AI provider error, falling back to rule-based suggestion:", error);
      return this._generateFallbackSuggestion(analysisData);
    }
  }

  async generateBatchProgressionSuggestions(analysesData, userProfile, workoutHistory) {
    try {
      if (this.disabled || !this.config.useGeminiAI) {
        return this._generateBatchFallbackSuggestions(analysesData);
      }

      const result = await this.provider.generateBatchProgressionSuggestions(
        analysesData,
        userProfile,
        workoutHistory
      );

      if (!result?.suggestions?.length) {
        return this._generateBatchFallbackSuggestions(analysesData);
      }

      return {
        ...result,
        processedCount: result.processedCount || analysesData.length,
      };
    } catch (error) {
      console.error("AI provider batch error, falling back to rule-based suggestions:", error);
      return this._generateBatchFallbackSuggestions(analysesData);
    }
  }

  async generatePlateauInterventions(plateauData, userProfile, pastInterventions = []) {
    try {
      if (this.disabled || !this.config.useGeminiAI) {
        return this._generateFallbackInterventions(plateauData);
      }

      const result = await this.provider.generatePlateauInterventions(
        plateauData,
        userProfile,
        pastInterventions
      );

      if (!result?.interventions?.length) {
        return this._generateFallbackInterventions(plateauData);
      }

      return {
        ...result,
        interventions: result.interventions.map((intervention) => ({
          ...intervention,
          aiGenerated: true,
          priority: intervention.priority || this._calculateInterventionPriority(intervention, plateauData),
        })),
      };
    } catch (error) {
      console.error("AI provider plateau error, falling back to rule-based interventions:", error);
      return this._generateFallbackInterventions(plateauData);
    }
  }

  async generateWorkoutRecommendations(context, userProfile, recentWorkouts) {
    try {
      if (this.disabled || !this.config.useGeminiAI) {
        return this._generateFallbackWorkout(context, userProfile);
      }

      const result = await this.provider.generateWorkoutRecommendations(
        context,
        userProfile,
        recentWorkouts
      );

      return result || this._generateFallbackWorkout(context, userProfile);
    } catch (error) {
      console.error("AI provider workout error, falling back to default workout:", error);
      return this._generateFallbackWorkout(context, userProfile);
    }
  }

  async generateWorkoutAnalysis(exercise, completedSets) {
    try {
      if (this.disabled || !this.config.useGeminiAI) {
        return buildWorkoutAnalysisFallback(exercise, completedSets);
      }

      const result = await this.provider.generateWorkoutAnalysis(
        exercise,
        completedSets
      );

      return result || buildWorkoutAnalysisFallback(exercise, completedSets);
    } catch (error) {
      console.error("AI provider coach analysis error, using fallback analysis:", error);
      return buildWorkoutAnalysisFallback(exercise, completedSets);
    }
  }

  async isApiAvailable() {
    return this.provider.isAvailable();
  }

  getUsageStats() {
    return this.provider.getUsageStats();
  }

  cleanup() {
    this.provider.cleanup();
  }

  _calculateInterventionPriority(intervention, plateauData) {
    if (plateauData?.severity === "severe" && intervention.confidence > 0.8) {
      return "high";
    }
    if (intervention.confidence > 0.7) {
      return "medium";
    }
    return "low";
  }

  _generateFallbackSuggestion(analysisData) {
    return {
      primarySuggestion: {
        exerciseId: analysisData.exerciseId,
        exerciseName: analysisData.exerciseName,
        suggestion: "Continue with rule-based progression",
        reasoning: `Based on ${analysisData.totalSessions} sessions of data`,
        confidence: analysisData.confidenceLevel || 0.5,
        riskFactors: [],
        benefits: ["Consistent progression"],
      },
      alternatives: [],
      personalizedTips: ["Focus on proper form"],
      cautionaryNotes: ["AI service temporarily unavailable"],
    };
  }

  _generateBatchFallbackSuggestions(analysesData) {
    return {
      suggestions: analysesData.map((analysis) => ({
        exerciseId: analysis.exerciseId,
        exerciseName: analysis.exerciseName,
        suggestion: "Continue with rule-based progression",
        reasoning: `Based on ${analysis.totalSessions} sessions of data`,
        confidence: analysis.confidenceLevel || 0.5,
        riskFactors: [],
        benefits: ["Consistent progression"],
      })),
      overallInsights: {
        trainingBalance: "Using rule-based progression for balanced training",
        recoveryRecommendations: ["Monitor form and recovery between sessions"],
        priorityExercises: analysesData.slice(0, 3).map((analysis) => analysis.exerciseName),
      },
      processedCount: analysesData.length,
      fallbackReason: "AI service temporarily unavailable",
    };
  }

  _generateFallbackInterventions() {
    return {
      interventions: [
        {
          type: "deload",
          title: "Standard Deload Week",
          description: "Reduce weight by 10% for 1 week",
          implementation: {
            duration: "1 week",
            parameters: { weightReduction: 0.1 },
            progressionPlan: "Return to previous weight after deload",
          },
          reasoning: "Basic plateau intervention",
          confidence: 0.7,
          expectedTimeframe: "1-2 weeks",
        },
      ],
      explanation: "Using standard deload protocol",
      expectedOutcome: "Should help break plateau",
      timeframe: "1-2 weeks",
    };
  }

  _generateFallbackWorkout(context, userProfile) {
    return {
      workoutPlan: {
        exercises: [
          {
            exerciseId: "squat",
            exerciseName: "Squat",
            sets: 3,
            reps: "8-10",
            weight: "progressive",
            restTime: 90,
            notes: "Standard progression",
          },
        ],
      },
      reasoning: "Fallback workout plan",
      adaptations: {},
      tips: ["Focus on proper form"],
      estimatedDuration: context?.availableTime || 45,
      difficultyLevel: userProfile?.experienceLevel || "intermediate",
    };
  }
}

const geminiAIService = new GeminiAIService();

export const getGeminiModel = () => null;

export const generateWorkoutAnalysis = async (
  exercise,
  completedSets,
  useMock = false
) => {
  if (useMock) {
    return mockGenerateWorkoutAnalysis(exercise, completedSets);
  }

  return geminiAIService.generateWorkoutAnalysis(exercise, completedSets);
};

export default geminiAIService;
export { GeminiAIService };
