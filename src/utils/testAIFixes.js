/**
 * @fileoverview Test AI System Fixes
 * Utility to test the fixes for workout-history retrieval and AI JSON parsing.
 */

import huggingFaceService from "../services/huggingFaceService";
import progressiveOverloadAI from "../services/progressiveOverloadAI";

/**
 * Test the AI system fixes
 * @returns {Promise<Object>} Test results
 */
export const testAIFixes = async () => {
  console.log("🧪 Testing AI System Fixes...");

  const results = {
    workoutHistoryTest: false,
    aiJsonParsingTest: false,
    aiSuggestionsTest: false,
    errors: [],
  };

  try {
    // Test 1: Workout History Retrieval (should fix limit2 error)
    console.log("📚 Testing workout history retrieval...");
    const testUserId = "test-user-123";

    // This should not throw a "limit2 is not a function" error
    const workoutHistory = await progressiveOverloadAI._getRecentWorkoutHistory(
      testUserId,
      3
    );
    results.workoutHistoryTest = Array.isArray(workoutHistory);
    console.log("✅ Workout history test passed:", results.workoutHistoryTest);
  } catch (error) {
    console.error("❌ Workout history test failed:", error);
    results.errors.push(`Workout history: ${error.message}`);
  }

  try {
    // Test 2: AI JSON parsing
    console.log("🧠 Testing AI JSON parsing...");

    // Test the JSON extraction method directly
    const testResponseWithCodeBlocks = `
Here's the analysis:

\`\`\`json
{
  "primarySuggestion": {
    "exerciseId": "test-exercise",
    "exerciseName": "Test Exercise", 
    "suggestion": "Test suggestion",
    "reasoning": "Test reasoning",
    "confidence": 0.8
  },
  "alternatives": [],
  "personalizedTips": ["Test tip"]
}
\`\`\`

Hope this helps!`;

    const parsed = huggingFaceService._extractJsonFromResponse(
      testResponseWithCodeBlocks
    );
    results.aiJsonParsingTest =
      parsed &&
      parsed.primarySuggestion &&
      parsed.primarySuggestion.exerciseId === "test-exercise";
    console.log("✅ AI JSON parsing test passed:", results.aiJsonParsingTest);
  } catch (error) {
    console.error("❌ AI JSON parsing test failed:", error);
    results.errors.push(`AI JSON parsing: ${error.message}`);
  }

  try {
    // Test 3: Full AI Suggestions Flow
    console.log("🎯 Testing full AI suggestions flow...");

    // This tests the complete flow that was causing errors
    const analyses = await progressiveOverloadAI.analyzeWorkoutHistory(
      "test-user-123"
    );
    results.aiSuggestionsTest = Array.isArray(analyses);
    console.log("✅ AI suggestions test passed:", results.aiSuggestionsTest);
  } catch (error) {
    console.error("❌ AI suggestions test failed:", error);
    results.errors.push(`AI suggestions: ${error.message}`);
  }

  // Summary
  console.log("\n📊 AI Fixes Test Summary:");
  console.log(
    "- Workout History Fix:",
    results.workoutHistoryTest ? "✅" : "❌"
  );
  console.log("- AI JSON Parsing Fix:", results.aiJsonParsingTest ? "✅" : "❌");
  console.log("- AI Suggestions Fix:", results.aiSuggestionsTest ? "✅" : "❌");

  if (results.errors.length > 0) {
    console.log("\n❌ Errors found:");
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  } else {
    console.log("\n🎉 All tests passed! AI system should be working properly.");
  }

  const allPassed =
    results.workoutHistoryTest &&
    results.aiJsonParsingTest &&
    results.aiSuggestionsTest;

  return {
    ...results,
    allPassed,
    summary: allPassed ? "All fixes working!" : "Some issues remain",
  };
};

/**
 * Setup console test function
 */
export const setupAIFixesTest = () => {
  if (typeof window !== "undefined") {
    window.testAIFixes = testAIFixes;
    console.log("🔧 AI fixes test function available! Run: testAIFixes()");
  }
};

export default testAIFixes;
