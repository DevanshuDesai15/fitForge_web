import { describe, expect, it } from 'vitest';
import { ProgressiveOverloadAIService } from '../progressiveOverloadAI';

describe('ProgressiveOverloadAIService exercise substitutions', () => {
  it('returns the three strongest mapped bench press alternatives', async () => {
    const service = new ProgressiveOverloadAIService();
    const analysis = {
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      currentWeight: 100,
      currentReps: 8,
      currentSets: 3,
      confidenceLevel: 0.8,
    };

    const substitutions = await service._generateExerciseSubstitutions(
      analysis,
      {},
      'plateau'
    );

    expect(substitutions).toEqual([
      expect.objectContaining({
        exerciseId: 'incline-bench-press',
        suggestedWeight: 85,
        difficulty: 'Intermediate',
        equipment: 'Barbell + Incline bench',
      }),
      expect.objectContaining({
        exerciseId: 'dumbbell-press',
        suggestedWeight: 40,
        difficulty: 'Intermediate',
        equipment: 'Dumbbells',
      }),
      expect.objectContaining({
        exerciseId: 'push-ups',
        // Preserve the service's current `0 || 0.8` fallback behavior.
        suggestedWeight: 80,
        difficulty: 'Beginner',
        equipment: 'Bodyweight',
      }),
    ]);
    expect(substitutions[0].confidenceLevel).toBeCloseTo(0.74);
    expect(substitutions[1].confidenceLevel).toBeCloseTo(0.74);
    expect(substitutions[2].confidenceLevel).toBeCloseTo(0.64);
    expect(substitutions[0].reason).toContain('Break through plateau');
    expect(substitutions[0].benefits).toEqual([
      'Upper chest focus',
      'Shoulder-friendly angle',
      'Strength variation',
    ]);
  });

  it('uses conservative defaults for an unknown mapped alternative', () => {
    const service = new ProgressiveOverloadAIService();
    const analysis = { currentWeight: 73, confidenceLevel: 0.5 };

    expect(service._calculateSubstitutionWeight(analysis, 'unknown')).toBe(58);
    expect(service._calculateSubstitutionConfidence(analysis, 'unknown')).toBe(0.4);
    expect(service._getSubstitutionBenefits('unknown')).toEqual([
      'Muscle variation',
      'Movement diversity',
      'Progression option',
    ]);
    expect(service._getExerciseDifficulty('unknown')).toBe('Intermediate');
    expect(service._getExerciseEquipment('unknown')).toBe(
      'Standard gym equipment'
    );
  });
});
