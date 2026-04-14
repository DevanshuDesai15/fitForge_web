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

describe('Navigation', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useMediaQueryMock.mockReturnValue(false);
  });

  it('renders the centered logo as the mobile home action and keeps four nav items around it', () => {
    render(
      <MemoryRouter initialEntries={['/workout']}>
        <Navigation />
      </MemoryRouter>
    );

    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.getByText('Workout')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
  });

  it('navigates home when the centered logo is pressed on mobile', () => {
    render(
      <MemoryRouter initialEntries={['/progress']}>
        <Navigation />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /go to home/i }));

    expect(navigateMock).toHaveBeenCalledWith('/');
  });
});
