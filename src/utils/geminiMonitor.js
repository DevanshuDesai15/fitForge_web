/**
 * @fileoverview Gemini API Usage Monitor
 * Utility to monitor and debug Gemini API usage patterns
 */

import geminiAIService from "../services/geminiAIService";

/**
 * Log current Gemini API usage statistics
 */
export const logGeminiStats = () => {
  const stats = geminiAIService.getUsageStats();

  console.group("📊 Gemini API Usage Stats");
  console.log("🔢 Requests this hour:", stats.requestsThisHour);
  console.log("⏳ Pending requests:", stats.pendingRequests);
  console.log("💾 Cached results:", stats.cachedResults);
  console.log("🔌 Circuit breaker:", stats.circuitBreakerStatus);
  console.log("❌ Failure count:", stats.failureCount);
  console.groupEnd();

  return stats;
};

/**
 * Monitor for excessive API usage
 */
export const monitorAPIUsage = () => {
  const stats = geminiAIService.getUsageStats();

  // Warn if approaching limits
  if (stats.requestsThisHour > 40) {
    console.warn(
      "⚠️ Approaching hourly request limit:",
      stats.requestsThisHour,
      "/50"
    );
  }

  if (stats.pendingRequests > 3) {
    console.warn("⚠️ High number of pending requests:", stats.pendingRequests);
  }

  if (stats.circuitBreakerStatus === "OPEN") {
    console.warn("🚫 Circuit breaker is OPEN - API temporarily disabled");
  }

  return stats;
};

/**
 * Set up automatic monitoring (call this once in your app)
 */
export const setupGeminiMonitoring = () => {
  // Log stats every 5 minutes in development
  if (import.meta.env?.MODE === "development") {
    setInterval(() => {
      monitorAPIUsage();
    }, 5 * 60 * 1000);

    console.log("🔍 Gemini API monitoring enabled (development mode)");
  }
};

// Auto-setup in development
if (import.meta.env?.MODE === "development") {
  setupGeminiMonitoring();
}
