// API Testing Utility for ExerciseDB
// This file helps debug API connectivity and target muscle names

import {
  fetchTargetList,
  fetchExercisesByTarget,
} from "../services/exerciseAPI";

// Test function to check API connectivity
export const testAPIConnection = async () => {
  console.log("🔧 Testing ExerciseDB API Connection...");

  try {
    // First, get the list of available targets
    console.log("📋 Fetching target list...");
    const targets = await fetchTargetList();
    console.log("✅ Available targets:", targets);

    // Test a few common targets (updated with exact API names)
    const testTargets = [
      "biceps",
      "pectorals",
      "lats",
      "quads",
      "abs",
      "delts",
      "triceps",
    ];

    for (const target of testTargets) {
      if (targets.includes(target)) {
        console.log(`✅ Testing target: ${target}`);
        try {
          const exercises = await fetchExercisesByTarget(target);
          console.log(`   Found ${exercises.length} exercises for ${target}`);
          if (exercises.length > 0) {
            console.log(`   Sample exercise:`, exercises[0]);
          }
        } catch (error) {
          console.error(`   ❌ Error fetching exercises for ${target}:`, error);
        }
      } else {
        console.log(`❌ Target '${target}' not available in API`);
      }
    }

    return {
      success: true,
      availableTargets: targets,
      message: "API connection test completed",
    };
  } catch (error) {
    console.error("❌ API Connection Test Failed:", error);
    return {
      success: false,
      error: error.message,
      message: "API connection test failed",
    };
  }
};

// Test a specific muscle group mapping
export const testMuscleGroup = async (muscleGroup) => {
  console.log(
    `🔧 Testing muscle group: ${muscleGroup.name} (${muscleGroup.apiName})`
  );

  try {
    const exercises = await fetchExercisesByTarget(muscleGroup.apiName);
    console.log(
      `✅ Found ${exercises.length} exercises for ${muscleGroup.name}`
    );

    if (exercises.length > 0) {
      console.log("Sample exercises:", exercises.slice(0, 3));
      return {
        success: true,
        count: exercises.length,
        exercises: exercises.slice(0, 5),
      };
    } else {
      console.log(`❌ No exercises found for ${muscleGroup.name}`);
      return { success: false, count: 0, message: "No exercises found" };
    }
  } catch (error) {
    console.error(`❌ Error testing ${muscleGroup.name}:`, error);
    return { success: false, error: error.message };
  }
};

// Export for global access in browser console
window.testAPI = testAPIConnection;
window.testMuscleGroup = testMuscleGroup;

console.log(
  "🔧 API Testing utilities loaded. Use testAPI() or testMuscleGroup(muscleGroup) in console."
);
