/**
 * @fileoverview Gemini API Status Checker
 * Quick utility to check and display Gemini API status
 */

import geminiAIService from "../services/geminiAIService";

/**
 * Check current Gemini API status
 */
export const checkGeminiStatus = () => {
  const stats = geminiAIService.getUsageStats();

  console.group("🔍 Gemini API Status Check");

  // Check if globally disabled
  if (geminiAIService.config.emergencyDisable) {
    console.log("🚨 STATUS: GLOBALLY DISABLED (Emergency kill switch active)");
  } else if (!geminiAIService.config.useGeminiAI) {
    console.log("🚫 STATUS: DISABLED (useGeminiAI = false)");
  } else if (stats.emergencyBrakeActive) {
    console.log("🚨 STATUS: EMERGENCY BRAKE ACTIVE");
    console.log(
      `📊 Daily requests: ${stats.dailyRequestCount}/${stats.dailyLimit}`
    );
  } else if (stats.circuitBreakerStatus === "OPEN") {
    console.log("🔌 STATUS: CIRCUIT BREAKER OPEN");
    console.log(`❌ Failures: ${stats.failureCount}`);
  } else {
    console.log("✅ STATUS: ACTIVE");
    console.log(`📊 Requests this hour: ${stats.requestsThisHour}`);
    console.log(
      `📊 Daily requests: ${stats.dailyRequestCount}/${stats.dailyLimit}`
    );
  }

  console.log("📈 Pending requests:", stats.pendingRequests);
  console.log("💾 Cached results:", stats.cachedResults);
  console.groupEnd();

  return stats;
};

/**
 * Get simple status string
 */
export const getGeminiStatusString = () => {
  const stats = geminiAIService.getUsageStats();

  if (geminiAIService.config.emergencyDisable) {
    return "GLOBALLY DISABLED";
  } else if (!geminiAIService.config.useGeminiAI) {
    return "DISABLED";
  } else if (stats.emergencyBrakeActive) {
    return "EMERGENCY BRAKE";
  } else if (stats.circuitBreakerStatus === "OPEN") {
    return "CIRCUIT BREAKER OPEN";
  } else {
    return "ACTIVE";
  }
};

/**
 * Display status in console (for debugging)
 */
export const logGeminiStatus = () => {
  const status = getGeminiStatusString();
  const stats = geminiAIService.getUsageStats();

  console.log(
    `🤖 Gemini API: ${status} | Requests: ${stats.dailyRequestCount}/${stats.dailyLimit} today`
  );

  return { status, stats };
};

// Auto-log status in development
if (import.meta.env?.MODE === "development") {
  setTimeout(() => {
    logGeminiStatus();
  }, 2000);
}
