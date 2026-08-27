import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './Home';

const aiServiceMock = vi.hoisted(() => ({
    setSupabase: vi.fn(),
    analyzeWorkoutHistory: vi.fn().mockResolvedValue([]),
    calculateBatchProgressions: vi.fn().mockResolvedValue([])
}));

const navigateMock = vi.hoisted(() => vi.fn());
const profileMock = vi.hoisted(() => ({
    value: { profile: null, isLoading: false }
}));
const useMediaQueryMock = vi.hoisted(() => vi.fn());

vi.mock('@mui/material', async () => {
    const actual = await vi.importActual('@mui/material');
    return {
        ...actual,
        useMediaQuery: (...args) => useMediaQueryMock(...args),
    };
});

const dashboardStatsMock = vi.hoisted(() => ({
    value: {
        data: {
            weeklyStats: undefined,
            recentAchievements: [],
            nextWorkout: null,
            isTomorrowFocus: false,
            lastRepeatableWorkout: null,
            completedWorkoutsCount: 0,
        },
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
    useProfile: () => profileMock.value
}));

vi.mock('../../hooks/useDashboardStats', () => ({
    useDashboardStats: () => dashboardStatsMock.value
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => navigateMock
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

describe('Home', () => {
    beforeEach(() => {
        dashboardStatsMock.value = {
            data: {
                weeklyStats: undefined,
                recentAchievements: [],
                nextWorkout: null,
                isTomorrowFocus: false,
                lastRepeatableWorkout: null,
                completedWorkoutsCount: 0,
            },
            isLoading: true,
            error: null,
            refetch: vi.fn()
        };
        aiServiceMock.setSupabase.mockClear();
        aiServiceMock.analyzeWorkoutHistory.mockClear();
        aiServiceMock.calculateBatchProgressions.mockClear();
        navigateMock.mockReset();
        profileMock.value = { profile: null, isLoading: false };
        useMediaQueryMock.mockReturnValue(false);
    });

    it('renders safely while dashboard stats are still unavailable', () => {
        render(<Home />);

        expect(screen.getAllByText(/member/i).length).toBeGreaterThan(0);
        expect(screen.getByText('Weekly Targets')).toBeInTheDocument();
    });

    it('does not interrupt the Home screen with a daily check-in modal', () => {
        dashboardStatsMock.value = {
            data: {
                weeklyStats: undefined,
                recentAchievements: [],
                nextWorkout: null,
                isTomorrowFocus: false,
                lastRepeatableWorkout: null,
                completedWorkoutsCount: 0,
            },
            isLoading: false,
            error: null,
            refetch: vi.fn()
        };

        render(<Home />);

        expect(screen.queryByRole('button', { name: /close welcome message/i })).not.toBeInTheDocument();
        expect(document.body.style.overflow).toBe('');
        expect(screen.getAllByText(/good/i).length).toBeGreaterThan(0);
    });

    it('hides today focus for brand-new users with no program or workout history', () => {
        dashboardStatsMock.value = {
            data: {
                weeklyStats: undefined,
                recentAchievements: [],
                nextWorkout: null,
                isTomorrowFocus: false,
                lastRepeatableWorkout: null,
                completedWorkoutsCount: 0,
            },
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
        useMediaQueryMock.mockReturnValue(true);
        dashboardStatsMock.value = {
            data: {
                weeklyStats: undefined,
                recentAchievements: [],
                nextWorkout: null,
                isTomorrowFocus: false,
                lastRepeatableWorkout: {
                    name: 'Upper Body Repeat',
                    exercises: [{ name: 'Bench Press' }]
                },
                completedWorkoutsCount: 2,
            },
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
            data: {
                weeklyStats: undefined,
                recentAchievements: [],
                nextWorkout: null,
                isTomorrowFocus: false,
                lastRepeatableWorkout: null,
                completedWorkoutsCount: 2,
            },
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

    it('renders the Mobile Kit hierarchy and opens Profile from the top-right avatar', () => {
        profileMock.value = {
            profile: { display_name: 'Devanshu' },
            isLoading: false,
        };
        dashboardStatsMock.value = {
            data: {
                weeklyStats: {
                    totalVolume: 12480,
                    volumeUnit: 'kg',
                    goalProgress: 75,
                    goalText: '3/4',
                    streakDays: 5,
                    workoutsDone: 3,
                    activeMinutes: 186,
                    targetedMuscles: { current: 7, target: 11 },
                    weeklySets: { current: 38, target: 60 },
                    uniqueExercises: { current: 14, target: 20 },
                },
                recentAchievements: [{
                    id: 'pr-1',
                    title: 'New Bench Press PR',
                    description: '82.5 kg for 8 reps',
                    timeAgo: '2d ago',
                    icon: 'target',
                    variant: 'primary',
                }],
                nextWorkout: null,
                isTomorrowFocus: false,
                lastRepeatableWorkout: null,
                completedWorkoutsCount: 4,
            },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        };

        render(<Home />);
        expect(screen.getByRole('heading', { name: 'Weekly Targets' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'This Week' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Recent Achievements' })).toBeInTheDocument();
        expect(screen.getByText('12,480')).toBeInTheDocument();
        expect(screen.getByText('New Bench Press PR')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /open profile/i }));
        expect(navigateMock).toHaveBeenCalledWith('/profile');
    });

    it('keeps the target structure visible for a brand-new mobile user', () => {
        dashboardStatsMock.value = {
            data: {
                weeklyStats: undefined,
                recentAchievements: [],
                nextWorkout: null,
                isTomorrowFocus: false,
                lastRepeatableWorkout: null,
                completedWorkoutsCount: 0,
            },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        };

        render(<Home />);
        expect(screen.getByText('Muscles')).toBeInTheDocument();
        expect(screen.getByText('Sets')).toBeInTheDocument();
        expect(screen.getByText('Exercises')).toBeInTheDocument();
        expect(screen.getByText(/complete workouts to unlock achievements/i)).toBeInTheDocument();
    });
});
