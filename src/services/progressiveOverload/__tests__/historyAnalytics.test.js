import { describe, expect, it } from 'vitest';
import {
  analyzeConsistency,
  analyzeExerciseFrequency,
  analyzePersonalRecords,
  analyzeTrends,
  analyzeVolumeProgression,
  calculateConsistencyScore,
  calculateDurationTrend,
  generateHistoryBasedRecommendations,
  getEmptyWorkoutAnalysis,
} from '../historyAnalytics';

describe('progressive overload history analytics', () => {
  const history = [
    {
      date: '2026-01-01',
      timestamp: '2026-01-01T12:00:00.000Z',
      duration: 30,
      totalVolume: 100,
      exercises: [{ exerciseId: 'squat', sets: [{ weight: 50, reps: 5 }] }],
    },
    {
      date: '2026-01-03',
      timestamp: '2026-01-03T12:00:00.000Z',
      duration: 40,
      totalVolume: 200,
      exercises: [{ exerciseId: 'squat', sets: [{ weight: 60, reps: 6 }] }],
    },
  ];

  it('identifies personal records from exercise sets', () => {
    expect(analyzePersonalRecords(history)).toEqual(
      expect.objectContaining({
        totalRecords: 1,
        topPerformers: [expect.objectContaining({ exerciseId: 'squat', maxWeight: 60 })],
      })
    );
  });

  it('summarizes workout trends and consistency', () => {
    expect(analyzeTrends(history)).toEqual(
      expect.objectContaining({
        workoutFrequency: expect.objectContaining({ averageDaysBetween: 2 }),
        duration: expect.objectContaining({ average: 35 }),
      })
    );
    expect(analyzeConsistency(history)).toEqual(
      expect.objectContaining({ score: 1, rating: 'excellent', averageDaysBetween: 2 }),
    );
  });

  it('recommends more variety when history uses few exercises', () => {
    expect(generateHistoryBasedRecommendations(history)).toContain(
      'Add more exercise variety to target different muscle groups and movement patterns'
    );
  });

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
