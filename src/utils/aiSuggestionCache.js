/**
 * @fileoverview AI Suggestion Cache Utilities
 * Persistent caching system for AI workout suggestions to prevent redundant API calls
 */

const EXERCISE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour per exercise
const CACHE_KEY_PREFIX = "ai_suggestion_";

/**
 * Get cached suggestion for a specific exercise
 * @param {string} userId - User identifier
 * @param {string} exerciseId - Exercise identifier
 * @returns {Object|null} Cached suggestion or null if not found/expired
 */
export const getExerciseCache = (userId, exerciseId) => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}_${exerciseId}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    if (now - timestamp > EXERCISE_CACHE_DURATION) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    console.log(`✅ Using cached suggestion for ${exerciseId}`);
    return data;
  } catch (error) {
    console.warn("Cache read error:", error);
    return null;
  }
};

/**
 * Cache suggestion for a specific exercise
 * @param {string} userId - User identifier
 * @param {string} exerciseId - Exercise identifier
 * @param {Object} suggestion - Suggestion data to cache
 */
export const setExerciseCache = (userId, exerciseId, suggestion) => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}_${exerciseId}`;
    const cacheData = {
      data: suggestion,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`💾 Cached suggestion for ${exerciseId}`);
  } catch (error) {
    console.warn("Cache write error:", error);
  }
};

/**
 * Invalidate cache for a specific exercise
 * @param {string} userId - User identifier
 * @param {string} exerciseId - Exercise identifier
 */
export const invalidateExerciseCache = (userId, exerciseId) => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}_${exerciseId}`;
    localStorage.removeItem(cacheKey);
    console.log(`🗑️ Invalidated cache for ${exerciseId}`);
  } catch (error) {
    console.warn("Cache invalidation error:", error);
  }
};

/**
 * Invalidate cache for multiple exercises
 * @param {string} userId - User identifier
 * @param {Array<string>} exerciseIds - Array of exercise identifiers
 */
export const invalidateMultipleExerciseCache = (userId, exerciseIds) => {
  let invalidated = 0;
  exerciseIds.forEach((exerciseId) => {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${userId}_${exerciseId}`;
      if (localStorage.getItem(cacheKey)) {
        localStorage.removeItem(cacheKey);
        invalidated++;
      }
    } catch (error) {
      console.warn(`Cache invalidation error for ${exerciseId}:`, error);
    }
  });
  console.log(`🗑️ Invalidated cache for ${invalidated} exercises`);
  return invalidated;
};

/**
 * Clear all AI suggestion cache for a user
 * @param {string} userId - User identifier
 * @returns {number} Number of cache entries cleared
 */
export const clearAllUserCache = (userId) => {
  try {
    const keys = Object.keys(localStorage);
    let cleared = 0;

    keys.forEach((key) => {
      if (key.startsWith(`${CACHE_KEY_PREFIX}${userId}_`)) {
        localStorage.removeItem(key);
        cleared++;
      }
    });

    console.log(
      `🧹 Cleared all AI suggestion cache for user: ${cleared} items`
    );
    return cleared;
  } catch (error) {
    console.warn("Full cache clear error:", error);
    return 0;
  }
};

/**
 * Clear expired cache entries for all users
 * @returns {number} Number of expired entries cleared
 */
export const clearExpiredCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    let cleared = 0;

    keys.forEach((key) => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            if (now - timestamp > EXERCISE_CACHE_DURATION) {
              localStorage.removeItem(key);
              cleared++;
            }
          }
        } catch (error) {
          // Invalid cache entry, remove it
          localStorage.removeItem(key);
          cleared++;
        }
      }
    });

    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} expired cache entries`);
    }
    return cleared;
  } catch (error) {
    console.warn("Cache cleanup error:", error);
    return 0;
  }
};

/**
 * Get cache statistics for a user
 * @param {string} userId - User identifier
 * @returns {Object} Cache statistics
 */
export const getCacheStats = (userId) => {
  try {
    const keys = Object.keys(localStorage);
    let totalEntries = 0;
    let validEntries = 0;
    let expiredEntries = 0;
    const now = Date.now();

    keys.forEach((key) => {
      if (key.startsWith(`${CACHE_KEY_PREFIX}${userId}_`)) {
        totalEntries++;
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            if (now - timestamp > EXERCISE_CACHE_DURATION) {
              expiredEntries++;
            } else {
              validEntries++;
            }
          }
        } catch (error) {
          expiredEntries++;
        }
      }
    });

    return {
      totalEntries,
      validEntries,
      expiredEntries,
      cacheHitRate: totalEntries > 0 ? (validEntries / totalEntries) * 100 : 0,
    };
  } catch (error) {
    console.warn("Cache stats error:", error);
    return {
      totalEntries: 0,
      validEntries: 0,
      expiredEntries: 0,
      cacheHitRate: 0,
    };
  }
};

/**
 * Utility to call after workout completion to invalidate relevant caches
 * @param {string} userId - User identifier
 * @param {Array<string>} completedExerciseIds - Exercise IDs that were completed in workout
 */
export const invalidateCacheAfterWorkout = (userId, completedExerciseIds) => {
  console.log(
    `🏋️ Workout completed! Invalidating cache for ${completedExerciseIds.length} exercises`
  );
  return invalidateMultipleExerciseCache(userId, completedExerciseIds);
};

// Auto-cleanup expired cache on module load
if (typeof window !== "undefined") {
  clearExpiredCache();
}
