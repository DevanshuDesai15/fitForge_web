import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme/theme';
import MobileHistory from '../MobileHistory';
import MobileSessionDetail from '../MobileSessionDetail';

const today = new Date();
const workout = {
  id: 'w1',
  timestamp: today.toISOString(),
  weight_unit: 'kg',
  durationSeconds: 2892,
  exercises: [
    { name: 'Bench Press', notes: 'Slower eccentric', sets: [{ reps: 10, weight: 80 }, { reps: 9, weight: 80 }] },
    { name: 'Push-ups', sets: [{ reps: 20, weightType: 'bodyweight' }] },
  ],
};

const renderHistory = (data, state = {}, actions = {}) => render(
  <ThemeProvider theme={theme}>
    <MobileHistory
      data={{ workouts: [], weightUnit: 'kg', ...data }}
      state={state}
      actions={{ onOpenSession: vi.fn(), onStartWorkout: vi.fn(), onRetry: vi.fn(), ...actions }}
    />
  </ThemeProvider>
);

describe('MobileHistory', () => {
  it('shows the day-one empty state with a zeroed heat map', () => {
    const onStartWorkout = vi.fn();
    renderHistory({}, {}, { onStartWorkout });
    expect(screen.getByText('Nothing to look back on yet.')).toBeInTheDocument();
    expect(screen.getByText('No sessions yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start a workout' }));
    expect(onStartWorkout).toHaveBeenCalled();
  });

  it('shows failure with retry', () => {
    const onRetry = vi.fn();
    renderHistory({}, { error: new Error('boom') }, { onRetry });
    expect(screen.getByText('boom')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('calendar: streak strip, and tapping today reveals the session', () => {
    renderHistory({ workouts: [workout] });
    expect(screen.getByText('Week streak')).toBeInTheDocument();
    expect(screen.getByText('Tap a day to see that session')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /1 workout$/ }));
    expect(screen.getByText('48:12')).toBeInTheDocument();
    expect(screen.getByText('1,520 kg')).toBeInTheDocument();
  });

  it('past: lists sets and opens the session', () => {
    const onOpenSession = vi.fn();
    renderHistory({ workouts: [workout] }, {}, { onOpenSession });
    fireEvent.click(screen.getByRole('tab', { name: /past/i }));
    expect(screen.getByText('Set 1: 10 reps @ 80kg')).toBeInTheDocument();
    expect(screen.getByText('Set 1: 20 reps (Bodyweight)')).toBeInTheDocument();
    expect(screen.getByText('Note: Slower eccentric')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^View / }));
    expect(onOpenSession).toHaveBeenCalledWith('w1');
  });

  it('exercises: hero stat and per-exercise summary', () => {
    renderHistory({ workouts: [workout] });
    fireEvent.click(screen.getByRole('tab', { name: /exercises/i }));
    expect(screen.getByText('Exercises logged, all time')).toBeInTheDocument();
    expect(screen.getByText('2 sets × 10 reps × 80kg')).toBeInTheDocument();
  });
});

describe('MobileSessionDetail', () => {
  const renderDetail = (props = {}) => {
    const handlers = { onBack: vi.fn(), onSave: vi.fn().mockResolvedValue({ fallenRecord: null }), onDelete: vi.fn().mockResolvedValue(), ...props };
    render(
      <ThemeProvider theme={theme}>
        <MobileSessionDetail workout={workout} weightUnit="kg" {...handlers} />
      </ThemeProvider>
    );
    return handlers;
  };

  it('shows volume in the subtitle and goes back', () => {
    const { onBack } = renderDetail();
    expect(screen.getByText('48:12 · 3 sets · 1,520 kg')).toBeInTheDocument();
    expect(screen.getByText('Bodyweight')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('edits one set in place and saves the new exercises', async () => {
    const { onSave } = renderDetail();
    fireEvent.click(screen.getByRole('button', { name: 'Edit set 1 of Bench Press' }));
    fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '85' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save set' }));
    expect(await screen.findByText('Set updated. Volume and records recalculated.')).toBeInTheDocument();
    expect(onSave.mock.calls[0][0][0].sets[0]).toMatchObject({ weight: 85, reps: 10, weightUnit: 'kg' });
  });

  it('names the record that fell', async () => {
    renderDetail({ onSave: vi.fn().mockResolvedValue({ fallenRecord: { exercise: 'Bench Press', from: 100, to: 90 } }) });
    fireEvent.click(screen.getByRole('button', { name: 'Edit set 1 of Bench Press' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save set' }));
    expect(await screen.findByText(/100 kg personal record from this session no longer stands/)).toBeInTheDocument();
  });

  it('keeps the editor open and shows the error when saving fails', async () => {
    renderDetail({ onSave: vi.fn().mockRejectedValue(new Error('offline')) });
    fireEvent.click(screen.getByRole('button', { name: 'Edit set 1 of Bench Press' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save set' }));
    expect(await screen.findByText('Could not save: offline')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save set' })).toBeInTheDocument();
  });

  it('rejects an invalid rep count without saving', () => {
    const { onSave } = renderDetail();
    fireEvent.click(screen.getByRole('button', { name: 'Edit set 1 of Bench Press' }));
    fireEvent.change(screen.getByLabelText('Reps'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save set' }));
    expect(screen.getByText('Enter a valid weight and rep count.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('deletes the session only after confirming', async () => {
    const confirm = vi.spyOn(window, 'confirm');
    const { onDelete, onBack } = renderDetail();
    confirm.mockReturnValueOnce(false);
    fireEvent.click(screen.getByRole('button', { name: 'Delete session' }));
    expect(onDelete).not.toHaveBeenCalled();
    confirm.mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole('button', { name: 'Delete session' }));
    await waitFor(() => expect(onBack).toHaveBeenCalled());
    expect(onDelete).toHaveBeenCalled();
    confirm.mockRestore();
  });
});
