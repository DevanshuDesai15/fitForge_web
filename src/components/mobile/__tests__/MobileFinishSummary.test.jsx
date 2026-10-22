import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme/theme';
import MobileFinishSummary from '../MobileFinishSummary';

const base = { name: 'Push', minutes: 52, volume: 12480, sets: 18, exercises: 5, records: [], weekDone: 3, weekTarget: 4, program: null };
const setup = (summary = {}) => {
  const onDone = vi.fn();
  const onHistory = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <MobileFinishSummary summary={{ ...base, ...summary }} weightUnit="kg" onDone={onDone} onHistory={onHistory} />
    </ThemeProvider>,
  );
  return { onDone, onHistory };
};

describe('MobileFinishSummary', () => {
  it('headlines the volume and routes the two buttons', () => {
    const { onDone, onHistory } = setup();
    expect(screen.getByText('Session logged.')).toBeInTheDocument();
    expect(screen.getByText('Push · 52 min on the clock')).toBeInTheDocument();
    expect(screen.getByText('12,480')).toBeInTheDocument();
    expect(screen.getByText('1 more to hit your target.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    fireEvent.click(screen.getByRole('button', { name: /see it in history/i }));
    expect(onDone).toHaveBeenCalledOnce();
    expect(onHistory).toHaveBeenCalledOnce();
  });

  it('shows records and the next program day only when there are some', () => {
    setup({ weekDone: 4, records: [{ exercise: 'Bench Press', note: 'Heaviest weight yet', detail: '82.5kg × 8', delta: '+2.5kg' }], program: { name: 'PPL', dayIndex: 1, dayCount: 3, nextDay: 'Pull' } });
    expect(screen.getByText('1 personal record')).toBeInTheDocument();
    expect(screen.getByText('+2.5kg')).toBeInTheDocument();
    expect(screen.getByText('Weekly target hit. Anything else this week is a bonus.')).toBeInTheDocument();
    expect(screen.getByText('Next up: Pull')).toBeInTheDocument();
  });

  it('leaves out the records and program blocks on a plain session', () => {
    setup();
    expect(screen.queryByText(/personal record/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/next up/i)).not.toBeInTheDocument();
  });
});
