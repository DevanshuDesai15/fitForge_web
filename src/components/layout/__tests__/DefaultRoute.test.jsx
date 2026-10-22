import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DefaultRoute from '../DefaultRoute';

const mocks = vi.hoisted(() => ({ auth: {}, profile: {}, desktop: false, installed: false }));

vi.mock('@mui/material', async (orig) => ({ ...(await orig()), useMediaQuery: () => mocks.desktop, useTheme: () => ({ breakpoints: { up: () => '' } }) }));
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('../../../hooks/useProfile', () => ({ useProfile: () => mocks.profile }));
vi.mock('../../../utils/installedApp', () => ({ isInstalledApp: () => mocks.installed }));
vi.mock('../Layout', () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock('../../../pages/Home/Home', () => ({ default: () => <div>home screen</div> }));
vi.mock('../../../pages/Landing/LandingPage', () => ({ default: () => <div>landing page</div> }));
vi.mock('../../../pages/Auth/mobile/MobileAuth', () => ({ default: ({ start }) => <div>mobile auth: {start}</div> }));

const hoursAgo = (h) => new Date(Date.now() - h * 3600000);
const renderRoute = () => render(
  <MemoryRouter initialEntries={['/']}>
    <Routes>
      <Route path="/" element={<DefaultRoute />} />
      <Route path="/setup" element={<div>setup wizard</div>} />
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  mocks.desktop = false;
  mocks.installed = false;
  mocks.auth = { currentUser: { uid: 'u1', createdAt: hoursAgo(1) }, loading: false };
  mocks.profile = { profile: { preferences: {} }, isLoading: false };
});

describe('DefaultRoute', () => {
  it('sends a brand-new phone account to the setup wizard', async () => {
    renderRoute();
    expect(await screen.findByText('setup wizard')).toBeInTheDocument();
  });

  it('goes straight to Home once setup was done or skipped', async () => {
    mocks.profile = { profile: { preferences: { onboarding: { completed: true } } }, isLoading: false };
    renderRoute();
    expect(await screen.findByText('home screen')).toBeInTheDocument();
  });

  it('never interrupts an existing account, or a desktop visitor', async () => {
    mocks.auth = { currentUser: { uid: 'u1', createdAt: hoursAgo(72) }, loading: false };
    const view = renderRoute();
    expect(await screen.findByText('home screen')).toBeInTheDocument();
    view.unmount();

    mocks.desktop = true;
    mocks.auth = { currentUser: { uid: 'u1', createdAt: hoursAgo(1) }, loading: false };
    renderRoute();
    expect(await screen.findByText('home screen')).toBeInTheDocument();
  });

  it('shows the landing page to signed-out visitors in a browser, phone or desktop', async () => {
    mocks.auth = { currentUser: null, loading: false };
    const view = renderRoute();
    expect(await screen.findByText('landing page')).toBeInTheDocument();
    view.unmount();

    mocks.desktop = true;
    renderRoute();
    expect(await screen.findByText('landing page')).toBeInTheDocument();
  });

  it('opens the installed phone app on the welcome carousel', async () => {
    mocks.auth = { currentUser: null, loading: false };
    mocks.installed = true;
    renderRoute();
    expect(await screen.findByText('mobile auth: welcome')).toBeInTheDocument();
  });
});
