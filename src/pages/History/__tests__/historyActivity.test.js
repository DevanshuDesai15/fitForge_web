import { describe, expect, it } from 'vitest';
import { buildActivity, formatDuration, getExerciseStats, getWorkoutVolume, summarizeExercise } from '../historyActivity';

const NOW = new Date(2026, 7, 14, 12); // Fri Aug 14 2026
const at = (month, day) => new Date(2026, month, day, 9).toISOString();
const bench = (timestamp, extra = {}) => ({
  id: timestamp,
  timestamp,
  weight_unit: 'kg',
  durationSeconds: 2892,
  exercises: [{ name: 'Bench Press', sets: [{ reps: 10, weight: 80 }, { reps: 8, weight: 82.5, completed: false }] }],
  ...extra,
});

describe('historyActivity', () => {
  it('formats durations like the kit', () => {
    expect(formatDuration(2892)).toBe('48:12');
    expect(formatDuration(3725)).toBe('1:02:05');
  });

  it('counts only completed sets and converts to the display unit', () => {
    expect(getWorkoutVolume(bench(at(7, 14)), 'kg')).toBe(800);
    expect(Math.round(getWorkoutVolume(bench(at(7, 14)), 'lbs'))).toBe(1764);
  });

  it('places today at the last real cell and marks workout days', () => {
    const a = buildActivity([bench(at(7, 14)), bench(at(7, 12))], 'kg', NOW);
    expect(a.values.length % 7).toBe(0);
    expect(a.values[a.todayIndex]).toBe(1);
    expect(a.values.filter((v) => v > 0)).toHaveLength(2);
    expect(a.days[a.todayIndex].exercises).toBe(1);
    expect(a.days[a.todayIndex].volume).toBe('800 kg');
    expect(a.months[0]).toEqual({ label: 'Jan', weekIndex: 0 });
  });

  it('counts week streaks and does not break on an empty current week', () => {
    // weeks of Aug 2 and Jul 26 trained; this week (Aug 9) not yet
    const a = buildActivity([bench(at(7, 4)), bench(at(6, 28))], 'kg', NOW);
    expect(a.currentStreak).toBe(2);
    expect(a.longestStreak).toBe(2);
    expect(buildActivity([bench(at(7, 4)), bench(at(5, 1))], 'kg', NOW).longestStreak).toBe(1);
  });

  it('summarises exercises and totals', () => {
    const w = bench(at(7, 14));
    const stats = getExerciseStats([w, w], 'kg');
    expect(stats).toMatchObject({ totalExercises: 2, uniqueExercises: 1, totalReps: 20, totalWeight: 1600 });
    expect(summarizeExercise({ sets: w.exercises[0].sets, setCount: 2, weightUnit: 'kg' }, 'kg')).toBe('2 sets × 10 reps × 80kg');
  });
});
