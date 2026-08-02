import { describe, expect, it } from 'vitest';
import {
  buildGoalPayload,
  createEmptyGoal,
  describeGoal,
  getPriorityStyle,
  isGoalOverdue,
  summarizeGoals,
} from '../goalPresentation';

describe('goal presentation helpers', () => {
  it('creates a new goal using the active weight unit', () => {
    expect(createEmptyGoal('lbs')).toEqual(
      expect.objectContaining({ unit: 'lbs', type: 'personal_record', priority: 'medium' })
    );
  });

  it('preserves edit progress while building a save payload', () => {
    const payload = buildGoalPayload(
      {
        title: 'Bench PR', exerciseName: 'Bench Press', targetValue: '100', unit: 'kg',
        category: 'exercise', type: 'personal_record', description: '', priority: 'high', deadline: '',
      },
      { current_value: 80, completed: false }
    );
    expect(payload).toEqual(expect.objectContaining({ currentValue: 80, targetWeight: '100' }));
  });

  it('summarizes active, completed, deadline, and almost-done goals', () => {
    const goals = [{ id: 1, completed: false, deadline: '2026-09-01' }, { id: 2, completed: true }];
    const summary = summarizeGoals(goals, [], (goal) => (goal.id === 1 ? 75 : 100));
    expect(summary).toEqual(expect.objectContaining({ completedPct: 50 }));
    expect(summary.almostDone).toHaveLength(1);
  });

  it('formats fallback descriptions and status styles', () => {
    expect(describeGoal({ targetValue: 10, unit: 'reps' }, 'kg')).toBe('10 reps target');
    expect(getPriorityStyle('high')).toEqual({ bg: 'rgba(244, 67, 54, 0.15)', text: '#f44336' });
    expect(isGoalOverdue({ deadline: '2026-01-01', completed: false }, new Date('2026-02-01'))).toBe(true);
  });
});
