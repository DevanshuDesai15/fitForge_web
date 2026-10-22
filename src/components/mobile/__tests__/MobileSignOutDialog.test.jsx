import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme/theme';
import MobileSignOutDialog from '../MobileSignOutDialog';

const setup = (props = {}) => {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <MobileSignOutDialog open onCancel={onCancel} onConfirm={onConfirm} {...props} />
    </ThemeProvider>,
  );
  return { onCancel, onConfirm };
};

describe('MobileSignOutDialog', () => {
  it('says what survives and offers stay / close / sign out', () => {
    const { onCancel, onConfirm } = setup();
    expect(screen.getByRole('heading', { name: 'Sign out?' })).toBeInTheDocument();
    expect(screen.getByText(/every logged set is already saved/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Stay signed in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('shows no warning when nothing is unfinished', () => {
    setup();
    expect(screen.queryByText(/unfinished session/i)).not.toBeInTheDocument();
  });

  it('shows the in-progress warning for an unfinished session', () => {
    setup({ hasUnfinishedSession: true });
    expect(screen.getByRole('alert')).toHaveTextContent('You have an unfinished session from today. It stays in progress until you finish it.');
  });
});
