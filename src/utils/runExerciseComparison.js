/**
 * Exercise Database Comparison Runner
 * Run this script to compare exercises between JSON and Firebase
 */

import {
  printComparisonReport,
  testComparison,
  getMissingExercisesDetailed,
} from "./exerciseComparison.js";

/**
 * Main function to run the comparison
 */
const main = async () => {
  try {
    console.log("🚀 Starting Exercise Database Comparison...");
    console.log(new Date().toISOString());
    console.log("=".repeat(80));

    // Run the full comparison and print report
    const report = await printComparisonReport();

    // Get detailed information about missing exercises
    console.log("\n🔍 GETTING DETAILED MISSING EXERCISES INFO...");
    const missingDetails = await getMissingExercisesDetailed();

    if (missingDetails.total > 0) {
      console.log("\n📋 MISSING EXERCISES BY BODY PART:");
      Object.entries(missingDetails.byBodyPart).forEach(
        ([bodyPart, exercises]) => {
          console.log(`\n💪 ${bodyPart} (${exercises.length} exercises):`);
          exercises.slice(0, 5).forEach((exercise, index) => {
            console.log(`  ${index + 1}. ${exercise.name}`);
            console.log(`     - Equipment: ${exercise.equipment}`);
            console.log(`     - Difficulty: ${exercise.difficulty}`);
            console.log(`     - Muscles: ${exercise.muscles.join(", ")}`);
          });
          if (exercises.length > 5) {
            console.log(
              `     ... and ${exercises.length - 5} more ${bodyPart} exercises`
            );
          }
        }
      );
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ Comparison completed successfully!");

    return report;
  } catch (error) {
    console.error("❌ Error running comparison:", error);
    process.exit(1);
  }
};

// For direct script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;

