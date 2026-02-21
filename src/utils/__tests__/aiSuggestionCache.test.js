import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    getExerciseCache,
    setExerciseCache,
    invalidateExerciseCache,
    invalidateMultipleExerciseCache,
    clearAllUserCache,
    clearExpiredCache,
    getCacheStats,
    invalidateCacheAfterWorkout,
} from '../aiSuggestionCache';

describe('aiSuggestionCache', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('setExerciseCache + getExerciseCache', () => {
        it('stores and retrieves a suggestion', () => {
            const suggestion = { weight: 72.5, reps: 8, reasoning: 'progressive overload' };
            setExerciseCache('user1', 'bench-press', suggestion);

            const result = getExerciseCache('user1', 'bench-press');
            expect(result).toEqual(suggestion);
        });

        it('returns null for a different user', () => {
            const suggestion = { weight: 72.5 };
            setExerciseCache('user1', 'bench-press', suggestion);

            const result = getExerciseCache('user2', 'bench-press');
            expect(result).toBeNull();
        });

        it('returns null for non-existent exercise', () => {
            const result = getExerciseCache('user1', 'nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('getExerciseCache expiry', () => {
        it('returns null for expired cache', () => {
            const suggestion = { weight: 72.5 };
            const cacheKey = 'ai_suggestion_user1_bench-press';

            // Write cache with a timestamp 2 hours ago (past the 1-hour TTL)
            const expiredData = {
                data: suggestion,
                timestamp: Date.now() - (2 * 60 * 60 * 1000),
            };
            localStorage.setItem(cacheKey, JSON.stringify(expiredData));

            const result = getExerciseCache('user1', 'bench-press');
            expect(result).toBeNull();

            // Should also have removed the expired entry
            expect(localStorage.getItem(cacheKey)).toBeNull();
        });
    });

    describe('invalidateExerciseCache', () => {
        it('removes cached suggestion', () => {
            setExerciseCache('user1', 'bench-press', { weight: 72.5 });
            expect(getExerciseCache('user1', 'bench-press')).not.toBeNull();

            invalidateExerciseCache('user1', 'bench-press');
            expect(getExerciseCache('user1', 'bench-press')).toBeNull();
        });
    });

    describe('invalidateMultipleExerciseCache', () => {
        it('removes multiple cached entries', () => {
            setExerciseCache('user1', 'bench-press', { weight: 72.5 });
            setExerciseCache('user1', 'squat', { weight: 100 });
            setExerciseCache('user1', 'deadlift', { weight: 120 });

            const count = invalidateMultipleExerciseCache('user1', ['bench-press', 'squat']);
            expect(count).toBe(2);
            expect(getExerciseCache('user1', 'bench-press')).toBeNull();
            expect(getExerciseCache('user1', 'squat')).toBeNull();
            expect(getExerciseCache('user1', 'deadlift')).not.toBeNull();
        });
    });

    describe('clearAllUserCache', () => {
        it('clears only the specified user cache', () => {
            setExerciseCache('user1', 'bench-press', { weight: 72.5 });
            setExerciseCache('user1', 'squat', { weight: 100 });
            setExerciseCache('user2', 'deadlift', { weight: 120 });

            const cleared = clearAllUserCache('user1');
            expect(cleared).toBe(2);
            expect(getExerciseCache('user1', 'bench-press')).toBeNull();
            expect(getExerciseCache('user1', 'squat')).toBeNull();
            // user2's cache should remain
            expect(getExerciseCache('user2', 'deadlift')).not.toBeNull();
        });
    });

    describe('clearExpiredCache', () => {
        it('removes only expired entries', () => {
            // Valid entry
            setExerciseCache('user1', 'bench-press', { weight: 72.5 });

            // Expired entry (2 hours old)
            const expiredKey = 'ai_suggestion_user1_old-exercise';
            localStorage.setItem(expiredKey, JSON.stringify({
                data: { weight: 50 },
                timestamp: Date.now() - (2 * 60 * 60 * 1000),
            }));

            const cleared = clearExpiredCache();
            expect(cleared).toBe(1);
            expect(getExerciseCache('user1', 'bench-press')).not.toBeNull();
            expect(localStorage.getItem(expiredKey)).toBeNull();
        });
    });

    describe('getCacheStats', () => {
        it('returns accurate statistics', () => {
            setExerciseCache('user1', 'bench-press', { weight: 72.5 });
            setExerciseCache('user1', 'squat', { weight: 100 });

            // Add an expired entry manually
            localStorage.setItem('ai_suggestion_user1_old', JSON.stringify({
                data: { weight: 50 },
                timestamp: Date.now() - (2 * 60 * 60 * 1000),
            }));

            const stats = getCacheStats('user1');
            expect(stats.totalEntries).toBe(3);
            expect(stats.validEntries).toBe(2);
            expect(stats.expiredEntries).toBe(1);
            expect(stats.cacheHitRate).toBeCloseTo(66.7, 0);
        });

        it('returns zeros for user with no cache', () => {
            const stats = getCacheStats('nobody');
            expect(stats.totalEntries).toBe(0);
            expect(stats.validEntries).toBe(0);
            expect(stats.expiredEntries).toBe(0);
            expect(stats.cacheHitRate).toBe(0);
        });
    });

    describe('invalidateCacheAfterWorkout', () => {
        it('invalidates cache for completed exercises', () => {
            setExerciseCache('user1', 'bench-press', { weight: 72.5 });
            setExerciseCache('user1', 'squat', { weight: 100 });
            setExerciseCache('user1', 'deadlift', { weight: 120 });

            const count = invalidateCacheAfterWorkout('user1', ['bench-press', 'deadlift']);
            expect(count).toBe(2);
            expect(getExerciseCache('user1', 'bench-press')).toBeNull();
            expect(getExerciseCache('user1', 'deadlift')).toBeNull();
            expect(getExerciseCache('user1', 'squat')).not.toBeNull();
        });
    });
});
