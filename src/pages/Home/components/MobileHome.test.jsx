import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme/theme';
import MobileHome from './MobileHome';

const weeklyStats = {
  totalVolume: 12480,
  volumeUnit: 'kg',
  goalProgress: 75,
  goalText: '3/4',
  streakDays: 5,
  activeMinutes: 186,
  targetedMuscles: { current: 7, target: 11 },
  weeklySets: { current: 38, target: 60 },
  uniqueExercises: { current: 14, target: 20 },
};

const actions = {
  onRetry: vi.fn(),
  onQuickWorkout: vi.fn(),
  onLogActivity: vi.fn(),
  onSetGoal: vi.fn(),
};

describe('MobileHome', () => {
  it('matches the Mobile Kit AI recommendation card hierarchy', () => {
    render(
      <ThemeProvider theme={theme}>
        <MobileHome
        data={{
          displayName: 'Devanshu',
          greeting: 'Good evening',
          weeklyStats,
          achievements: [],
          completedWorkoutsCount: 5,
          workoutsUntilAiUnlock: 0,
          isAiUnlocked: true,
          aiRecommendations: [{
            exerciseId: 'bench',
            progressionType: 'weight',
            title: 'Increase Weight',
            description: 'Try increasing Bench Press from 80 kg to 82.5 kg.',
            priority: 'high',
            confidenceLevel: 0.86,
          }, {
            exerciseId: 'lat-pulldown',
            progressionType: 'reps',
            title: 'Increase Reps',
            description: 'Try increasing reps for Lat Pulldown from 10 to 12.',
            priority: 'medium',
            confidenceLevel: 0.68,
          }, {
            exerciseId: 'barbell-row',
            progressionType: 'deload',
            title: 'Deload Week',
            description: 'Consider a deload for Barbell Row. Reduce weight to 55 kg.',
            priority: 'low',
            confidenceLevel: 0.54,
          }],
        }}
        state={{ loading: false, error: null, aiLoading: false, aiError: '' }}
        actions={actions}
        />
      </ThemeProvider>,
    );

    const heading = screen.getByRole('heading', { name: 'AI Recommendations' });
    expect(heading).toBeInTheDocument();
    expect(getComputedStyle(heading.closest('.MuiCard-root')).backgroundImage).toBe('none');
    expect(screen.getByText('Increase Weight')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('86% confidence')).toBeInTheDocument();
    expect(document.querySelector('.lucide-trending-up')).toBeInTheDocument();
    expect(document.querySelectorAll('.lucide-brain')).toHaveLength(2);
    expect(document.querySelector('.lucide-clock')).toBeInTheDocument();
    expect(screen.queryByText('Your next progression')).not.toBeInTheDocument();
  });
  it('invites a day-one user to start while keeping the zeroed dashboard visible', () => {
    const onQuickWorkout = vi.fn();
    const onBrowsePrograms = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <MobileHome
          data={{
            displayName: 'Devanshu', greeting: 'Good evening', weeklyStats: { ...weeklyStats, totalVolume: 0, goalProgress: 0, streakDays: 0, activeMinutes: 0 },
            achievements: [], completedWorkoutsCount: 0, workoutsUntilAiUnlock: 5, isAiUnlocked: false, aiRecommendations: [],
          }}
          state={{ loading: false, error: null, aiLoading: false, aiError: '' }}
          actions={{ ...actions, onQuickWorkout, onBrowsePrograms }}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('Nothing logged yet.')).toBeInTheDocument();
    expect(screen.getByText('Your first session writes this number.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /start your first workout/i }));
    fireEvent.click(screen.getByRole('button', { name: /browse programs/i }));
    expect(onQuickWorkout).toHaveBeenCalledOnce();
    expect(onBrowsePrograms).toHaveBeenCalledOnce();
  });
  it('offers to resume an unfinished session and asks before discarding it', () => {
    const onResume = vi.fn();
    const onDiscardOngoing = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <MobileHome
          data={{
            displayName: 'Devanshu', greeting: 'Good evening', weeklyStats, achievements: [], completedWorkoutsCount: 5,
            workoutsUntilAiUnlock: 0, isAiUnlocked: true, aiRecommendations: [],
            ongoing: { name: 'Push Day A', sets: 4, ago: '2 hours ago' },
          }}
          state={{ loading: false, error: null, aiLoading: false, aiError: '' }}
          actions={{ ...actions, onResume, onDiscardOngoing }}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('4 sets logged · 2 hours ago')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(onResume).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onDiscardOngoing).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Keep it' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onDiscardOngoing).toHaveBeenCalledOnce();
  });
});
