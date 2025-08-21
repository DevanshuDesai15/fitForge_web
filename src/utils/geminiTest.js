/**
 * @fileoverview Gemini API Test Utility
 * Simple utility to test Gemini API connection and troubleshoot issues
 */

import geminiAIService from "../services/geminiAIService";
import geminiConfig from "../config/geminiConfig";

/**
 * Test Gemini API connection and configuration
 * @returns {Promise<Object>} Test results
 */
export const testGeminiConnection = async () => {
  console.log("🚀 Testing Gemini AI Connection...");

  const results = {
    configLoaded: false,
    apiKeySet: false,
    apiAvailable: false,
    testResponse: null,
    error: null,
  };

  try {
    // Test 1: Configuration loaded
    console.log("📋 Testing configuration...");
    results.configLoaded = !!geminiConfig;
    console.log("✅ Configuration loaded:", results.configLoaded);

    // Test 2: API key set
    console.log("🔑 Testing API key...");
    results.apiKeySet =
      geminiConfig.apiKey &&
      geminiConfig.apiKey !== "your-gemini-api-key-here" &&
      geminiConfig.apiKey.length > 10;
    console.log("✅ API key configured:", results.apiKeySet);
    console.log(
      "🔍 API key preview:",
      geminiConfig.apiKey?.substring(0, 15) + "..."
    );

    if (!results.apiKeySet) {
      throw new Error(
        "API key not properly configured. Please set VITE_GEMINI_API_KEY in your .env file"
      );
    }

    // Test 3: API availability
    console.log("🌐 Testing API connection...");
    results.apiAvailable = await geminiAIService.isApiAvailable();
    console.log("✅ API available:", results.apiAvailable);

    // Test 4: Simple request
    if (results.apiAvailable) {
      console.log("💬 Testing simple request...");
      try {
        const testAnalysis = {
          exerciseId: "bench-press",
          exerciseName: "Bench Press",
          currentWeight: 80,
          totalSessions: 5,
          progressionTrend: "improving",
          confidenceLevel: 0.8,
        };

        const testProfile = {
          experienceLevel: "intermediate",
          age: 25,
          trainingFrequency: 3,
        };

        const testWorkoutHistory = [];

        results.testResponse =
          await geminiAIService.generateProgressionSuggestions(
            testAnalysis,
            testProfile,
            testWorkoutHistory
          );

        console.log("✅ Test request successful:", results.testResponse);
      } catch (requestError) {
        console.warn(
          "⚠️ Test request failed (but API is available):",
          requestError
        );
        results.error = requestError.message;
      }
    }
  } catch (error) {
    console.error("❌ Gemini test failed:", error);
    results.error = error.message;
  }

  // Summary
  console.log("\n📊 Gemini AI Test Summary:");
  console.log("- Configuration loaded:", results.configLoaded ? "✅" : "❌");
  console.log("- API key set:", results.apiKeySet ? "✅" : "❌");
  console.log("- API available:", results.apiAvailable ? "✅" : "❌");
  console.log(
    "- Test request:",
    results.testResponse ? "✅" : results.error ? "❌" : "➖"
  );

  if (results.error) {
    console.log("- Error:", results.error);
  }

  if (results.apiAvailable) {
    console.log(
      "\n🎉 Gemini AI is working! Your fitness suggestions will be AI-enhanced."
    );
  } else {
    console.log(
      "\n⚠️ Gemini AI not working. Using rule-based fallback system."
    );
    console.log("👉 Check your VITE_GEMINI_API_KEY environment variable.");
    console.log(
      "👉 Get your API key from: https://aistudio.google.com/app/apikey"
    );
  }

  return results;
};

/**
 * Quick test function that can be called from browser console
 * Usage: window.testGemini()
 */
export const setupGeminiConsoleTest = () => {
  if (typeof window !== "undefined") {
    window.testGemini = testGeminiConnection;
    console.log("🔧 Gemini test function available! Run: testGemini()");
  }
};

export default testGeminiConnection;
