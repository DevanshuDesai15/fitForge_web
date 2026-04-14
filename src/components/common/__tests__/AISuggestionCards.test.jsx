import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import AISuggestionCards from '../AISuggestionCards';

const aiServiceMocks = vi.hoisted(() => ({
    analyzeWorkoutHistory: vi.fn().mockResolvedValue([]),
    generateWorkoutSuggestions: vi.fn().mockResolvedValue([]),
    detectPlateaus: vi.fn().mockResolvedValue([]),
    trackSuggestionInteraction: vi.fn().mockResolvedValue(),
}));

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
        analyzeWorkoutHistory: aiServiceMocks.analyzeWorkoutHistory,
        generateWorkoutSuggestions: aiServiceMocks.generateWorkoutSuggestions,
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
        detectPlateaus: aiServiceMocks.detectPlateaus,
        trackSuggestionInteraction: aiServiceMocks.trackSuggestionInteraction
    }
}));

vi.mock('../../../utils/aiSuggestionCache', () => ({
    getExerciseCache: vi.fn().mockReturnValue(null),
    setExerciseCache: vi.fn(),
    invalidateExerciseCache: vi.fn(),
    clearExpiredCache: vi.fn(),
}));

describe('AISuggestionCards', () => {
    beforeEach(() => {
        aiServiceMocks.analyzeWorkoutHistory.mockClear();
        aiServiceMocks.generateWorkoutSuggestions.mockClear();
        aiServiceMocks.detectPlateaus.mockClear();
        aiServiceMocks.trackSuggestionInteraction.mockClear();
    });

    it('reloads suggestions when the workout context changes', async () => {
        vi.useFakeTimers();

        const { rerender } = render(
            <AISuggestionCards
                userId="test-user-id"
                workoutContext="home"
                onSuggestionAccept={vi.fn()}
                onSuggestionDismiss={vi.fn()}
            />
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1500);
        });

        expect(aiServiceMocks.analyzeWorkoutHistory).toHaveBeenCalledTimes(1);
        expect(aiServiceMocks.generateWorkoutSuggestions).not.toHaveBeenCalled();

        rerender(
            <AISuggestionCards
                userId="test-user-id"
                workoutContext="start-workout"
                onSuggestionAccept={vi.fn()}
                onSuggestionDismiss={vi.fn()}
            />
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1500);
        });

        expect(aiServiceMocks.generateWorkoutSuggestions).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });

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
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1500);
        });

        vi.useRealTimers();

        // Wait for loading to complete and check for empty state
        await screen.findByText('No AI suggestions available');
        expect(screen.getByText('Complete more workouts to get personalized recommendations')).toBeInTheDocument();
    });
});
