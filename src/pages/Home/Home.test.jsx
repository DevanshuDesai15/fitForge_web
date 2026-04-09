import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './Home';

const dashboardStatsMock = vi.hoisted(() => ({
    value: {
        stats: undefined,
        recentAchievements: [],
        nextWorkout: null,
        isTomorrowFocus: false,
        lastRepeatableWorkout: null,
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
    default: {
        setSupabase: vi.fn(),
        analyzeWorkoutHistory: vi.fn().mockResolvedValue([]),
        calculateBatchProgressions: vi.fn().mockResolvedValue([])
    }
}));

vi.mock('../../components/workout/QuickAddExerciseModal', () => ({
    default: () => null
}));

vi.mock('./components/WelcomeHeader', () => ({
    default: ({ displayName, streakDays }) => (
        <div>
            <span>{displayName}</span>
            <span>{streakDays}</span>
        </div>
    )
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
            isLoading: true,
            error: null,
            refetch: vi.fn()
        };
    });

    it('renders safely while dashboard stats are still unavailable', () => {
        render(<Home />);

        expect(screen.getByText('member')).toBeInTheDocument();
        expect(screen.getByText('Weekly Targets')).toBeInTheDocument();
    });

    it('hides today focus for brand-new users with no program or workout history', async () => {
        dashboardStatsMock.value = {
            stats: undefined,
            recentAchievements: [],
            nextWorkout: null,
            isTomorrowFocus: false,
            lastRepeatableWorkout: null,
            isLoading: false,
            error: null,
            refetch: vi.fn()
        };

        render(<Home />);

        await waitFor(() => {
            expect(screen.queryByText("Today's focus")).not.toBeInTheDocument();
        });
    });

    it('passes repeat-last mode into the focus card when the user has workout history but no program', async () => {
        dashboardStatsMock.value = {
            stats: undefined,
            recentAchievements: [],
            nextWorkout: null,
            isTomorrowFocus: false,
            lastRepeatableWorkout: {
                name: 'Upper Body Repeat',
                exercises: [{ name: 'Bench Press' }]
            },
            isLoading: false,
            error: null,
            refetch: vi.fn()
        };

        render(<Home />);

        await waitFor(() => {
            expect(screen.getByText('repeat-last')).toBeInTheDocument();
            expect(screen.getByText('Upper Body Repeat')).toBeInTheDocument();
        });
    });
});
