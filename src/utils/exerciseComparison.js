import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import mergedData from '../../MergedData.json' with { type: 'json' };

/**
 * Exercise Database Comparison Tool
 * Compares exercises from JSON file with Firebase database
 */

/**
 * Get all exercises from the JSON file
 */
export const getJSONExercises = () => {
  try {
    console.log('📊 Loading exercises from JSON file...');
    
    const exercises = mergedData.products.map((exercise) => ({
      id: exercise.id,
      name: exercise.title.trim(),
      slug: exercise.slug,
      bodyPart: exercise.muscle_groups?.[0] || 'Unknown',
      equipment: exercise.equipment?.[0] || 'bodyweight',
      muscles: exercise.muscle_groups || [],
      exerciseTypes: exercise.exercise_types || [],
      difficulty: exercise.difficulty || 'Beginner',
      description: exercise.description || '',
      steps: exercise.steps || [],
      videoUrls: exercise.video_urls || {},
      url: exercise.url
    }));
    
    console.log(`✅ Loaded ${exercises.length} exercises from JSON file`);
    console.log(`📋 Total records in metadata: ${mergedData.metadata.total_records}`);
    
    return exercises;
  } catch (error) {
    console.error('❌ Error loading exercises from JSON:', error);
    throw error;
  }
};

/**
 * Get all exercises from Firebase database
 */
export const getFirebaseExercises = async () => {
  try {
    console.log('🔥 Loading exercises from Firebase database...');
    
    const exercisesRef = collection(db, "exerciseDatabase");
    const snapshot = await getDocs(exercisesRef);
    
    const exercises = [];
    const initializationRecords = [];
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      
      // Separate initialization records from actual exercises
      if (data.initialized) {
        initializationRecords.push({
          id: doc.id,
          ...data
        });
      } else {
        exercises.push({
          id: doc.id,
          firebaseId: doc.id,
          name: data.name?.trim() || '',
          bodyPart: data.bodyPart || 'Unknown',
          equipment: data.equipment || 'bodyweight',
          target: data.target || 'Unknown',
          type: data.type || 'unknown',
          gifUrl: data.gifUrl || ''
        });
      }
    });
    
    console.log(`✅ Loaded ${exercises.length} exercises from Firebase`);
    console.log(`📊 Found ${initializationRecords.length} initialization records`);
    
    if (initializationRecords.length > 0) {
      console.log('📋 Initialization Records:', initializationRecords);
    }
    
    return {
      exercises,
      initializationRecords,
      totalDocuments: snapshot.docs.length
    };
  } catch (error) {
    console.error('❌ Error loading exercises from Firebase:', error);
    throw error;
  }
};

/**
 * Compare exercises between JSON and Firebase
 */
export const compareExercises = async () => {
  try {
    console.log('🔍 Starting exercise comparison...');
    console.log('='.repeat(60));
    
    // Get exercises from both sources
    const jsonExercises = getJSONExercises();
    const firebaseData = await getFirebaseExercises();
    const firebaseExercises = firebaseData.exercises;
    
    // Create lookup maps for efficient comparison
    const jsonExerciseMap = new Map();
    const firebaseExerciseMap = new Map();
    
    // Normalize names for comparison (lowercase, trimmed)
    jsonExercises.forEach(exercise => {
      const normalizedName = exercise.name.toLowerCase().trim();
      jsonExerciseMap.set(normalizedName, exercise);
    });
    
    firebaseExercises.forEach(exercise => {
      const normalizedName = exercise.name.toLowerCase().trim();
      firebaseExerciseMap.set(normalizedName, exercise);
    });
    
    // Find exercises that are in JSON but not in Firebase
    const missingInFirebase = [];
    jsonExercises.forEach(exercise => {
      const normalizedName = exercise.name.toLowerCase().trim();
      if (!firebaseExerciseMap.has(normalizedName)) {
        missingInFirebase.push(exercise);
      }
    });
    
    // Find exercises that are in Firebase but not in JSON
    const missingInJSON = [];
    firebaseExercises.forEach(exercise => {
      const normalizedName = exercise.name.toLowerCase().trim();
      if (!jsonExerciseMap.has(normalizedName)) {
        missingInJSON.push(exercise);
      }
    });
    
    // Find exercises that exist in both (matches)
    const matches = [];
    jsonExercises.forEach(exercise => {
      const normalizedName = exercise.name.toLowerCase().trim();
      if (firebaseExerciseMap.has(normalizedName)) {
        matches.push({
          json: exercise,
          firebase: firebaseExerciseMap.get(normalizedName)
        });
      }
    });
    
    // Generate statistics by muscle group/body part
    const jsonByBodyPart = {};
    const firebaseByBodyPart = {};
    
    jsonExercises.forEach(exercise => {
      const bodyPart = exercise.bodyPart;
      if (!jsonByBodyPart[bodyPart]) jsonByBodyPart[bodyPart] = 0;
      jsonByBodyPart[bodyPart]++;
    });
    
    firebaseExercises.forEach(exercise => {
      const bodyPart = exercise.bodyPart;
      if (!firebaseByBodyPart[bodyPart]) firebaseByBodyPart[bodyPart] = 0;
      firebaseByBodyPart[bodyPart]++;
    });
    
    // Compile the comparison report
    const report = {
      summary: {
        jsonTotal: jsonExercises.length,
        firebaseTotal: firebaseExercises.length,
        matches: matches.length,
        missingInFirebase: missingInFirebase.length,
        missingInJSON: missingInJSON.length,
        completionPercentage: ((matches.length / jsonExercises.length) * 100).toFixed(2)
      },
      missingInFirebase,
      missingInJSON,
      matches,
      statistics: {
        jsonByBodyPart,
        firebaseByBodyPart
      },
      firebaseMetadata: {
        totalDocuments: firebaseData.totalDocuments,
        initializationRecords: firebaseData.initializationRecords.length
      }
    };
    
    return report;
  } catch (error) {
    console.error('❌ Error comparing exercises:', error);
    throw error;
  }
};

