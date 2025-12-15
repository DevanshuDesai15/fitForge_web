// Local Exercise Data Testing Utility
// This file helps test the local exercise data service

import {
  fetchExercises,
  fetchAllExercises,
  getExerciseCount,
  testLocalService,
} from "../services/localExerciseService";

import {
  printComparisonReport,
  compareExercises,
  getMissingExercisesDetailed,
  testComparison,
} from "./exerciseComparison";

export const testAPI = async () => {
  console.log("🧪 Starting Local Exercise Data Tests...");

  try {
    // Test 1: Basic data loading
    console.log("\n📊 Test 1: Basic data loading");
    const singleExercise = await fetchExercises(1, 0);
    console.log("✅ Local data loaded successfully");
    console.log("Sample exercise:", singleExercise[0]?.name);

    // Test 2: Test with limit=10 (should work on all plans)
    console.log("\n📊 Test 2: Fetch 10 exercises");
    const tenExercises = await fetchExercises(10, 0);
    console.log(`✅ Fetched ${tenExercises.length} exercises with limit=10`);

    // Test 3: Test all exercises loading
    console.log("\n🔍 Test 3: Load all exercises");
    const allExercisesTest = await fetchAllExercises();
    console.log(
      `✅ LOCAL DATA: Got ${allExercisesTest.length} exercises from JSON file`
    );

    // Test 4: Test the local service functionality
    console.log("\n🚀 Test 4: Testing local service functions");
    const startTime = Date.now();
    const serviceTest = await testLocalService();
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`✅ Local service test: ${serviceTest ? "PASSED" : "FAILED"}`);
    console.log(`📈 Total exercises: ${allExercisesTest.length}`);
    console.log(`⏱️ Time taken: ${duration.toFixed(2)} seconds`);

    // Test 5: Get exercise count using utility function
    console.log("\n📊 Test 5: Exercise count utility");
    const count = await getExerciseCount();
    console.log(`📋 Total exercise count: ${count}`);

    // Summary
    console.log("\n📋 TEST SUMMARY:");
    console.log(`🔗 Data Source: Local JSON File`);
    console.log(`📊 Data Type: Complete Exercise Database`);
    console.log(`📈 Total Exercises Available: ${allExercisesTest.length}`);
    console.log(`⏱️ Load Duration: ${duration.toFixed(2)}s`);
    console.log(`🎯 Status: Local data service active`);

    return {
      connected: true,
      dataSource: "local",
      totalExercises: allExercisesTest.length,
      loadDuration: duration,
      exercises: allExercisesTest,
    };
  } catch (error) {
    console.error("❌ API Test Failed:", error);
    return {
      connected: false,
      error: error.message,
    };
  }
};

// Quick test to just check plan type
export const checkPlanType = async () => {
  try {
    const result = await fetchExercises(0, 0);
    const planType = result.length > 10 ? "paid" : "free";
    console.log(`🔍 Plan Type: ${planType.toUpperCase()}`);
    console.log(`📊 Exercises with limit=0: ${result.length}`);
    return { planType, exerciseCount: result.length };
  } catch (error) {
    console.error("Error checking plan type:", error);
    return { planType: "unknown", error: error.message };
  }
};

// Test pagination performance (for free plans)
export const testPagination = async (maxPages = 5) => {
  console.log(`🔄 Testing pagination (max ${maxPages} pages)...`);

  try {
    let allExercises = [];
    let page = 0;
    const pageSize = 10;

    while (page < maxPages) {
      const startTime = Date.now();
      const exercises = await fetchExercises(pageSize, page * pageSize);
      const duration = Date.now() - startTime;

      if (exercises.length === 0) {
        console.log(`📄 Page ${page}: No more exercises (end reached)`);
        break;
      }

      allExercises.push(...exercises);
      console.log(
        `📄 Page ${page}: ${exercises.length} exercises (${duration}ms)`
      );

      if (exercises.length < pageSize) {
        console.log(
          `📄 Page ${page}: Last page (got ${exercises.length} < ${pageSize})`
        );
        break;
      }

      page++;

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `✅ Pagination test complete: ${allExercises.length} total exercises in ${
        page + 1
      } pages`
    );
    return allExercises;
  } catch (error) {
    console.error("❌ Pagination test failed:", error);
    return [];
  }
};

