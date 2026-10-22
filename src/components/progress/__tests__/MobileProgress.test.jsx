import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme/theme';
import MobileProgress from '../MobileProgress';

vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));
vi.mock('../components/GoalsSection', () => ({ default: () => <div>goals section</div> }));
vi.mock('../components/AchievementsSection', () => ({ default: () => <div>achievements section</div> }));
vi.mock('../components/PerformanceCharts', () => ({ default: () => <div>charts section</div> }));
vi.mock('../components/PlateauAlerts', () => ({ default: () => <div>plateaus section</div> }));

const today = new Date();
const exercises = [{ exerciseName: 'Bench Press', timestamp: today.toISOString(), sets: [{ weight: 100, reps: 5 }] }];
const analyses = [
  { exerciseId: 'a', exerciseName: 'Bench Press', progressionTrend: 'improving', progressionRate: 1.5, confidenceLevel: 0.9, currentWeight: 100, totalSessions: 6, lastProgressDate: today.toISOString() },
  { exerciseId: 'b', exerciseName: 'Squat', progressionTrend: 'declining', progressionRate: -0.5, confidenceLevel: 0.5, currentWeight: 120, totalSessions: 4, lastProgressDate: today.toISOString() },
];

const renderProgress = (overrides = {}, state = {}) => render(
  <ThemeProvider theme={theme}>
    <MobileProgress
      data={{
        exercises, personalRecords: [{ exerciseName: 'Bench Press', weight: 100 }], weightUnit: 'kg', goals: [], availableExercises: [],
        progressionAnalyses: analyses, plateauAlerts: [{ id: 'p1', exerciseName: 'Squat', severity: 'moderate' }],
        appliedInterventions: {}, dismissedAlerts: new Set(), progressData: {}, selectedExercise: '', timeRange: '3months', showOnlyRecent: false,
        ...overrides,
      }}
      state={state}
      actions={{ onRetry: vi.fn(), onGoalsUpdate: vi.fn(), setError: vi.fn(), onInterventionApply: vi.fn(), onAlertDismiss: vi.fn(), setSelectedExercise: vi.fn(), setTimeRange: vi.fn() }}
    />
  </ThemeProvider>
);
const open = (name) => fireEvent.click(screen.getByRole('tab', { name }));

describe('MobileProgress', () => {
  it('overview: hero volume, achievements and consistency', () => {
    renderProgress();
    expect(screen.getByText('Volume lifted, week to date')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('New Bench Press record: 100kg')).toBeInTheDocument();
    expect(screen.getByText('Longest streak this year')).toBeInTheDocument();
  });

  it('shows loading and failure with retry', () => {
    const view = renderProgress({}, { loading: true });
    expect(screen.getByLabelText('Loading your progress')).toBeInTheDocument();
    view.unmount();
    renderProgress({}, { error: 'boom' });
    expect(screen.getByText('boom')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('goals and achievements reuse the existing sections', () => {
    renderProgress();
    open('Goals');
    expect(screen.getByText('goals section')).toBeInTheDocument();
    open('Achievements');
    expect(screen.getByText('achievements section')).toBeInTheDocument();
  });

  it('AI dashboard: insights, computed overview figures and reused plateaus/charts', () => {
    renderProgress();
    open('AI Dashboard');
    expect(screen.getByText('+1.5kg/week')).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('tablist', { name: 'AI dashboard sections' })).getByRole('tab', { name: /Overview/ }));
    expect(screen.getByText('50%')).toBeInTheDocument(); // 1 of 2 improving
    expect(screen.getByText('70%')).toBeInTheDocument(); // (0.9 + 0.5) / 2
    fireEvent.click(screen.getByRole('tab', { name: /Plateaus/ }));
    expect(screen.getByText('plateaus section')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Charts/ }));
    expect(screen.getByText('charts section')).toBeInTheDocument();
  });

  it('AI dashboard: statistics use real figures, not the web version\'s fixed samples', () => {
    renderProgress();
    open('AI Dashboard');
    fireEvent.click(screen.getByRole('tab', { name: /Statistics/ }));
    expect(screen.getByText('Heaviest lift on record · Bench Press')).toBeInTheDocument();
    expect(screen.queryByText('78%')).not.toBeInTheDocument();
  });

  it('AI dashboard: no analyses shows an empty state', () => {
    renderProgress({ progressionAnalyses: [], plateauAlerts: [], personalRecords: [] });
    open('AI Dashboard');
    expect(screen.getByText('No insights yet')).toBeInTheDocument();
  });
});
