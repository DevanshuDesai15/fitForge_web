import { describe, expect, it } from 'vitest';
import {
  calculateDeloadPercentage,
  calculateInterventionEffectiveness,
  calculateTransferWeight,
  getExerciseVariations,
  prioritizeInterventions,
} from '../plateauInterventions';

describe('plateau intervention rules', () => {
  it('scales and caps deloads by severity and duration', () => {
    expect(calculateDeloadPercentage({ severity: 'severe', plateauDuration: 6 })).toBe(0.25);
  });

  it('returns mapped variations and rounded transfer weights', () => {
    expect(getExerciseVariations('bench-press')[0].exerciseId).toBe('incline-bench-press');
    expect(calculateTransferWeight(83, 0.85)).toBe(70.5);
  });

  it('prioritizes priority before estimated effectiveness', () => {
    const result = prioritizeInterventions([
      { priority: 'medium', estimatedEffectiveness: 0.9 },
      { priority: 'high', estimatedEffectiveness: 0.5 },
    ]);
    expect(result[0].priority).toBe('high');
    expect(calculateInterventionEffectiveness('deload', { severity: 'severe' })).toBeCloseTo(0.935);
  });
});
