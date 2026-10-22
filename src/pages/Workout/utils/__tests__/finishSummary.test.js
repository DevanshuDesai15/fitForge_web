import { describe, expect, it } from 'vitest';
import { buildFinishSummary, programContinuity } from '../finishSummary';

const NOW = new Date('2026-10-22T18:00:00'); // a Thursday
const lift = (name, sets) => ({ name, exercise_type: 'strength', sets: sets.map(([weight, reps]) => ({ weight: String(weight), reps: String(reps), weightUnit: 'kg', completed: true })) });
const prior = (when, exercises) => ({ timestamp: when, exercises, weightUnit: 'kg' });

describe('buildFinishSummary', () => {
  const exercises = [lift('Bench Press', [[80, 10], [82.5, 8]]), lift('Row', [[60, 10]])];

  it('totals volume, sets and exercises', () => {
    const s = buildFinishSummary({ exercises, weightUnit: 'kg', durationSeconds: 3100, name: 'Push', weeklyGoal: 4, now: NOW });
    expect(s.volume).toBe(80 * 10 + 82.5 * 8 + 600);
    expect(s.sets).toBe(3);
    expect(s.exercises).toBe(2);
    expect(s.minutes).toBe(52);
  });

  it('flags a lift that beat its earlier best, with the gain', () => {
    const priorWorkouts = [prior('2026-10-15T10:00:00', [lift('Bench Press', [[80, 10]])])];
    const s = buildFinishSummary({ exercises, priorWorkouts, weightUnit: 'kg', name: 'Push', weeklyGoal: 4, now: NOW });
    expect(s.records).toEqual([{ exercise: 'Bench Press', note: 'Heaviest weight yet', detail: '82.5kg × 8', delta: '+2.5kg' }]);
  });

  it('does not call a first-ever lift a record, or an equal weight', () => {
    expect(buildFinishSummary({ exercises, weightUnit: 'kg', name: 'Push', weeklyGoal: 4, now: NOW }).records).toEqual([]);
    const priorWorkouts = [prior('2026-10-15T10:00:00', [lift('Bench Press', [[82.5, 5]])])];
    expect(buildFinishSummary({ exercises, priorWorkouts, weightUnit: 'kg', name: 'Push', weeklyGoal: 4, now: NOW }).records).toEqual([]);
  });

  it('counts distinct training days this week including today, not older ones', () => {
    const priorWorkouts = [
      prior('2026-10-19T10:00:00', []), prior('2026-10-19T17:00:00', []), // same day twice
      prior('2026-10-21T10:00:00', []),
      prior('2026-10-10T10:00:00', []), // last week
    ];
    const s = buildFinishSummary({ exercises, priorWorkouts, weightUnit: 'kg', name: 'Push', weeklyGoal: 4, now: NOW });
    expect(s.weekDone).toBe(3);
    expect(s.weekTarget).toBe(4);
  });
});

describe('programContinuity', () => {
  const templates = [{ id: 'a', name: 'Push' }, { id: 'b', name: 'Pull' }, { id: 'c', name: 'Legs' }];
  const program = { name: 'PPL', template_ids: ['a', 'b', 'c'] };

  it('names the day after the one just finished, wrapping at the end', () => {
    expect(programContinuity(program, { id: 'a' }, templates)).toEqual({ name: 'PPL', dayIndex: 1, dayCount: 3, nextDay: 'Pull' });
    expect(programContinuity(program, { id: 'c' }, templates).nextDay).toBe('Push');
  });

  it('returns null for a single template or an unknown day', () => {
    expect(programContinuity({ name: 'x', template_ids: ['a'] }, { id: 'a' }, templates)).toBeNull();
    expect(programContinuity(program, { id: 'zzz' }, templates)).toBeNull();
    expect(programContinuity(null, { id: 'a' }, templates)).toBeNull();
  });
});
