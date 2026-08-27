import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import MobileBottomNav from '../MobileBottomNav';

function LocationDisplay() {
  const location = useLocation();
  return <output aria-label="Current location">{location.pathname}</output>;
}

function renderNavigation(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="*"
          element={(
            <>
              <MobileBottomNav />
              <LocationDisplay />
            </>
          )}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MobileBottomNav', () => {
  it('exposes the Mobile Kit destinations and marks the current page', () => {
    renderNavigation('/');

    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /workout/i })).toHaveAttribute('href', '/workout');
    expect(screen.getByRole('link', { name: /history/i })).toHaveAttribute('href', '/history');
    expect(screen.getByRole('link', { name: /progress/i })).toHaveAttribute('href', '/progress');
    expect(screen.queryByRole('link', { name: /profile/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start workout/i }).querySelector('img')).toBeInTheDocument();
  });

  it('starts a workout from the centered primary action', async () => {
    renderNavigation('/progress');

    fireEvent.click(screen.getByRole('button', { name: /start workout/i }));

    expect(screen.getByLabelText(/current location/i)).toHaveTextContent('/workout/start');
  });
});