/**
 * Print a detailed comparison report
 */
export const printComparisonReport = async () => {
  try {
    const report = await compareExercises();
    
    console.log('\n🎯 EXERCISE DATABASE COMPARISON REPORT');
    console.log('='.repeat(60));
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`📋 JSON Exercises: ${report.summary.jsonTotal}`);
    console.log(`🔥 Firebase Exercises: ${report.summary.firebaseTotal}`);
    console.log(`✅ Matches: ${report.summary.matches}`);
    console.log(`❌ Missing in Firebase: ${report.summary.missingInFirebase}`);
    console.log(`❓ Missing in JSON: ${report.summary.missingInJSON}`);
    console.log(`📈 Completion: ${report.summary.completionPercentage}%`);
    
    // Firebase metadata
    console.log('\n🔥 FIREBASE METADATA:');
    console.log(`📄 Total Documents: ${report.firebaseMetadata.totalDocuments}`);
    console.log(`⚙️ Initialization Records: ${report.firebaseMetadata.initializationRecords}`);
    
    // Missing exercises (first 10)
    if (report.missingInFirebase.length > 0) {
      console.log('\n❌ EXERCISES MISSING IN FIREBASE (First 10):');
      report.missingInFirebase.slice(0, 10).forEach((exercise, index) => {
        console.log(`${index + 1}. ${exercise.name} (${exercise.bodyPart})`);
      });
      if (report.missingInFirebase.length > 10) {
        console.log(`... and ${report.missingInFirebase.length - 10} more`);
      }
    }
    
    // Exercises in Firebase but not in JSON (first 10)
    if (report.missingInJSON.length > 0) {
      console.log('\n❓ EXERCISES IN FIREBASE BUT NOT IN JSON (First 10):');
      report.missingInJSON.slice(0, 10).forEach((exercise, index) => {
        console.log(`${index + 1}. ${exercise.name} (${exercise.bodyPart}) [Type: ${exercise.type}]`);
      });
      if (report.missingInJSON.length > 10) {
        console.log(`... and ${report.missingInJSON.length - 10} more`);
      }
    }
    
    // Body part statistics comparison
    console.log('\n💪 EXERCISES BY BODY PART COMPARISON:');
    const allBodyParts = new Set([
      ...Object.keys(report.statistics.jsonByBodyPart),
      ...Object.keys(report.statistics.firebaseByBodyPart)
    ]);
    
    Array.from(allBodyParts).sort().forEach(bodyPart => {
      const jsonCount = report.statistics.jsonByBodyPart[bodyPart] || 0;
      const firebaseCount = report.statistics.firebaseByBodyPart[bodyPart] || 0;
      const difference = jsonCount - firebaseCount;
      const status = difference === 0 ? '✅' : difference > 0 ? '❌' : '❓';
      
      console.log(`${status} ${bodyPart}: JSON(${jsonCount}) vs Firebase(${firebaseCount}) | Diff: ${difference}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 RECOMMENDATION:');
    
    if (report.summary.missingInFirebase === 0) {
      console.log('✅ All exercises from JSON are present in Firebase! Your database is complete.');
    } else {
      console.log(`❌ ${report.summary.missingInFirebase} exercises from JSON are missing in Firebase.`);
      console.log('💡 Consider running the initialization script to sync missing exercises.');
    }
    
    if (report.missingInJSON.length > 0) {
      console.log(`❓ Firebase has ${report.missingInJSON.length} exercises not in JSON (likely from external APIs).`);
    }
    
    return report;
  } catch (error) {
    console.error('❌ Error generating comparison report:', error);
    throw error;
  }
};

/**
 * Get exercises missing in Firebase with detailed information
 */
export const getMissingExercisesDetailed = async () => {
  try {
    const report = await compareExercises();
    
    // Group missing exercises by body part
    const missingByBodyPart = {};
    report.missingInFirebase.forEach(exercise => {
      const bodyPart = exercise.bodyPart;
      if (!missingByBodyPart[bodyPart]) {
        missingByBodyPart[bodyPart] = [];
      }
      missingByBodyPart[bodyPart].push(exercise);
    });
    
    return {
      total: report.missingInFirebase.length,
      exercises: report.missingInFirebase,
      byBodyPart: missingByBodyPart,
      summary: report.summary
    };
  } catch (error) {
    console.error('❌ Error getting missing exercises:', error);
    throw error;
  }
};

/**
 * Test function to verify the comparison works
 */
export const testComparison = async () => {
  try {
    console.log('🧪 Testing exercise comparison...');
    await printComparisonReport();
    console.log('✅ Comparison test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Comparison test failed:', error);
    return false;
  }
};

// Make comparison function available globally for easy access from browser console
if (typeof window !== 'undefined') {
  window.exerciseComparison = {
    compare: compareExercises,
    printReport: printComparisonReport,
    getMissing: getMissingExercisesDetailed,
    test: testComparison
  };
  console.log('🌐 Exercise comparison tools available globally at window.exerciseComparison');
}
