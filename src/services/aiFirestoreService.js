/**
 * @fileoverview AI-Enhanced Firestore Service
 * Manages AI-specific Firestore collections and data operations for the Progressive Overload AI system.
 * Handles aiSuggestions, userProgressionProfiles, and exerciseAnalytics collections.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * @typedef {Object} AISuggestionData
 * @property {string} userId - User identifier
 * @property {Array<WorkoutSuggestion>} nextWorkoutSuggestions - Suggested exercises and loads
 * @property {Array<PlateauAlert>} plateauAlerts - Detected stagnation warnings
 * @property {Object} progressionPlan - 4-week progression strategy
 * @property {Date} lastUpdated - Last update timestamp
 * @property {string} modelVersion - AI model version used
 */

/**
 * @typedef {Object} UserProgressionProfileData
 * @property {string} userId - User identifier
 * @property {Object} personalMetrics - Bodyweight, age, experience level, training frequency
 * @property {Object} progressionPreferences - Style, plateau tolerance, rep ranges, exercise preferences
 * @property {Object} performanceMetrics - Average progression rate, plateau frequency, goal achievement rate
 * @property {Object} aiModelData - Personalized weights, learning rate, confidence scores
 * @property {Date} createdAt - Profile creation timestamp
 * @property {Date} lastUpdated - Last update timestamp
 */

/**
 * @typedef {Object} ExerciseAnalyticsData
 * @property {string} exerciseId - Exercise identifier
 * @property {string} exerciseName - Exercise name
 * @property {Array<PerformanceRecord>} performanceHistory - Historical performance data
 * @property {Object} progressionMetrics - Current weight, best weight, progression rate, trend
 * @property {Object} aiInsights - Optimal rep range, rest time, plateau risk, next progression date
 * @property {Date} lastAnalyzed - Last analysis timestamp
 */

/**
 * AI Firestore Service
 * Manages AI-specific data collections and operations
 */
class AIFirestoreService {
  constructor() {
    this.collections = {
      aiSuggestions: "aiSuggestions",
      userProgressionProfiles: "userProgressionProfiles",
      exerciseAnalytics: "exerciseAnalytics",
    };
  }

  // ==================== AI Suggestions Collection ====================

  /**
   * Save AI suggestions for a user
   * @param {string} userId - User identifier
   * @param {Object} suggestionsData - AI suggestions data
   * @returns {Promise<void>}
   */
  async saveAISuggestions(userId, suggestionsData) {
    try {
      const docRef = doc(db, this.collections.aiSuggestions, userId);

      const data = {
        userId,
        ...suggestionsData,
        lastUpdated: serverTimestamp(),
        modelVersion: "1.0.0",
      };

      await setDoc(docRef, data, { merge: true });
      console.log("AI suggestions saved successfully", { userId });
    } catch (error) {
      console.error("Error saving AI suggestions:", error);
      throw error;
    }
  }

  /**
   * Get AI suggestions for a user
   * @param {string} userId - User identifier
   * @returns {Promise<AISuggestionData|null>}
   */
  async getAISuggestions(userId) {
    try {
      const docRef = doc(db, this.collections.aiSuggestions, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }

      return null;
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      throw error;
    }
  }

  /**
   * Update specific AI suggestion fields
   * @param {string} userId - User identifier
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateAISuggestions(userId, updates) {
    try {
      const docRef = doc(db, this.collections.aiSuggestions, userId);

      await updateDoc(docRef, {
        ...updates,
        lastUpdated: serverTimestamp(),
      });

      console.log("AI suggestions updated successfully", { userId, updates });
    } catch (error) {
      console.error("Error updating AI suggestions:", error);
      throw error;
    }
  }

  /**
   * Add plateau alert for user
   * @param {string} userId - User identifier
   * @param {Object} plateauAlert - Plateau alert data
   * @returns {Promise<void>}
   */
  async addPlateauAlert(userId, plateauAlert) {
    try {
      const docRef = doc(db, this.collections.aiSuggestions, userId);
      const docSnap = await getDoc(docRef);

      let plateauAlerts = [];
      if (docSnap.exists()) {
        plateauAlerts = docSnap.data().plateauAlerts || [];
      }

      // Add new alert with timestamp
      plateauAlerts.push({
        ...plateauAlert,
        alertDate: serverTimestamp(),
        acknowledged: false,
        id: `plateau_${Date.now()}`,
      });

      await this.updateAISuggestions(userId, { plateauAlerts });
    } catch (error) {
      console.error("Error adding plateau alert:", error);
      throw error;
    }
  }

