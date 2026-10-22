import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme/theme';
import MobileProfile from '../MobileProfile';

const makeActions = () => ({
  onEdit: vi.fn(), onPreferenceChange: vi.fn(), onNotificationChange: vi.fn(),
  onExportData: vi.fn(), onClearCache: vi.fn(), onSignOut: vi.fn(),
});

const renderProfile = (actions = makeActions(), state = {}, userData = {}) => {
  render(
    <ThemeProvider theme={theme}>
      <MobileProfile
        data={{
          userData: { fullName: 'Devanshu Desai', email: 'dev@example.com', createdAt: '2026-03-10T00:00:00Z', bio: '', ...userData },
          stats: { totalWorkouts: 128, currentStreak: 5, thisWeek: 3, caloriesBurned: 44800 },
          preferences: { units: 'metric', keepScreenAwake: true, restTimerAlerts: false, weeklyGoal: 4 },
          notifications: { workoutReminders: true, progressUpdates: false },
        }}
        state={state}
        actions={actions}
      />
    </ThemeProvider>
  );
  return actions;
};

describe('MobileProfile', () => {
  it('profile tab: identity card and hero stat from real counts', () => {
    const actions = renderProfile();
    expect(screen.getByText('Devanshu Desai')).toBeInTheDocument();
    expect(screen.getByText('DD')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('Workouts logged since Mar 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(actions.onEdit).toHaveBeenCalled();
  });

  it('does not invent profile details that were never entered', () => {
    renderProfile();
    expect(screen.queryByText('Height')).not.toBeInTheDocument();
    expect(screen.queryByText('Fitness goal')).not.toBeInTheDocument();
  });

  it('preferences: exactly the four kit settings, each saving its own key', () => {
    const actions = renderProfile();
    fireEvent.click(screen.getByRole('tab', { name: /preferences/i }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(screen.queryByText('Auto-sync')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Metric units' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Keep screen awake' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Rest timer alerts' })).not.toBeChecked();
    expect(screen.getByLabelText('Weekly workout goal')).toHaveValue('4');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Metric units' }));
    expect(actions.onPreferenceChange).toHaveBeenCalledWith('units', 'imperial');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Keep screen awake' }));
    expect(actions.onPreferenceChange).toHaveBeenCalledWith('keepScreenAwake', false);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Rest timer alerts' }));
    expect(actions.onPreferenceChange).toHaveBeenCalledWith('restTimerAlerts', true);
    fireEvent.change(screen.getByLabelText('Weekly workout goal'), { target: { value: '5' } });
    expect(actions.onPreferenceChange).toHaveBeenCalledWith('weeklyGoal', 5);
  });

  it('account: signs out only after confirming; delete is disabled', () => {
    const actions = renderProfile();
    fireEvent.click(screen.getByRole('tab', { name: /account/i }));
    expect(screen.getByText('dev@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Export data' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear cache' }));
    expect(actions.onExportData).toHaveBeenCalled();
    expect(actions.onClearCache).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(actions.onSignOut).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sign out' }));
    expect(actions.onSignOut).toHaveBeenCalled();
  });

  it('shows error and success messages', () => {
    renderProfile(makeActions(), { error: 'Failed to load profile data', success: 'Saved' });
    expect(screen.getByText('Failed to load profile data')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });
});
