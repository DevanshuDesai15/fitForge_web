import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TodaysFocusCard from './TodaysFocusCard';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('TodaysFocusCard', () => {
  it('starts a copied version of the last workout in repeat-last mode', async () => {
    render(
      <TodaysFocusCard
        mode="repeat-last"
        focusWorkout={{
          name: 'Upper Body',
          day_name: 'Upper Body',
          exercises: [
            {
              name: 'Bench Press',
              sets: [{ weight: '100', reps: '8', completed: true }],
            },
          ],
        }}
        isTomorrowFocus={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /start workout/i }));

    expect(navigateMock).toHaveBeenCalledWith(
      '/workout/start',
      expect.objectContaining({
        state: expect.objectContaining({
          workout: expect.objectContaining({
            name: 'Upper Body',
            dayName: 'Upper Body',
            exercises: [expect.objectContaining({ name: 'Bench Press' })],
          }),
        }),
      })
    );
  });
});
