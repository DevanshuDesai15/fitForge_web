import { describe, expect, it } from 'vitest';
import {
  getDashboardWeekKey,
  isWorkoutInDashboardWeek,
} from '../useDashboardStats';

describe('dashboard weekly date handling', () => {
  it('starts a new calendar week on Sunday', () => {
    const now = new Date('2026-08-02T12:00:00-05:00'); // Sunday

    expect(isWorkoutInDashboardWeek({ timestamp: '2026-08-02T08:00:00-05:00' }, now)).toBe(true);
    expect(isWorkoutInDashboardWeek({ timestamp: '2026-08-01T20:00:00-05:00' }, now)).toBe(false);
  });

  it('includes completed workouts that only have completedAt or createdAt', () => {
    const now = new Date('2026-08-05T12:00:00-05:00');

    expect(isWorkoutInDashboardWeek({ completedAt: '2026-08-04T08:00:00-05:00' }, now)).toBe(true);
    expect(isWorkoutInDashboardWeek({ createdAt: '2026-08-05T08:00:00-05:00' }, now)).toBe(true);
  });

  it('changes the dashboard cache key when a new week begins', () => {
    expect(getDashboardWeekKey(new Date('2026-08-01T20:00:00-05:00')))
      .not.toBe(getDashboardWeekKey(new Date('2026-08-02T08:00:00-05:00')));
  });
});
