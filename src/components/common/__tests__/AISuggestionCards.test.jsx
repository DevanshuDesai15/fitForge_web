import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AISuggestionCards from '../AISuggestionCards';

// Mock the context hooks at the module level
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentUser: { uid: 'test-user-id' }
    })
}));

vi.mock('../../../contexts/UnitsContext', () => ({
    useUnits: () => ({
        weightUnit: 'kg',
        unitPreference: 'metric',
        convertWeight: vi.fn((w) => w),
        formatWeight: vi.fn((w, u) => `${w} ${u}`),
        getWeightLabel: vi.fn(() => 'Weight (kg)'),
    })
}));

vi.mock('../../../services/progressiveOverloadAI', () => ({
    default: {
        analyzeWorkoutHistory: vi.fn().mockResolvedValue([]),
        calculateNextProgression: vi.fn().mockResolvedValue({
            exerciseId: 'bench-press',
            exerciseName: 'Bench Press',
            currentWeight: 70,
            suggestedWeight: 72.5,
            suggestedReps: 8,
            suggestedSets: 3,
            progressionType: 'weight',
            reasoning: 'Progressive overload: increase weight by 2.5kg',
            confidenceLevel: 0.85,
            alternativeOptions: []
        }),
        detectPlateaus: vi.fn().mockResolvedValue([]),
        trackSuggestionInteraction: vi.fn().mockResolvedValue()
    }
}));

vi.mock('../../../utils/aiSuggestionCache', () => ({
    getExerciseCache: vi.fn().mockReturnValue(null),
    setExerciseCache: vi.fn(),
    invalidateExerciseCache: vi.fn(),
    clearExpiredCache: vi.fn(),
}));

describe('AISuggestionCards', () => {
    it('renders loading state initially', () => {
        render(
            <AISuggestionCards
                userId="test-user-id"
                workoutContext="home"
                onSuggestionAccept={vi.fn()}
                onSuggestionDismiss={vi.fn()}
            />
        );

        // Should show loading skeletons (Skeleton components render as spans)
        const skeletons = document.querySelectorAll('.MuiSkeleton-root');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders empty state when no suggestions available', async () => {
        vi.useFakeTimers();

        render(
            <AISuggestionCards
                userId="test-user-id"
                workoutContext="home"
                onSuggestionAccept={vi.fn()}
                onSuggestionDismiss={vi.fn()}
            />
        );

        // Advance past the 1-second debounce
        await vi.advanceTimersByTimeAsync(1500);

        vi.useRealTimers();

        // Wait for loading to complete and check for empty state
        await screen.findByText('No AI suggestions available');
        expect(screen.getByText('Complete more workouts to get personalized recommendations')).toBeInTheDocument();
    });
});