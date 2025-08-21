/**
 * @fileoverview Gemini Setup Test Utility
 * Quick test to verify Gemini API configuration is working properly
 */

import geminiAIService from "../services/geminiAIService";
import geminiConfig from "../config/geminiConfig";

/**
 * Test Gemini API setup and configuration
 * @returns {Promise<Object>} Test results
 */
export const testGeminiSetup = async () => {
  console.log("🧪 Testing Gemini API Setup...\n");

  const results = {
    configTest: false,
    connectionTest: false,
    apiTest: false,
    errors: [],
  };

  try {
    // Test 1: Configuration Check
    console.log("📋 Step 1: Checking configuration...");

    if (!geminiConfig.apiKey) {
      console.log("❌ API Key: Not configured");
      results.errors.push("API key not found in environment variables");
    } else if (geminiConfig.apiKey === "YOUR_ACTUAL_API_KEY") {
      console.log("❌ API Key: Still using placeholder value");
      results.errors.push("API key is still the placeholder value");
    } else {
      console.log(
        `✅ API Key: Configured (${geminiConfig.apiKey.substring(0, 10)}...)`
      );
      results.configTest = true;
    }

    console.log(`✅ Model: ${geminiConfig.model}`);
    console.log(`✅ Use Gemini AI: ${geminiConfig.useGeminiAI}`);
    console.log(`✅ Hybrid Mode: ${geminiConfig.hybridMode}`);

    // Test 2: API Connection Test
    console.log("\n🔌 Step 2: Testing API connection...");

    try {
      const isAvailable = await geminiAIService.isApiAvailable();
      if (isAvailable) {
        console.log("✅ API Connection: Working");
        results.connectionTest = true;
      } else {
        console.log("❌ API Connection: Failed");
        results.errors.push("API connection test failed");
      }
    } catch (error) {
      console.log("❌ API Connection: Error -", error.message);
      results.errors.push(`Connection error: ${error.message}`);
    }

    // Test 3: Simple API Request Test
    console.log("\n🤖 Step 3: Testing API request...");

    if (results.configTest && results.connectionTest) {
      try {
        const testAnalysis = {
          exerciseId: "test",
          exerciseName: "Test Exercise",
          currentWeight: 50,
          currentReps: 10,
          progressionTrend: "stable",
          plateauDetected: false,
        };

        const suggestion = await geminiAIService.generateProgressionSuggestions(
          testAnalysis,
          { fitnessLevel: "intermediate" },
          []
        );

        if (suggestion && suggestion.primarySuggestion) {
          console.log("✅ API Request: Success");
          console.log(
            `   Primary suggestion: ${suggestion.primarySuggestion.exerciseName}`
          );
          results.apiTest = true;
        } else {
          console.log("❌ API Request: Invalid response");
          results.errors.push("API returned invalid response format");
        }
      } catch (error) {
        console.log("❌ API Request: Failed -", error.message);
        results.errors.push(`API request error: ${error.message}`);
      }
    } else {
      console.log("⏭️ Skipping API test (config/connection failed)");
    }

    // Final Results
    console.log("\n📊 Setup Test Results:");
    console.log(`Configuration: ${results.configTest ? "✅" : "❌"}`);
    console.log(`Connection: ${results.connectionTest ? "✅" : "❌"}`);
    console.log(`API Request: ${results.apiTest ? "✅" : "❌"}`);

    const allPassed =
      results.configTest && results.connectionTest && results.apiTest;

    if (allPassed) {
      console.log("\n🎉 All tests passed! Gemini AI is ready to go!");
    } else {
      console.log("\n❌ Some tests failed. Check the issues below:");
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });

      console.log("\n🔧 To fix issues:");
      console.log("  1. Check GEMINI_API_SETUP.md for setup instructions");
      console.log("  2. Ensure .env file has correct VITE_GEMINI_API_KEY");
      console.log("  3. Restart your dev server after making changes");
    }

    return {
      ...results,
      allPassed,
      summary: allPassed ? "Gemini AI setup complete!" : "Setup needs fixes",
    };
  } catch (error) {
    console.error("🚨 Unexpected error during setup test:", error);
    results.errors.push(`Unexpected error: ${error.message}`);
    return {
      ...results,
      allPassed: false,
      summary: "Setup test failed with unexpected error",
    };
  }
};

/**
 * Setup console test function
 */
export const setupGeminiSetupTest = () => {
  if (typeof window !== "undefined") {
    window.testGeminiSetup = testGeminiSetup;
    console.log("🔧 Gemini setup test available! Run: testGeminiSetup()");
  }
};

export default testGeminiSetup;