  /**
   * Acknowledge plateau alert
   * @param {string} userId - User identifier
   * @param {string} alertId - Alert identifier
   * @returns {Promise<void>}
   */
  async acknowledgePlateauAlert(userId, alertId) {
    try {
      const suggestions = await this.getAISuggestions(userId);
      if (!suggestions || !suggestions.plateauAlerts) return;

      const updatedAlerts = suggestions.plateauAlerts.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      );

      await this.updateAISuggestions(userId, { plateauAlerts: updatedAlerts });
    } catch (error) {
      console.error("Error acknowledging plateau alert:", error);
      throw error;
    }
  }

  /**
   * Track suggestion interaction for learning and effectiveness measurement
   * @param {string} userId - User identifier
   * @param {Object} interactionData - Interaction data
   * @returns {Promise<void>}
   */
  async trackSuggestionInteraction(userId, interactionData) {
    try {
      const docRef = doc(db, this.collections.aiSuggestions, userId);
      const docSnap = await getDoc(docRef);

      let interactions = [];
      if (docSnap.exists()) {
        interactions = docSnap.data().interactions || [];
      }

      // Add new interaction
      interactions.push({
        ...interactionData,
        id: `interaction_${Date.now()}`,
        timestamp: serverTimestamp(),
      });

      // Keep only last 100 interactions to manage storage
      if (interactions.length > 100) {
        interactions = interactions.slice(-100);
      }

      await this.updateAISuggestions(userId, { interactions });
      console.log("Suggestion interaction tracked successfully", {
        userId,
        action: interactionData.action,
      });
    } catch (error) {
      console.error("Error tracking suggestion interaction:", error);
      throw error;
    }
  }

  // ==================== User Progression Profiles Collection ====================

  /**
   * Create or update user progression profile
   * @param {string} userId - User identifier
   * @param {Object} profileData - Profile data
   * @returns {Promise<void>}
   */
  async saveUserProgressionProfile(userId, profileData) {
    try {
      const docRef = doc(db, this.collections.userProgressionProfiles, userId);
      const existingDoc = await getDoc(docRef);

      const data = {
        userId,
        personalMetrics: {
          bodyweight: profileData.bodyweight || 70,
          age: profileData.age || 25,
          experienceLevel: profileData.experienceLevel || "intermediate",
          trainingFrequency: profileData.trainingFrequency || 3,
        },
        progressionPreferences: {
          style: profileData.preferredProgressionStyle || "moderate",
          plateauTolerance: profileData.plateauTolerance || 3,
          preferredRepRanges: profileData.preferredRepRanges || {
            compound: { min: 6, max: 10 },
            isolation: { min: 8, max: 15 },
          },
          exercisePreferences: profileData.exercisePreferences || [],
        },
        performanceMetrics: {
          averageProgressionRate: 0,
          plateauFrequency: 0,
          goalAchievementRate: 0,
          consistencyScore: 0,
          ...profileData.performanceMetrics,
        },
        aiModelData: {
          personalizedWeights: {},
          learningRate: 0.1,
          confidenceScores: {},
          lastTrainingDate: null,
          ...profileData.aiModelData,
        },
        lastUpdated: serverTimestamp(),
      };

      // Set createdAt only for new profiles
      if (!existingDoc.exists()) {
        data.createdAt = serverTimestamp();
      }

      await setDoc(docRef, data, { merge: true });
      console.log("User progression profile saved successfully", { userId });
    } catch (error) {
      console.error("Error saving user progression profile:", error);
      throw error;
    }
  }

  /**
   * Get user progression profile
   * @param {string} userId - User identifier
   * @returns {Promise<UserProgressionProfileData|null>}
   */
  async getUserProgressionProfile(userId) {
    try {
      const docRef = doc(db, this.collections.userProgressionProfiles, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }

      return null;
    } catch (error) {
      console.error("Error getting user progression profile:", error);
      throw error;
    }
  }

  /**
   * Update user performance metrics
   * @param {string} userId - User identifier
   * @param {Object} metrics - Performance metrics to update
   * @returns {Promise<void>}
   */
  async updatePerformanceMetrics(userId, metrics) {
    try {
      const docRef = doc(db, this.collections.userProgressionProfiles, userId);

      await updateDoc(docRef, {
        performanceMetrics: metrics,
        lastUpdated: serverTimestamp(),
      });

      console.log("Performance metrics updated successfully", { userId });
    } catch (error) {
      console.error("Error updating performance metrics:", error);
      throw error;
    }
  }

  // ==================== Exercise Analytics Collection ====================

  /**
   * Save exercise analytics data
   * @param {string} userId - User identifier
   * @param {string} exerciseId - Exercise identifier
   * @param {Object} analyticsData - Analytics data
   * @returns {Promise<void>}
   */
  async saveExerciseAnalytics(userId, exerciseId, analyticsData) {
    try {
      const docRef = doc(
        db,
        this.collections.exerciseAnalytics,
        `${userId}_${exerciseId}`
      );

      const data = {
        userId,
        exerciseId,
        exerciseName:
          analyticsData.exerciseName || exerciseId.replace("-", " "),
        performanceHistory: analyticsData.performanceHistory || [],
        progressionMetrics: {
          currentWeight: 0,
          bestWeight: 0,
          averageProgressionRate: 0,
          lastProgressDate: null,
          plateauStatus: "none",
          trendDirection: "maintaining",
          ...analyticsData.progressionMetrics,
        },
        aiInsights: {
          optimalRepRange: { min: 8, max: 12 },
          suggestedRestTime: 90,
          plateauRisk: 0,
          nextProgressionDate: null,
          confidenceLevel: 0.5,
          ...analyticsData.aiInsights,
        },
        lastAnalyzed: serverTimestamp(),
      };

      await setDoc(docRef, data, { merge: true });
      console.log("Exercise analytics saved successfully", {
        userId,
        exerciseId,
      });
    } catch (error) {
      console.error("Error saving exercise analytics:", error);
      throw error;
    }
  }

  /**
   * Get exercise analytics for a user and exercise
   * @param {string} userId - User identifier
   * @param {string} exerciseId - Exercise identifier
   * @returns {Promise<ExerciseAnalyticsData|null>}
   */
  async getExerciseAnalytics(userId, exerciseId) {
    try {
      const docRef = doc(
        db,
        this.collections.exerciseAnalytics,
        `${userId}_${exerciseId}`
      );
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }

      return null;
    } catch (error) {
      console.error("Error getting exercise analytics:", error);
      throw error;
    }
  }

  /**
   * Get all exercise analytics for a user
   * @param {string} userId - User identifier
   * @returns {Promise<Array<ExerciseAnalyticsData>>}
   */
  async getAllExerciseAnalytics(userId) {
    try {
      const q = query(
        collection(db, this.collections.exerciseAnalytics),
        where("userId", "==", userId),
        orderBy("lastAnalyzed", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting all exercise analytics:", error);
      throw error;
    }
  }

  /**
   * Add performance record to exercise analytics
   * @param {string} userId - User identifier
   * @param {string} exerciseId - Exercise identifier
   * @param {Object} performanceRecord - Performance record data
   * @returns {Promise<void>}
   */
  async addPerformanceRecord(userId, exerciseId, performanceRecord) {
    try {
      const analytics = await this.getExerciseAnalytics(userId, exerciseId);

      let performanceHistory = [];
      if (analytics && analytics.performanceHistory) {
        performanceHistory = analytics.performanceHistory;
      }

      // Add new record
      performanceHistory.push({
        date: serverTimestamp(),
        weight: performanceRecord.weight || 0,
        reps: performanceRecord.reps || 0,
        sets: performanceRecord.sets || 0,
        volume:
          (performanceRecord.weight || 0) *
          (performanceRecord.reps || 0) *
          (performanceRecord.sets || 0),
        rpe: performanceRecord.rpe || null,
        restTime: performanceRecord.restTime || null,
        personalRecord: performanceRecord.personalRecord || false,
      });

      // Keep only last 50 records to manage storage
      if (performanceHistory.length > 50) {
        performanceHistory = performanceHistory.slice(-50);
      }

      await this.saveExerciseAnalytics(userId, exerciseId, {
        performanceHistory,
        exerciseName: performanceRecord.exerciseName,
      });
    } catch (error) {
      console.error("Error adding performance record:", error);
      throw error;
    }
  }

  // ==================== Batch Operations ====================

  /**
   * Batch update multiple AI collections
   * @param {Array<Object>} operations - Array of batch operations
   * @returns {Promise<void>}
   */
  async batchUpdate(operations) {
    try {
      const batch = writeBatch(db);

      for (const operation of operations) {
        const {
          collection: collectionName,
          docId,
          data,
          type = "set",
        } = operation;
        const docRef = doc(db, collectionName, docId);

        if (type === "set") {
          batch.set(
            docRef,
            { ...data, lastUpdated: serverTimestamp() },
            { merge: true }
          );
        } else if (type === "update") {
          batch.update(docRef, { ...data, lastUpdated: serverTimestamp() });
        } else if (type === "delete") {
          batch.delete(docRef);
        }
      }

      await batch.commit();
      console.log("Batch update completed successfully", {
        operationsCount: operations.length,
      });
    } catch (error) {
      console.error("Error in batch update:", error);
      throw error;
    }
  }

  // ==================== Real-time Listeners ====================

  /**
   * Listen to AI suggestions changes
   * @param {string} userId - User identifier
   * @param {Function} callback - Callback function for changes
   * @returns {Function} Unsubscribe function
   */
  listenToAISuggestions(userId, callback) {
    const docRef = doc(db, this.collections.aiSuggestions, userId);

    return onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Error listening to AI suggestions:", error);
        callback(null, error);
      }
    );
  }

  /**
   * Listen to user progression profile changes
   * @param {string} userId - User identifier
   * @param {Function} callback - Callback function for changes
   * @returns {Function} Unsubscribe function
   */
  listenToUserProgressionProfile(userId, callback) {
    const docRef = doc(db, this.collections.userProgressionProfiles, userId);

    return onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Error listening to user progression profile:", error);
        callback(null, error);
      }
    );
  }

  // ==================== Data Validation ====================

  /**
   * Validate AI suggestions data structure
   * @param {Object} data - Data to validate
   * @returns {boolean} Validation result
   */
  validateAISuggestionsData(data) {
    const requiredFields = ["userId"];
    const optionalFields = [
      "nextWorkoutSuggestions",
      "plateauAlerts",
      "progressionPlan",
    ];

    // Check required fields
    for (const field of requiredFields) {
      if (!data.hasOwnProperty(field)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate nextWorkoutSuggestions structure
    if (
      data.nextWorkoutSuggestions &&
      Array.isArray(data.nextWorkoutSuggestions)
    ) {
      for (const suggestion of data.nextWorkoutSuggestions) {
        if (!suggestion.exerciseId || !suggestion.exerciseName) {
          console.error("Invalid workout suggestion structure");
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Validate user progression profile data structure
   * @param {Object} data - Data to validate
   * @returns {boolean} Validation result
   */
  validateUserProgressionProfileData(data) {
    const requiredFields = ["userId"];

    // Check required fields
    for (const field of requiredFields) {
      if (!data.hasOwnProperty(field)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate experience level
    if (
      data.experienceLevel &&
      !["beginner", "intermediate", "advanced"].includes(data.experienceLevel)
    ) {
      console.error("Invalid experience level");
      return false;
    }

    // Validate progression style
    if (
      data.preferredProgressionStyle &&
      !["conservative", "moderate", "aggressive"].includes(
        data.preferredProgressionStyle
      )
    ) {
      console.error("Invalid progression style");
      return false;
    }

    return true;
  }

  // ==================== Cleanup Operations ====================

  /**
   * Clean up old AI data for a user
   * @param {string} userId - User identifier
   * @param {number} daysOld - Days threshold for cleanup
   * @returns {Promise<void>}
   */
  async cleanupOldAIData(userId, daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Clean up old exercise analytics
      const analyticsQuery = query(
        collection(db, this.collections.exerciseAnalytics),
        where("userId", "==", userId),
        where("lastAnalyzed", "<", cutoffDate)
      );

      const analyticsSnapshot = await getDocs(analyticsQuery);
      const batch = writeBatch(db);

      analyticsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      if (analyticsSnapshot.docs.length > 0) {
        await batch.commit();
        console.log(
          `Cleaned up ${analyticsSnapshot.docs.length} old analytics records for user ${userId}`
        );
      }
    } catch (error) {
      console.error("Error cleaning up old AI data:", error);
      throw error;
    }
  }
}

// Export singleton instance
export default new AIFirestoreService();

// Export class for testing
export { AIFirestoreService };
