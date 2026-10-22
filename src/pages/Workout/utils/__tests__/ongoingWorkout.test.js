import { describe, expect, it } from 'vitest';
import { formatAgo, readOngoingWorkout } from '../ongoingWorkout';

const NOW = 1_000_000_000_000;
const storeWith = (state) => ({ getItem: () => (state === undefined ? null : JSON.stringify(state)) });
const saved = (over = {}) => ({
  userId: 'u1', workoutStarted: true, timestamp: NOW - 120000, selectedDay: { name: 'Push Day A' },
  exercises: [{ sets: [{ completed: true }, { completed: true }, { completed: false }] }, { sets: [{ completed: true }] }],
  ...over,
});

describe('readOngoingWorkout', () => {
  it('summarises a live session for the current user', () => {
    expect(readOngoingWorkout('u1', NOW, storeWith(saved()))).toEqual({ name: 'Push Day A', sets: 3, savedAt: NOW - 120000 });
  });

  it.each([
    ['another user', saved({ userId: 'u2' })],
    ['not started', saved({ workoutStarted: false })],
    ['no exercises', saved({ exercises: [] })],
    ['older than two hours', saved({ timestamp: NOW - 3 * 3600000 })],
  ])('ignores a session that is %s', (_, state) => {
    expect(readOngoingWorkout('u1', NOW, storeWith(state))).toBeNull();
  });

  it('returns null with nothing stored, no user, or corrupt data', () => {
    expect(readOngoingWorkout('u1', NOW, storeWith(undefined))).toBeNull();
    expect(readOngoingWorkout(undefined, NOW, storeWith(saved()))).toBeNull();
    expect(readOngoingWorkout('u1', NOW, { getItem: () => '{nope' })).toBeNull();
  });
});

describe('formatAgo', () => {
  it('reads naturally', () => {
    expect(formatAgo(NOW - 20000, NOW)).toBe('just now');
    expect(formatAgo(NOW - 60000, NOW)).toBe('1 minute ago');
    expect(formatAgo(NOW - 2 * 3600000, NOW)).toBe('2 hours ago');
  });
});
