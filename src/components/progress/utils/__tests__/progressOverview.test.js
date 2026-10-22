import { describe, expect, it } from 'vitest';
import { buildOverview } from '../progressOverview';

const NOW = new Date(2026, 7, 14, 12); // Fri Aug 14 2026; week starts Sun Aug 9
const ex = (month, day, sets = [{ weight: 100, reps: 5 }]) => ({ exerciseName: 'Bench', timestamp: new Date(2026, month, day, 9).toISOString(), sets });

describe('buildOverview', () => {
  it('computes week-to-date volume, days and change against last week', () => {
    const o = buildOverview([ex(7, 13), ex(7, 14), ex(7, 4, [{ weight: 100, reps: 2 }])], [], NOW);
    expect(o.weekDays).toBe(2);
    expect(o.weekDaysChange).toBe(1);
    expect(o.weekVolume).toBe(1000);
    expect(o.volumeChange).toBe(400);
    expect(o.activeMinutes).toBe(16);
    expect(o.weeklyChart.find((d) => d.day === 'Thu').volume).toBe(500);
  });

  it('streaks over consecutive days and tolerates an empty today', () => {
    expect(buildOverview([ex(7, 13), ex(7, 12), ex(7, 11)], [], NOW).streak).toBe(3);
    expect(buildOverview([ex(7, 14), ex(7, 12)], [], NOW).streak).toBe(1);
  });

  it('reports consistency and a weekly-goal achievement only at 5 days', () => {
    const days = [9, 10, 11, 12, 13].map((d) => ex(7, d));
    const o = buildOverview(days, [{ exerciseName: 'Bench', weight: 100 }], NOW);
    expect(o.achievements.map((a) => a.kind)).toEqual(['weekly', 'record']);
    expect(o.consistency[0].value).toBe('5 days');
    expect(o.consistency[1].value).toBe('Aug');
    expect(buildOverview([], [], NOW).consistency[1].value).toBe('—');
  });
});
