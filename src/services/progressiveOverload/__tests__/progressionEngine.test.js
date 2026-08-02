import { describe, expect, it } from 'vitest';
import {
  calculateProgressionAnalysis,
  generateProgressionSuggestion,
  getMaxReps,
  getMaxWeight,
} from '../progressionEngine';

describe('progression engine', () => {
  it('reads maximum weight and reps safely', () => {
    const sets = [{ weight: 80, reps: 8 }, { weight: 85, reps: 5 }];
    expect(getMaxWeight(sets)).toBe(85);
    expect(getMaxReps(sets)).toBe(8);
    expect(getMaxWeight(null)).toBe(0);
  });

  it('calculates an improving progression analysis from dated sessions', () => {
    const result = calculateProgressionAnalysis('bench-press', [
      { date: '2026-02-08', sets: [{ weight: 85, reps: 6 }] },
      { date: '2026-02-01', sets: [{ weight: 80, reps: 6 }] },
    ]);
    expect(result).toEqual(expect.objectContaining({
      exerciseId: 'bench-press',
      currentWeight: 85,
      progressionTrend: 'improving',
      progressionRate: 5,
      confidenceLevel: 0.3,
    }));
  });

  it('generates a rep-first suggestion for a maintaining compound lift', () => {
    const result = generateProgressionSuggestion(
      {
        exerciseId: 'bench-press', exerciseName: 'bench press', currentWeight: 80,
        currentReps: 6, currentSets: 3, progressionTrend: 'maintaining', confidenceLevel: 0.7,
      },
      { compoundWeightIncrease: 2.5, isolationWeightIncrease: 1, confidenceThreshold: 0.7, deloadPercentage: 0.1 },
      ['bench-press']
    );
    expect(result).toEqual(expect.objectContaining({ progressionType: 'reps', suggestedReps: 8 }));
  });
});
