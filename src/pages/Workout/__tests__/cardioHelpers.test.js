import { describe, it, expect } from 'vitest';
import { buildCardioExercise } from '../components/AddExerciseDialog';

describe('buildCardioExercise', () => {
  it('returns an object with exercise_type cardio', () => {
    const ex = buildCardioExercise('Running');
    expect(ex.exercise_type).toBe('cardio');
  });

  it('sets cardio.completed to false', () => {
    const ex = buildCardioExercise('Walking');
    expect(ex.cardio.completed).toBe(false);
  });

  it('sets duration and distance to null initially', () => {
    const ex = buildCardioExercise('Hiking');
    expect(ex.cardio.duration_minutes).toBeNull();
    expect(ex.cardio.distance_km).toBeNull();
  });

  it('sets name from argument', () => {
    const ex = buildCardioExercise('Cycling');
    expect(ex.name).toBe('Cycling');
  });
});

import { toDisplayDistance, toStoredKm } from '../components/ModernWorkoutExercise';

describe('toDisplayDistance', () => {
  it('returns km as-is for metric (kg) users', () => {
    expect(toDisplayDistance(5, 'kg')).toBe(5);
  });

  it('converts km to miles for imperial (lbs) users', () => {
    expect(toDisplayDistance(5, 'lbs')).toBeCloseTo(3.11, 1);
  });

  it('returns empty string for null input', () => {
    expect(toDisplayDistance(null, 'kg')).toBe('');
  });
});

describe('toStoredKm', () => {
  it('stores km as-is for metric users', () => {
    expect(toStoredKm(5, 'kg')).toBe(5);
  });

  it('converts miles to km for imperial users', () => {
    expect(toStoredKm(3.11, 'lbs')).toBeCloseTo(5.0, 1);
  });

  it('returns null for empty string input', () => {
    expect(toStoredKm('', 'kg')).toBeNull();
  });
});
