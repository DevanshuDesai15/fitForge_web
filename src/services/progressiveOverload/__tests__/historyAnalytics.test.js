import { describe, expect, it } from 'vitest';
import {
  analyzeExerciseFrequency,
  analyzeVolumeProgression,
  calculateConsistencyScore,
  calculateDurationTrend,
  getEmptyWorkoutAnalysis,
} from '../historyAnalytics';

describe('progressive overload history analytics', () => {
  it('summarizes exercise frequency while ignoring invalid exercise IDs', () => {
    const workouts = [
      { exercises: [{ exerciseId: 'bench-press' }, { exerciseId: null }] },
      { exercises: [{ exerciseId: 'bench-press' }, { exerciseId: 'squat' }] },
    ];

    expect(analyzeExerciseFrequency(workouts)).toEqual(
      expect.objectContaining({
        totalUniqueExercises: 2,
        averageExercisesPerWorkout: 2,
        mostFrequent: [
          expect.objectContaining({ exerciseId: 'bench-press', frequency: 2 }),
          expect.objectContaining({ exerciseId: 'squat', frequency: 1 }),
        ],
      })
    );
  });

  it('calculates volume progression from chronological workout halves', () => {
    const workouts = [
      { date: '2026-01-02', timestamp: 'later', totalVolume: 300, exercises: [] },
      { date: '2026-01-01', timestamp: 'earlier', totalVolume: 100, exercises: [] },
    ];

    expect(analyzeVolumeProgression(workouts)).toEqual(
      expect.objectContaining({
        totalVolume: 400,
        averageVolume: 200,
        progressionRate: 200,
        progressionPercentage: 200,
        highestVolume: 300,
        lowestVolume: 100,
      })
    );
  });

  it('scores evenly spaced workouts as fully consistent', () => {
    expect(calculateConsistencyScore([2, 2, 2])).toBe(1);
  });

  it('detects a meaningful increase in workout duration', () => {
    const workouts = [
      { duration: 30 },
      { duration: 35 },
      { duration: 40 },
      { duration: 50 },
      { duration: 55 },
      { duration: 60 },
    ];

    expect(calculateDurationTrend(workouts)).toBe('increasing');
  });

  it('returns the stable empty-analysis contract', () => {
    expect(getEmptyWorkoutAnalysis()).toEqual(
      expect.objectContaining({
        totalWorkouts: 0,
        dateRange: { start: null, end: null },
        consistency: { score: 0, rating: 'insufficient_data' },
        recommendations: [
          'Complete more workouts to get personalized insights and recommendations',
        ],
      })
    );
  });
});
