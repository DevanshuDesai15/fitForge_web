import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AIUnlockProgress from './AIUnlockProgress';

describe('AIUnlockProgress', () => {
  it('renders five bars and fills completed workouts', () => {
    render(<AIUnlockProgress completedWorkouts={2} totalWorkouts={5} />);

    const bars = screen.getAllByTestId('ai-unlock-bar');
    expect(bars).toHaveLength(5);
    expect(bars[0]).toHaveAttribute('data-filled', 'true');
    expect(bars[1]).toHaveAttribute('data-filled', 'true');
    expect(bars[2]).toHaveAttribute('data-filled', 'false');
    expect(bars[3]).toHaveAttribute('data-filled', 'false');
    expect(bars[4]).toHaveAttribute('data-filled', 'false');
  });
});
