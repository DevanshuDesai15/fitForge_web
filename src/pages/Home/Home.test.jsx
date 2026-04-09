import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Home from './Home';

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
    useDashboardStats: () => ({
        stats: undefined,
        recentAchievements: [],
        nextWorkout: null,
        isTomorrowFocus: false,
        isLoading: true,
        error: null,
        refetch: vi.fn()
    })
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
    default: () => <div>Today&apos;s focus</div>
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
    it('renders safely while dashboard stats are still unavailable', () => {
        render(<Home />);

        expect(screen.getByText('member')).toBeInTheDocument();
        expect(screen.getByText('Weekly Targets')).toBeInTheDocument();
    });
});
