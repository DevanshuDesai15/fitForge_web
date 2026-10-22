import { describe, expect, it } from 'vitest';
import { deriveNextProgramWorkout } from './nextProgramWorkout';

const templates = [
  { id: 't-push', name: 'Push Day', description: 'Chest', exercises: [{ name: 'Bench' }] },
  { id: 't-pull', name: 'Pull Day', exercises: [] },
  { id: 't-legs', name: 'Leg Day', exercises: [] },
  { id: 't-solo', name: 'Solo', exercises: [] },
];
const ppl = { id: 'p-ppl', name: 'PPL', template_ids: ['t-push', 't-pull', 't-legs'] };
const other = { id: 'p-other', name: 'Other', template_ids: ['t-solo', 't-push'] };
const session = (over) => ({ timestamp: '2026-10-20T10:00:00Z', ...over });
const next = (workouts, programs = [ppl, other]) => deriveNextProgramWorkout({ programs, templates, workouts });

describe('deriveNextProgramWorkout', () => {
  it('starts at day one of the first program when nothing has been done', () => {
    expect(next([])).toMatchObject({ name: 'Push Day', programName: 'PPL', programId: 'p-ppl', programTemplateIds: ['t-push', 't-pull', 't-legs'] });
  });

  it('suggests the day after the last one trained, and wraps at the end', () => {
    expect(next([session({ templateId: 'p-ppl', dayName: 'Push Day' })]).name).toBe('Pull Day');
    expect(next([session({ templateId: 'p-ppl', dayName: 'Leg Day' })]).name).toBe('Push Day');
  });

  it('follows the program of the most recent session, not the first program', () => {
    const workouts = [
      session({ templateId: 'p-ppl', dayName: 'Pull Day', timestamp: '2026-10-10T10:00:00Z' }),
      session({ templateId: 'p-other', dayName: 'Solo', timestamp: '2026-10-21T10:00:00Z' }),
    ];
    expect(next(workouts)).toMatchObject({ programName: 'Other', name: 'Push Day' });
  });

  it('understands sessions linked to a day template, preferring the program named on the session', () => {
    expect(next([session({ templateId: 't-pull', templateName: 'PPL', dayName: 'Pull Day' })]).name).toBe('Leg Day');
    expect(next([session({ templateId: 't-push', templateName: 'Other', dayName: 'Push Day' })])).toMatchObject({ programName: 'Other', name: 'Solo' });
  });

  it('matches old unlinked sessions by day name', () => {
    expect(next([session({ templateId: null, templateName: 'Custom Workout', dayName: 'Pull Day' })]).name).toBe('Leg Day');
  });

  it('ignores sessions that match nothing and falls back to day one', () => {
    expect(next([session({ templateId: null, dayName: 'Workout Session' })]).name).toBe('Push Day');
  });

  it('uses the newest matching session regardless of input order', () => {
    const workouts = [
      session({ templateId: 'p-ppl', dayName: 'Push Day', timestamp: '2026-10-01T10:00:00Z' }),
      session({ templateId: 'p-ppl', dayName: 'Pull Day', timestamp: '2026-10-05T10:00:00Z' }),
    ];
    expect(next(workouts).name).toBe('Leg Day');
  });

  it('returns null with no usable program, so the sheet falls back to repeat-last', () => {
    expect(next([], [])).toBeNull();
    expect(next([], [{ id: 'p', name: 'Empty', template_ids: ['missing'] }])).toBeNull();
  });
});
