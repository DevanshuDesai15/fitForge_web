import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme/theme';
import MobileProfileButton, { ProfileButtonProvider, useHideProfileButton } from '../MobileProfileButton';

vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ currentUser: { email: 'dev@example.com' } }) }));
vi.mock('../../../hooks/useProfile', () => ({ useProfile: () => ({ profile: { display_name: 'Devanshu' } }) }));

const Where = () => <output aria-label="where">{useLocation().pathname}</output>;
const PushedScreen = () => { useHideProfileButton(); return <div>pushed</div>; };

const renderAt = (path, extra = null) => render(
  <ThemeProvider theme={theme}>
    <MemoryRouter initialEntries={[path]}>
      <ProfileButtonProvider>
        <MobileProfileButton />
        {extra}
        <Routes><Route path="*" element={<Where />} /></Routes>
      </ProfileButtonProvider>
    </MemoryRouter>
  </ThemeProvider>
);

describe('MobileProfileButton', () => {
  it.each(['/', '/workout', '/history', '/progress'])('shows on %s and opens the profile', (path) => {
    renderAt(path);
    fireEvent.click(screen.getByRole('button', { name: 'Open profile' }));
    expect(screen.getByLabelText('where')).toHaveTextContent('/profile');
  });

  it('shows the initial of the profile name', () => {
    renderAt('/');
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it.each(['/profile', '/workout/start'])('is hidden on %s', (path) => {
    renderAt(path);
    expect(screen.queryByRole('button', { name: 'Open profile' })).not.toBeInTheDocument();
  });

  it('steps aside while a pushed screen is mounted', () => {
    renderAt('/workout', <PushedScreen />);
    expect(screen.queryByRole('button', { name: 'Open profile' })).not.toBeInTheDocument();
  });
});
