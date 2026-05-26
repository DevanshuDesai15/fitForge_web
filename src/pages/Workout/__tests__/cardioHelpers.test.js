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
