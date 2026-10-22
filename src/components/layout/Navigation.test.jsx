import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Navigation from './Navigation';

const navigateMock = vi.fn();
const useMediaQueryMock = vi.fn();

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: (...args) => useMediaQueryMock(...args),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('./StartWorkoutSheet', () => ({ default: () => <div role="dialog" aria-label="Start a workout" /> }));

describe('Navigation', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useMediaQueryMock.mockReturnValue(false);
  });

  it('renders four primary destinations around a centered start workout action', () => {
    render(
      <MemoryRouter initialEntries={['/workout']}>
        <Navigation />
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Workout')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start workout/i })).toBeInTheDocument();
  });

  it('opens the start sheet instead of jumping into a session when the centered action is pressed', () => {
    render(
      <MemoryRouter initialEntries={['/progress']}>
        <Navigation />
      </MemoryRouter>
    );

    expect(screen.queryByRole('dialog', { name: /start a workout/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /start workout/i }));

    expect(screen.getByRole('dialog', { name: /start a workout/i })).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