// Test Exercise Database Comparison
export const testExerciseComparison = async () => {
  console.log("🔍 Starting Exercise Database Comparison Test...");

  try {
    console.log("\n=".repeat(60));
    console.log("📊 COMPARING JSON EXERCISES WITH FIREBASE DATABASE");
    console.log("=".repeat(60));

    const report = await printComparisonReport();

    console.log("\n🎯 COMPARISON TEST RESULTS:");
    console.log(`✅ Test completed successfully!`);
    console.log(`📋 JSON has ${report.summary.jsonTotal} exercises`);
    console.log(`🔥 Firebase has ${report.summary.firebaseTotal} exercises`);
    console.log(`🎯 Match rate: ${report.summary.completionPercentage}%`);

    if (report.summary.missingInFirebase > 0) {
      console.log(
        `❌ ${report.summary.missingInFirebase} exercises are missing in Firebase`
      );
      console.log(
        "💡 Consider running exercise initialization to sync the data"
      );
    } else {
      console.log("🎉 All JSON exercises are present in Firebase!");
    }

    return report;
  } catch (error) {
    console.error("❌ Exercise comparison test failed:", error);
    return { error: error.message };
  }
};

// Quick Firebase vs JSON comparison
export const quickCompareExercises = async () => {
  console.log("⚡ Quick Exercise Database Comparison...");

  try {
    const report = await compareExercises();

    console.log("\n📊 QUICK COMPARISON RESULTS:");
    console.log(`📋 JSON: ${report.summary.jsonTotal} exercises`);
    console.log(`🔥 Firebase: ${report.summary.firebaseTotal} exercises`);
    console.log(`✅ Matches: ${report.summary.matches}`);
    console.log(`❌ Missing in Firebase: ${report.summary.missingInFirebase}`);
    console.log(`❓ Extra in Firebase: ${report.summary.missingInJSON}`);
    console.log(`📈 Completion: ${report.summary.completionPercentage}%`);

    return report.summary;
  } catch (error) {
    console.error("❌ Quick comparison failed:", error);
    return { error: error.message };
  }
};

// Get missing exercises summary
export const getMissingExercises = async () => {
  console.log("📋 Getting exercises missing in Firebase...");

  try {
    const missing = await getMissingExercisesDetailed();

    console.log(`\n❌ ${missing.total} exercises missing in Firebase:`);

    if (missing.total > 0) {
      console.log("\n📊 Missing exercises by body part:");
      Object.entries(missing.byBodyPart).forEach(([bodyPart, exercises]) => {
        console.log(`💪 ${bodyPart}: ${exercises.length} exercises`);
        exercises.slice(0, 3).forEach((ex) => {
          console.log(`  - ${ex.name} (${ex.equipment})`);
        });
        if (exercises.length > 3) {
          console.log(`  ... and ${exercises.length - 3} more`);
        }
      });
    }

    return missing;
  } catch (error) {
    console.error("❌ Failed to get missing exercises:", error);
    return { error: error.message };
  }
};

// Export for global access in browser console
window.testAPI = testAPI;
window.checkPlanType = checkPlanType;
window.testPagination = testPagination;
window.compareExercises = testExerciseComparison;
window.quickCompare = quickCompareExercises;
window.getMissing = getMissingExercises;

console.log("🔧 API Testing utilities loaded. Available functions:");
console.log("  📊 testAPI() - Test local exercise service");
console.log("  🔍 checkPlanType() - Check API plan type");
console.log("  📄 testPagination(maxPages) - Test pagination");
console.log("  🔥 compareExercises() - Compare JSON vs Firebase exercises");
console.log("  ⚡ quickCompare() - Quick exercise comparison");
console.log("  📋 getMissing() - Get exercises missing in Firebase");
