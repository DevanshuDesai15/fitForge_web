import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AICoachTab from '../AICoachTab';

vi.mock('../../hooks/useAICoach', () => ({
  useAICoach: () => ({
    loading: false,
    analysis: null,
    error: null,
    getAIAnalysis: vi.fn(),
  }),
}));

describe('AICoachTab', () => {
  it('keeps the coach locked until completed sets include reps data', () => {
    render(
      <AICoachTab
        exercise={{
          name: 'Bench Press',
          targetSets: 2,
          sets: [
            { completed: true, reps: '', weight: '135' },
            { completed: true, reps: null, weight: '135' },
          ],
        }}
      />
    );

    expect(screen.getByText('AI Coach Locked')).toBeInTheDocument();
    expect(screen.queryByText('Get AI Analysis')).not.toBeInTheDocument();
  });
});
