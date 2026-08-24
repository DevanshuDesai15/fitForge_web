import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../theme/theme';
import LandingPage from './LandingPage';

const {
    authState,
    navigateMock,
    registerPluginMock,
    matchMediaAddMock,
    matchMediaFactoryMock,
    matchMediaContext,
    matchMediaRevertMock,
    useGSAPMock
} = vi.hoisted(() => {
    const authState = { currentUser: null };
    const matchMediaContext = { current: null };

    const matchMediaAddMock = vi.fn((query, callback) => {
        if (typeof callback === 'function') {
            callback();
        }
    });

    const matchMediaRevertMock = vi.fn();

    const matchMediaFactoryMock = vi.fn(() => {
        matchMediaContext.current = {
            add: matchMediaAddMock,
            revert: matchMediaRevertMock
        };

        return matchMediaContext.current;
    });

    return {
        authState,
        navigateMock: vi.fn(),
        registerPluginMock: vi.fn(),
        matchMediaAddMock,
        matchMediaFactoryMock,
        matchMediaContext,
        matchMediaRevertMock,
        useGSAPMock: vi.fn((callback) => callback())
    };
});

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => authState
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => navigateMock
    };
});

vi.mock('gsap', () => ({
    gsap: {
        registerPlugin: registerPluginMock,
        timeline: vi.fn(() => ({
            from: vi.fn().mockReturnThis(),
            to: vi.fn().mockReturnThis()
        })),
        fromTo: vi.fn(),
        to: vi.fn(),
        set: vi.fn(),
        matchMedia: matchMediaFactoryMock
    }
}));

vi.mock('gsap/ScrollTrigger', () => ({
    ScrollTrigger: {}
}));

vi.mock('@gsap/react', () => ({
    useGSAP: Object.assign(useGSAPMock, { headless: true })
}));

function renderLandingPage() {
    return render(
        <ThemeProvider theme={theme}>
            <LandingPage />
        </ThemeProvider>
    );
}

describe('LandingPage premium redesign', () => {
    beforeEach(() => {
        authState.currentUser = null;
        navigateMock.mockReset();
        registerPluginMock.mockClear();
        matchMediaAddMock.mockClear();
        matchMediaFactoryMock.mockClear();
        matchMediaRevertMock.mockClear();
        matchMediaContext.current = null;
        useGSAPMock.mockClear();
    });

    it('renders the hero narrative and primary CTA', () => {
        renderLandingPage();

        expect(screen.getByTestId('landing-root')).toBeInTheDocument();
        expect(
            screen.getByRole('heading', {
                name: /transform your body with an ai coach that tracks momentum/i
            })
        ).toBeInTheDocument();
        expect(
            screen.getByText(/stop guessing\. start reading your body's progress signal/i)
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /start transforming/i })).toBeInTheDocument();
        expect(screen.getByTestId('landing-hero-visual')).toBeInTheDocument();
    });

    it('renders the transformation-story structure', () => {
        renderLandingPage();

        expect(
            screen.getByText(/from baseline confusion to visible transformation momentum/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/adaptive progression/i)).toBeInTheDocument();
        expect(screen.getByTestId('landing-transformation-panel-baseline')).toBeInTheDocument();
        expect(screen.getByTestId('landing-transformation-panel-analysis')).toBeInTheDocument();
        expect(screen.getByTestId('landing-transformation-panel-momentum')).toBeInTheDocument();
    });

    it('renders the trust and final CTA structure', () => {
        renderLandingPage();

        expect(
            screen.getByRole('heading', {
                name: /trusted by lifters building measurable momentum/i
            })
        ).toBeInTheDocument();
        expect(
            screen.getByText(/real proof from real training sessions/i)
        ).toBeInTheDocument();
        expect(screen.getByTestId('landing-session-backed-wins-card')).toBeInTheDocument();
        expect(screen.getByTestId('landing-proof-metrics-card')).toBeInTheDocument();
        expect(screen.getByTestId('landing-proof-metrics-grid')).toBeInTheDocument();
        expect(screen.getAllByTestId(/^landing-proof-metric-/)).toHaveLength(2);
        expect(screen.getByTestId('landing-proof-metric-42k-coached-workouts')).toBeInTheDocument();
        expect(screen.getByTestId('landing-proof-metric-live-progress-timelines')).toBeInTheDocument();
        expect(screen.getByText(/logged sessions feeding live momentum reads across strength, volume, and consistency/i)).toBeInTheDocument();
        expect(screen.getByText(/session history, performance context, and coach takeaways stitched into one clear signal/i)).toBeInTheDocument();
        expect(screen.getAllByTestId(/^landing-premium-capability-/)).toHaveLength(3);
        expect(screen.getByTestId('landing-premium-capability-adaptive-progression')).toBeInTheDocument();
        expect(screen.getByTestId('landing-premium-capability-recovery-aware-coaching')).toBeInTheDocument();
        expect(screen.getByTestId('landing-premium-capability-transformation-proof')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /start transforming/i })).toBeInTheDocument();
    });

    it('shows the authenticated hero CTA copy', () => {
        authState.currentUser = { id: 'user-1' };

        renderLandingPage();

        expect(screen.getAllByRole('button', { name: /open fitforge/i })).not.toHaveLength(0);
    });

    it('wires GSAP setup for reduced-motion and no-preference modes', async () => {
        vi.resetModules();
        const { default: FreshLandingPage } = await import('./LandingPage');

        render(
            <ThemeProvider theme={theme}>
                <FreshLandingPage />
            </ThemeProvider>
        );

        expect(registerPluginMock).toHaveBeenCalledTimes(1);
        expect(useGSAPMock).toHaveBeenCalledTimes(1);
        expect(matchMediaFactoryMock).toHaveBeenCalledTimes(1);
        expect(matchMediaContext.current).toEqual(
            expect.objectContaining({
                add: expect.any(Function),
                revert: expect.any(Function)
            })
        );
        const registeredQueries = matchMediaAddMock.mock.calls.map(([query]) => query);
        expect(registeredQueries).toEqual(
            expect.arrayContaining([
                '(prefers-reduced-motion: reduce)',
                '(prefers-reduced-motion: no-preference)',
                `(min-width: ${theme.breakpoints.values.md}px)`
            ])
        );
        expect(matchMediaAddMock.mock.calls.length).toBeGreaterThanOrEqual(3);
        expect(matchMediaContext.current.revert).toBe(matchMediaRevertMock);
    });
});
