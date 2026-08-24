import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WeeklyTargetsGrid from './WeeklyTargetsGrid';

const useMediaQueryMock = vi.fn();

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: (...args) => useMediaQueryMock(...args),
  };
});

describe('WeeklyTargetsGrid', () => {
  it('uses the horizontal mobile layout on smaller screens', () => {
    useMediaQueryMock.mockReturnValue(true);

    render(
      <WeeklyTargetsGrid
        weeklyStats={{
          targetedMuscles: { current: 0, target: 11 },
          weeklySets: { current: 0, target: 60 },
          uniqueExercises: { current: 0, target: 20 },
        }}
      />
    );

    expect(screen.getByTestId('weekly-targets-layout')).toHaveAttribute('data-layout', 'horizontal-mobile');
    expect(screen.getByText('Muscles')).toBeInTheDocument();
    expect(screen.getByText('Sets')).toBeInTheDocument();
    expect(screen.getByText('Exercises')).toBeInTheDocument();
  });
});
