import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FitForgeSwitch from '../FitForgeSwitch';

describe('FitForgeSwitch', () => {
  it('renders as a checkbox and emits the next checked state', () => {
    const onChange = vi.fn();

    render(
      <FitForgeSwitch
        checked={false}
        onChange={onChange}
        inputProps={{ 'aria-label': 'profile toggle' }}
      />
    );

    const toggle = screen.getByRole('checkbox', { name: 'profile toggle' });
    expect(toggle).not.toBeChecked();

    fireEvent.click(toggle);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][1]).toBe(true);
  });
});
