import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock MergedData.json with minimal test data
vi.mock('../../../MergedData.json', () => ({
    default: {
        metadata: { total_records: 3 },
        products: [
            {
                id: '001',
                title: 'Bench Press',
                slug: 'bench-press',
                description: 'Classic chest exercise',
                steps: ['Lie on bench', 'Press up'],
                muscle_groups: ['Chest', 'Triceps'],
                equipment: ['Barbell'],
                exercise_types: ['Strength'],
                difficulty: 'Intermediate',
                video_urls: { '720p': 'https://example.com/bp720.mp4' },
                url: 'https://example.com/bench-press',
            },
            {
                id: '002',
                title: 'Squat',
                slug: 'squat',
                description: 'Compound lower body exercise',
                steps: ['Stand', 'Squat down'],
                muscle_groups: ['Quadriceps', 'Glutes'],
                equipment: ['Barbell'],
                exercise_types: ['Strength'],
                difficulty: 'Intermediate',
                video_urls: null,
                url: 'https://example.com/squat',
            },
            {
                id: '003',
                title: 'Kettlebell Swing',
                slug: 'kettlebell-swing',
                description: 'Full body explosive exercise',
                steps: ['Hinge', 'Swing'],
                muscle_groups: ['Glutes', 'Hamstrings'],
                equipment: ['Kettlebell'],
                exercise_types: ['Cardio', 'Strength'],
                difficulty: 'Beginner',
                video_urls: { '720p': 'https://example.com/kb720.mp4', '480p': 'https://example.com/kb480.mp4' },
                url: 'https://example.com/kettlebell-swing',
            },
        ],
    },
}));

// Must import AFTER the mock is defined
const {
    fetchAllExercises,
    fetchExercisesByName,
    fetchExercisesByBodyPart,
    getExerciseCount,
    fetchExerciseById,
} = await import('../localExerciseService');

describe('localExerciseService', () => {
    describe('fetchAllExercises', () => {
        it('returns all exercises', async () => {
            const exercises = await fetchAllExercises();
            expect(exercises).toHaveLength(3);
        });

        it('maps exercise fields correctly', async () => {
            const exercises = await fetchAllExercises();
            const bench = exercises.find(e => e.id === '001');

            expect(bench).toBeDefined();
            expect(bench.name).toBe('Bench Press');
            expect(bench.title).toBe('Bench Press');
            expect(bench.bodyPart).toBe('Chest');
            expect(bench.equipment).toBe('Barbell');
            expect(bench.difficulty).toBe('Intermediate');
            expect(bench.type).toBe('local');
        });
    });

    describe('fetchExercisesByName', () => {
        it('finds exercises by name', async () => {
            const results = await fetchExercisesByName('bench');
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Bench Press');
        });

        it('finds exercises by muscle group', async () => {
            const results = await fetchExercisesByName('glutes');
            expect(results).toHaveLength(2); // Squat + Kettlebell Swing
        });

        it('returns empty for no match', async () => {
            const results = await fetchExercisesByName('nonexistent-exercise');
            expect(results).toHaveLength(0);
        });

        it('is case insensitive', async () => {
            const results = await fetchExercisesByName('SQUAT');
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Squat');
        });
    });

    describe('fetchExercisesByBodyPart', () => {
        it('filters by body part', async () => {
            const results = await fetchExercisesByBodyPart('Chest');
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Bench Press');
        });

        it('returns empty for unknown body part', async () => {
            const results = await fetchExercisesByBodyPart('Wings');
            expect(results).toHaveLength(0);
        });
    });

    describe('getExerciseCount', () => {
        it('returns the total count', async () => {
            const count = await getExerciseCount();
            expect(count).toBe(3);
        });
    });

    describe('fetchExerciseById', () => {
        it('finds exercise by ID', async () => {
            const exercise = await fetchExerciseById('002');
            expect(exercise.name).toBe('Squat');
        });

        it('throws for non-existent ID', async () => {
            await expect(fetchExerciseById('999')).rejects.toThrow('Exercise with id 999 not found');
        });
    });
});
