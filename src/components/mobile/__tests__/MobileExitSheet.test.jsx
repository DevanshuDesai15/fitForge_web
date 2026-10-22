import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme/theme';
import MobileExitSheet from '../MobileExitSheet';

const setup = (props = {}) => {
  const handlers = { onClose: vi.fn(), onFinish: vi.fn(), onIncomplete: vi.fn(), onDiscard: vi.fn() };
  render(
    <ThemeProvider theme={theme}>
      <MobileExitSheet open setsLogged={4} {...handlers} {...props} />
    </ThemeProvider>,
  );
  return handlers;
};

describe('MobileExitSheet', () => {
  it('offers finish and save-as-incomplete straight away', () => {
    const h = setup();
    expect(screen.getByText('You have 4 sets logged.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /finish now/i }));
    fireEvent.click(screen.getByRole('button', { name: /save as incomplete/i }));
    expect(h.onFinish).toHaveBeenCalledOnce();
    expect(h.onIncomplete).toHaveBeenCalledOnce();
    expect(h.onDiscard).not.toHaveBeenCalled();
  });

  it('only discards after a second confirmation, and can back out', () => {
    const h = setup({ setsLogged: 1 });
    fireEvent.click(screen.getByRole('button', { name: /^discard/i }));
    expect(h.onDiscard).not.toHaveBeenCalled();
    expect(screen.getByText('Discard this session?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /keep it/i }));
    expect(screen.getByText('Leave this workout?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^discard/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard 1 set' }));
    expect(h.onDiscard).toHaveBeenCalledOnce();
  });
});
