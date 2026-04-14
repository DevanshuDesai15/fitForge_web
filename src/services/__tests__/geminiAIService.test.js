import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGenerateProgressionSuggestions = vi.fn();
const mockGenerateBatchProgressionSuggestions = vi.fn();
const mockGeneratePlateauInterventions = vi.fn();
const mockGenerateWorkoutRecommendations = vi.fn();
const mockGenerateWorkoutAnalysis = vi.fn();
const mockIsAvailable = vi.fn();
const mockGetUsageStats = vi.fn();
const mockCleanup = vi.fn();

vi.mock('../huggingFaceService', () => ({
  default: {
    generateProgressionSuggestions: mockGenerateProgressionSuggestions,
    generateBatchProgressionSuggestions: mockGenerateBatchProgressionSuggestions,
    generatePlateauInterventions: mockGeneratePlateauInterventions,
    generateWorkoutRecommendations: mockGenerateWorkoutRecommendations,
    generateWorkoutAnalysis: mockGenerateWorkoutAnalysis,
    isAvailable: mockIsAvailable,
    getUsageStats: mockGetUsageStats,
    cleanup: mockCleanup,
  },
}));

vi.mock('../config/geminiConfig', () => ({
  default: {
    apiKey: 'hf_test_key',
    useGeminiAI: true,
    emergencyDisable: false,
    model: 'test-model',
    temperature: 0.4,
    maxTokens: 1500,
    maxRetries: 0,
    requestTimeout: 20000,
  },
}));

describe('geminiAIService compatibility facade', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('delegates progression suggestions to the Hugging Face service', async () => {
    const aiResult = {
      primarySuggestion: {
        exerciseId: 'bench-press',
        confidence: 0.91,
      },
    };
    mockGenerateProgressionSuggestions.mockResolvedValue(aiResult);

    const { GeminiAIService } = await import('../geminiAIService');
    const service = new GeminiAIService();

    const analysisData = {
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      totalSessions: 5,
      confidenceLevel: 0.74,
    };
    const userProfile = { experienceLevel: 'intermediate' };
    const workoutHistory = [];

    await expect(
      service.generateProgressionSuggestions(
        analysisData,
        userProfile,
        workoutHistory
      )
    ).resolves.toEqual(aiResult);

    expect(mockGenerateProgressionSuggestions).toHaveBeenCalledWith(
      analysisData,
      userProfile,
      workoutHistory
    );
  });

  it('falls back to rule-based batch suggestions when the provider fails', async () => {
    mockGenerateBatchProgressionSuggestions.mockRejectedValue(
      new Error('provider unavailable')
    );

    const { GeminiAIService } = await import('../geminiAIService');
    const service = new GeminiAIService();

    const analysesData = [
      {
        exerciseId: 'squat',
        exerciseName: 'Squat',
        totalSessions: 8,
        confidenceLevel: 0.88,
      },
    ];

    await expect(
      service.generateBatchProgressionSuggestions(analysesData, {}, [])
    ).resolves.toEqual(
      expect.objectContaining({
        suggestions: [
          expect.objectContaining({
            exerciseId: 'squat',
            suggestion: 'Continue with rule-based progression',
          }),
        ],
        fallbackReason: 'AI service temporarily unavailable',
      })
    );
  });

  it('routes workout analysis through Hugging Face by default', async () => {
    const analysis = {
      avgWeight: '100.0lbs',
      avgReps: '10.0',
      insight: 'Push the top set next time.',
    };
    mockGenerateWorkoutAnalysis.mockResolvedValue(analysis);

    const { generateWorkoutAnalysis } = await import('../geminiAIService');

    const exercise = {
      name: 'Incline Dumbbell Press',
      targetSets: 3,
      targetReps: 10,
    };
    const completedSets = [
      { reps: 10, weight: 95, completed: true },
      { reps: 10, weight: 105, completed: true },
    ];

    await expect(generateWorkoutAnalysis(exercise, completedSets)).resolves.toEqual(
      analysis
    );

    expect(mockGenerateWorkoutAnalysis).toHaveBeenCalledWith(
      exercise,
      completedSets
    );
  });
});
