import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './Home';

const aiServiceMock = vi.hoisted(() => ({
    setSupabase: vi.fn(),
    analyzeWorkoutHistory: vi.fn().mockResolvedValue([]),
    calculateBatchProgressions: vi.fn().mockResolvedValue([])
}));

const dashboardStatsMock = vi.hoisted(() => ({
    value: {
        stats: undefined,
        recentAchievements: [],
        nextWorkout: null,
        isTomorrowFocus: false,
        lastRepeatableWorkout: null,
        completedWorkoutsCount: 0,
        isLoading: true,
        error: null,
        refetch: vi.fn()
    }
}));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentUser: {
            uid: 'test-user',
            email: 'member@example.com'
        }
    })
}));

vi.mock('../../hooks/useSupabase', () => ({
    useSupabase: () => ({})
}));

vi.mock('../../hooks/useProfile', () => ({
    useProfile: () => ({
        profile: null,
        isLoading: false
    })
}));

vi.mock('../../hooks/useDashboardStats', () => ({
    useDashboardStats: () => dashboardStatsMock.value
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn()
    };
});

vi.mock('../../services/progressiveOverloadAI', () => ({
    default: aiServiceMock
}));

vi.mock('../../components/workout/QuickAddExerciseModal', () => ({
    default: () => null
}));

vi.mock('./components/TodaysFocusCard', () => ({
    default: ({ mode, focusWorkout }) => (
        <div>
            <span>Today&apos;s focus</span>
            <span>{mode || 'legacy-mode'}</span>
            <span>{focusWorkout?.name || 'no-focus-workout'}</span>
        </div>
    )
}));

vi.mock('./components/WeeklyStatsGrid', () => ({
    default: () => <div>Weekly stats</div>
}));

vi.mock('./components/RecentAchievementsList', () => ({
    default: () => <div>Recent achievements</div>
}));

vi.mock('./components/QuickActionsGrid', () => ({
    default: () => <div>Quick actions</div>
}));

vi.mock('./components/WeeklyTargetsGrid', () => ({
    default: () => <div>Weekly targets grid</div>
}));

describe('Home', () => {
    beforeEach(() => {
        dashboardStatsMock.value = {
            stats: undefined,
            recentAchievements: [],
            nextWorkout: null,
            isTomorrowFocus: false,
            lastRepeatableWorkout: null,
            completedWorkoutsCount: 0,
            isLoading: true,
            error: null,
            refetch: vi.fn()
        };
        aiServiceMock.setSupabase.mockClear();
        aiServiceMock.analyzeWorkoutHistory.mockClear();
        aiServiceMock.calculateBatchProgressions.mockClear();
    });

    it('renders safely while dashboard stats are still unavailable', () => {
        render(<Home />);

        expect(screen.getByText(/member/i)).toBeInTheDocument();
        expect(screen.getByText('Weekly Targets')).toBeInTheDocument();
    });

    it('shows the welcome modal on initial render and hides it when dismissed', async () => {
        dashboardStatsMock.value = {
            stats: undefined,
            recentAchievements: [],
            nextWorkout: null,
            isTomorrowFocus: false,
            lastRepeatableWorkout: null,
            completedWorkoutsCount: 0,
            isLoading: false,
            error: null,
            refetch: vi.fn()
        };

        render(<Home />);

        expect(screen.getByText(/good/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /close welcome message/i })).toBeInTheDocument();
        expect(document.body.style.overflow).toBe('hidden');

        fireEvent.click(screen.getByRole('button', { name: /close welcome message/i }));

        expect(screen.queryByRole('button', { name: /close welcome message/i })).not.toBeInTheDocument();
        expect(document.body.style.overflow).toBe('');
    });

    it('shows the welcome modal again on a fresh render after being dismissed', async () => {
        dashboardStatsMock.value = {
            stats: undefined,
            recentAchievements: [],
            nextWorkout: null,
            isTomorrowFocus: false,
            lastRepeatableWorkout: null,
            completedWorkoutsCount: 0,
            isLoading: false,
            error: null,
            refetch: vi.fn()
        };

        const firstRender = render(<Home />);

        fireEvent.click(screen.getByRole('button', { name: /close welcome message/i }));
        firstRender.unmount();

        render(<Home />);

        expect(screen.getByRole('button', { name: /close welcome message/i })).toBeInTheDocument();
    });

    it('hides today focus for brand-new users with no program or workout history', () => {
        dashboardStatsMock.value = {
            stats: undefined,
            recentAchievements: [],
            nextWorkout: null,
            isTomorrowFocus: false,
            lastRepeatableWorkout: null,
            completedWorkoutsCount: 0,
            isLoading: false,
            error: null,
            refetch: vi.fn()
        };

        act(() => {
            render(<Home />);
        });

        expect(screen.queryByText("Today's focus")).not.toBeInTheDocument();
    });

    it('passes repeat-last mode into the focus card when the user has workout history but no program', () => {
        dashboardStatsMock.value = {
            stats: undefined,
            recentAchievements: [],
            nextWorkout: null,
            isTomorrowFocus: false,
            lastRepeatableWorkout: {
                name: 'Upper Body Repeat',
                exercises: [{ name: 'Bench Press' }]
            },
            completedWorkoutsCount: 2,
            isLoading: false,
            error: null,
            refetch: vi.fn()
        };

        act(() => {
            render(<Home />);
        });

        expect(screen.getByText('repeat-last')).toBeInTheDocument();
        expect(screen.getByText('Upper Body Repeat')).toBeInTheDocument();
    });

    it('shows AI unlock progress before the user reaches five workouts', () => {
        dashboardStatsMock.value = {
            stats: undefined,
            recentAchievements: [],
            nextWorkout: null,
            isTomorrowFocus: false,
            lastRepeatableWorkout: null,
            completedWorkoutsCount: 2,
            isLoading: false,
            error: null,
            refetch: vi.fn()
        };

        act(() => {
            render(<Home />);
        });

        expect(screen.getByText('Complete 3 more workouts to unlock AI recommendations')).toBeInTheDocument();
        expect(screen.getAllByTestId('ai-unlock-bar')).toHaveLength(5);
        expect(aiServiceMock.analyzeWorkoutHistory).not.toHaveBeenCalled();
    });
});
