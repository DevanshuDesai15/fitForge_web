/**
 * @fileoverview Progressive Overload AI Service
 * Provides intelligent workout progression recommendations, plateau detection,
 * and adaptive training suggestions based on user workout history and performance patterns.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import aiFirestoreService from "./aiFirestoreService";
import geminiAIService from "./geminiAIService";

/**
 * @typedef {Object} ProgressionAnalysis
 * @property {string} exerciseId - Unique exercise identifier
 * @property {string} exerciseName - Human-readable exercise name
 * @property {number} currentWeight - Current working weight in kg
 * @property {number} currentReps - Current rep count
 * @property {number} currentSets - Current set count
 * @property {'improving'|'maintaining'|'declining'} progressionTrend - Performance trend
 * @property {number} progressionRate - Weight progression rate in kg per week
 * @property {number} confidenceLevel - Confidence score (0-1)
 * @property {Date} lastProgressDate - Date of last progression
 * @property {number} totalSessions - Total sessions for this exercise
 */

/**
 * @typedef {Object} ProgressionSuggestion
 * @property {string} exerciseId - Exercise identifier
 * @property {string} exerciseName - Exercise name
 * @property {number} currentWeight - Current weight
 * @property {number} suggestedWeight - AI-suggested weight
 * @property {number} suggestedReps - AI-suggested reps
 * @property {number} suggestedSets - AI-suggested sets
 * @property {'weight'|'reps'|'sets'|'deload'} progressionType - Type of progression
 * @property {string} reasoning - Explanation for the suggestion
 * @property {number} confidenceLevel - Confidence in suggestion (0-1)
 * @property {Array<ProgressionOption>} alternativeOptions - Alternative suggestions
 */

/**
 * @typedef {Object} ProgressionOption
 * @property {number} weight - Alternative weight
 * @property {number} reps - Alternative reps
 * @property {string} reasoning - Reason for this option
 */

/**
 * @typedef {Object} PlateauDetection
 * @property {string} exerciseId - Exercise identifier
 * @property {string} exerciseName - Exercise name
 * @property {number} plateauDuration - Duration in sessions
 * @property {Date} lastProgressDate - Last progress date
 * @property {'weight'|'reps'|'volume'} plateauType - Type of plateau
 * @property {'mild'|'moderate'|'severe'} severity - Plateau severity
 * @property {Array<string>} suggestedInterventions - Intervention suggestions
 */

/**
 * @typedef {Object} WorkoutSuggestion
 * @property {string} exerciseId - Exercise identifier
 * @property {string} exerciseName - Exercise name
 * @property {number} suggestedWeight - Suggested weight
 * @property {number} suggestedReps - Suggested reps
 * @property {number} suggestedSets - Suggested sets
 * @property {number} restTime - Suggested rest time in seconds
 * @property {'high'|'medium'|'low'} priority - Suggestion priority
 * @property {string} reasoning - Explanation
 * @property {boolean} aiGenerated - Whether AI generated this suggestion
 */

/**
 * @typedef {Object} InterventionSuggestion
 * @property {string} type - Type of intervention
 * @property {'high'|'medium'|'low'} priority - Intervention priority
 * @property {string} title - Intervention title
 * @property {string} description - Detailed description
 * @property {Object} implementation - Implementation details
 * @property {string} reasoning - Why this intervention is suggested
 * @property {string} expectedOutcome - Expected results
 * @property {number} confidenceLevel - Confidence in intervention (0-1)
 * @property {number} estimatedEffectiveness - Estimated effectiveness (0-1)
 */

/**
 * @typedef {Object} UserProgressionProfile
 * @property {string} userId - User identifier
 * @property {number} bodyweight - User bodyweight in kg
 * @property {number} age - User age
 * @property {'beginner'|'intermediate'|'advanced'} experienceLevel - Training experience
 * @property {number} trainingFrequency - Sessions per week
 * @property {'conservative'|'moderate'|'aggressive'} preferredProgressionStyle - Progression preference
 * @property {number} plateauTolerance - Sessions before intervention
 * @property {Date} lastUpdated - Last profile update
 */

/**
 * @typedef {Object} PlateauAlert
 * @property {string} id - Unique alert identifier
 * @property {string} userId - User identifier
 * @property {string} exerciseId - Exercise identifier
 * @property {string} exerciseName - Exercise name
 * @property {'mild'|'moderate'|'severe'} severity - Plateau severity
 * @property {string} message - Alert message
 * @property {Array<InterventionSuggestion>} interventions - Suggested interventions
 * @property {Date} createdAt - Alert creation date
 * @property {Date} lastShown - Last time alert was shown
 * @property {boolean} acknowledged - Whether user acknowledged the alert
 * @property {boolean} dismissed - Whether user dismissed the alert
 * @property {Date} dismissedAt - When alert was dismissed
 * @property {number} showCount - Number of times alert was shown
 * @property {string} status - Alert status ('active', 'acknowledged', 'dismissed', 'resolved')
 */

/**
 * @typedef {Object} NotificationSettings
 * @property {boolean} enabled - Whether notifications are enabled
 * @property {number} frequency - Hours between repeated notifications
 * @property {Array<string>} severityLevels - Which severity levels to notify for
 * @property {boolean} showInterventions - Whether to show intervention suggestions
 * @property {number} maxShowCount - Maximum times to show same alert
 */

/**
 * @typedef {Object} WorkoutContext
 * @property {string} workoutType - Type of workout being planned
 * @property {Array<string>} targetMuscleGroups - Target muscle groups
 * @property {number} availableTime - Available time in minutes
 * @property {string} equipment - Available equipment
 */

/**
 * Progressive Overload AI Service
 * Core service for intelligent workout progression and training optimization
 */
class ProgressiveOverloadAIService {
  /**
   * Initialize the AI service
   * @param {Object} config - Service configuration
   * @param {boolean} config.enableLogging - Enable debug logging
   * @param {string} config.modelVersion - AI model version
   */
  constructor(config = {}) {
    this.config = {
      enableLogging: config.enableLogging || false,
      modelVersion: config.modelVersion || "1.0.0",
      // Progression constants
      compoundWeightIncrease: 2.5, // kg
      isolationWeightIncrease: 1.0, // kg
      plateauThreshold: 3, // sessions
      deloadPercentage: 0.1, // 10%
      confidenceThreshold: 0.7,
      // Gemini AI integration
      useGeminiAI: config.useGeminiAI !== false, // Default to true
      hybridMode: config.hybridMode !== false, // Use both rule-based and AI
      geminiPriority: config.geminiPriority || 0.4, // 40% weight to Gemini suggestions
      ...config,
    };

    this.compoundExercises = [
      "bench-press",
      "shoulder-press",
      "squat",
      "deadlift",
      "overhead-press",
      "barbell-row",
      "pull-up",
      "dip",
    ];

    this.isolationExercises = [
      "bicep-curls",
      "tricep-extensions",
      "lateral-raises",
      "leg-curls",
      "calf-raises",
      "chest-fly",
      "leg-extensions",
    ];

    this._log("ProgressiveOverloadAIService initialized", {
      config: this.config,
    });
  }

  /**
   * Analyze user's workout history for progression patterns
   * @param {string} userId - User identifier
   * @param {string} [exerciseId] - Optional specific exercise to analyze
   * @returns {Promise<ProgressionAnalysis|Array<ProgressionAnalysis>>}
   */
  async analyzeWorkoutHistory(userId, exerciseId = null) {
    try {
      this._log("Analyzing workout history", { userId, exerciseId });

      if (exerciseId) {
        return await this._analyzeExerciseHistory(userId, exerciseId);
      }

      // Load exercises from the exercises collection (your app's data structure)
      const exercisesQuery = query(
        collection(db, "exercises"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(50) // Get more exercises to have enough data for analysis
      );

      const exercisesSnapshot = await getDocs(exercisesQuery);
      const exercises = exercisesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      this._log("Exercises found for analysis", {
        userId,
        exerciseCount: exercises.length,
        sampleExercise: exercises[0]
          ? {
              id: exercises[0].id,
              exerciseId: exercises[0].exerciseId,
              exerciseName: exercises[0].exerciseName,
              hasSets: !!exercises[0].sets,
              setCount: exercises[0].sets ? exercises[0].sets.length : 0,
              timestamp: exercises[0].timestamp,
            }
          : null,
      });

      const exerciseAnalyses = new Map();

      // Process each exercise
      for (const exercise of exercises) {
        // Use exerciseName as the key since exerciseId doesn't exist in your data
        const exerciseKey = exercise.exerciseName;
        // Skip exercises without valid exerciseName
        if (!exerciseKey || typeof exerciseKey !== "string") {
          continue;
        }
        if (!exerciseAnalyses.has(exerciseKey)) {
          exerciseAnalyses.set(exerciseKey, []);
        }
        exerciseAnalyses.get(exerciseKey).push({
          date: exercise.timestamp,
          exerciseId: exerciseKey, // Add this for compatibility with the rest of the code
          exerciseName: exerciseKey,
          ...exercise,
        });
      }

      this._log("Exercise analyses map", {
        userId,
        exerciseCount: exerciseAnalyses.size,
        exerciseIds: Array.from(exerciseAnalyses.keys()),
        sessionCounts: Array.from(exerciseAnalyses.entries()).map(
          ([id, sessions]) => ({
            exerciseId: id,
            sessionCount: sessions.length,
          })
        ),
      });

      // Analyze each exercise
      const analyses = [];
      for (const [exerciseId, sessions] of exerciseAnalyses) {
        const analysis = await this._calculateProgressionAnalysis(
          exerciseId,
          sessions
        );
        analyses.push(analysis);
      }

      this._log("Final analyses", {
        userId,
        analysisCount: analyses.length,
      });
      return analyses;
    } catch (error) {
      this._logError("Error analyzing workout history", error);
      throw error;
    }
  }

  /**
   * Calculate next progression for a specific exercise using hybrid AI approach
   * @param {string} userId - User identifier
   * @param {string} exerciseId - Exercise identifier
   * @returns {Promise<ProgressionSuggestion>}
   */
  async calculateNextProgression(userId, exerciseId) {
    try {
      this._log("Calculating next progression", { userId, exerciseId });

      // Step 1: Perform rule-based analysis (fast, reliable)
      const analysis = await this._analyzeExerciseHistory(userId, exerciseId);
      const userProfile = await this._getUserProgressionProfile(userId);
      const ruleBasedSuggestion = await this._generateProgressionSuggestion(
        analysis,
        userProfile
      );

      // Step 2: Use Gemini AI for enhanced intelligence (when enabled)
      if (this.config.useGeminiAI) {
        try {
          const workoutHistory = await this._getRecentWorkoutHistory(userId, 5);
          const geminiSuggestion =
            await geminiAIService.generateProgressionSuggestions(
              analysis,
              userProfile,
              workoutHistory
            );

          // Step 3: Combine both suggestions intelligently
          return this._combineProgressionSuggestions(
            ruleBasedSuggestion,
            geminiSuggestion
          );
        } catch (error) {
          this._log("Gemini AI unavailable, using rule-based suggestion", {
            exerciseId,
            error: error.message,
          });
          return this._enhanceRuleBasedSuggestion(
            ruleBasedSuggestion,
            analysis
          );
        }
      }

      return this._enhanceRuleBasedSuggestion(ruleBasedSuggestion, analysis);
    } catch (error) {
      this._logError("Error calculating progression", error);
      throw error;
    }
  }

  /**
   * Suggest exercise substitutions based on similar muscle groups and user history
   * @param {string} userId - User identifier
   * @param {string} exerciseId - Original exercise identifier
   * @param {string} reason - Reason for substitution ('plateau', 'equipment', 'preference')
   * @returns {Promise<Array<ExerciseSubstitution>>}
   */
  async suggestExerciseSubstitutions(userId, exerciseId, reason = "plateau") {
    try {
      this._log("Suggesting exercise substitutions", {
        userId,
        exerciseId,
        reason,
      });

      // Get the original exercise analysis
      const originalAnalysis = await this._analyzeExerciseHistory(
        userId,
        exerciseId
      );

      // Get user profile for personalization
      const userProfile = await this._getUserProgressionProfile(userId);

      // Generate substitution suggestions based on reason
      const substitutions = await this._generateExerciseSubstitutions(
        originalAnalysis,
        userProfile,
        reason
      );

      this._log("Generated exercise substitutions", {
        exerciseId,
        substitutionCount: substitutions.length,
      });

      return substitutions;
    } catch (error) {
      this._logError("Error suggesting exercise substitutions", error);
      throw error;
    }
  }

  /**
   * Generate exercise substitutions based on analysis and reason
   * @param {ProgressionAnalysis} originalAnalysis - Original exercise analysis
   * @param {UserProgressionProfile} userProfile - User profile
   * @param {string} reason - Reason for substitution
   * @returns {Promise<Array<ExerciseSubstitution>>}
   * @private
   */
  async _generateExerciseSubstitutions(originalAnalysis, userProfile, reason) {
    const substitutions = [];

    // Define exercise substitution mappings based on muscle groups
    const substitutionMap = {
      "bench-press": [
        "incline-bench-press",
        "dumbbell-press",
        "push-ups",
        "chest-fly",
      ],
      squat: ["leg-press", "goblet-squat", "lunges", "bulgarian-split-squat"],
      deadlift: [
        "romanian-deadlift",
        "sumo-deadlift",
        "trap-bar-deadlift",
        "hip-thrust",
      ],
      "shoulder-press": [
        "dumbbell-shoulder-press",
        "arnold-press",
        "pike-push-ups",
        "lateral-raises",
      ],
      "pull-up": [
        "lat-pulldown",
        "assisted-pull-ups",
        "inverted-rows",
        "cable-rows",
      ],
      "bicep-curls": [
        "hammer-curls",
        "preacher-curls",
        "cable-curls",
        "chin-ups",
      ],
      "tricep-extensions": [
        "close-grip-bench-press",
        "dips",
        "overhead-tricep-press",
        "diamond-push-ups",
      ],
    };

    const exerciseKey = originalAnalysis.exerciseId.toLowerCase();
    const alternatives = substitutionMap[exerciseKey] || [];

    // Generate substitutions with reasoning
    for (const alternative of alternatives.slice(0, 3)) {
      const substitution = {
        exerciseId: alternative,
        exerciseName: alternative.replace("-", " "),
        originalExercise: originalAnalysis.exerciseId,
        originalExerciseName: originalAnalysis.exerciseName,
        reason: this._getSubstitutionReason(reason, alternative),
        suggestedWeight: this._calculateSubstitutionWeight(
          originalAnalysis,
          alternative
        ),
        suggestedReps: originalAnalysis.currentReps,
        suggestedSets: originalAnalysis.currentSets,
        confidenceLevel: this._calculateSubstitutionConfidence(
          originalAnalysis,
          alternative
        ),
        benefits: this._getSubstitutionBenefits(alternative, reason),
        difficulty: this._getExerciseDifficulty(alternative),
        equipment: this._getExerciseEquipment(alternative),
      };

      substitutions.push(substitution);
    }

    return substitutions.sort((a, b) => b.confidenceLevel - a.confidenceLevel);
  }

  /**
   * Calculate suggested weight for exercise substitution
   * @param {ProgressionAnalysis} originalAnalysis - Original exercise analysis
   * @param {string} alternativeExercise - Alternative exercise name
   * @returns {number} Suggested weight
   * @private
   */
  _calculateSubstitutionWeight(originalAnalysis, alternativeExercise) {
    // Weight conversion factors for different exercises
    const conversionFactors = {
      "dumbbell-press": 0.4, // Each dumbbell is roughly 40% of barbell weight
      "incline-bench-press": 0.85, // Typically 85% of flat bench
      "push-ups": 0, // Bodyweight exercise
      "leg-press": 1.5, // Can typically press more than squat
      "goblet-squat": 0.3, // Much lighter weight
      lunges: 0.6, // Per leg, so total is similar to squat
      "romanian-deadlift": 0.8, // Slightly less than conventional deadlift
      "sumo-deadlift": 1.0, // Similar to conventional
      "dumbbell-shoulder-press": 0.35, // Each dumbbell
      "lat-pulldown": 0.9, // Close to pull-up body weight equivalent
      "hammer-curls": 0.8, // Slightly heavier than regular curls
      "close-grip-bench-press": 0.9, // Close to regular bench
      dips: 0, // Bodyweight exercise
    };

    const factor = conversionFactors[alternativeExercise] || 0.8;
    return Math.round(originalAnalysis.currentWeight * factor);
  }

  /**
   * Calculate confidence level for exercise substitution
   * @param {ProgressionAnalysis} originalAnalysis - Original exercise analysis
   * @param {string} alternativeExercise - Alternative exercise name
   * @returns {number} Confidence level (0-1)
   * @private
   */
  _calculateSubstitutionConfidence(originalAnalysis, alternativeExercise) {
    // Base confidence on original exercise confidence and substitution quality
    const baseConfidence = originalAnalysis.confidenceLevel * 0.8;

    // High-quality substitutions (same movement pattern)
    const highQualitySubstitutions = [
      "incline-bench-press",
      "dumbbell-press",
      "sumo-deadlift",
      "romanian-deadlift",
      "dumbbell-shoulder-press",
      "hammer-curls",
    ];

    if (highQualitySubstitutions.includes(alternativeExercise)) {
      return Math.min(baseConfidence + 0.1, 0.95);
    }

    return baseConfidence;
  }

  /**
   * Get substitution reason text
   * @param {string} reason - Reason code
   * @param {string} alternative - Alternative exercise
   * @returns {string} Reason text
   * @private
   */
  _getSubstitutionReason(reason, alternative) {
    switch (reason) {
      case "plateau":
        return `Break through plateau with ${alternative.replace(
          "-",
          " "
        )} - different angle/grip`;
      case "equipment":
        return `Equipment alternative: ${alternative.replace(
          "-",
          " "
        )} targets same muscles`;
      case "preference":
        return `User preference: ${alternative.replace("-", " ")} for variety`;
      case "injury":
        return `Injury-friendly alternative: ${alternative.replace(
          "-",
          " "
        )} with reduced stress`;
      default:
        return `Alternative exercise: ${alternative.replace("-", " ")}`;
    }
  }

  /**
   * Get substitution benefits
   * @param {string} alternative - Alternative exercise
   * @param {string} reason - Reason for substitution
   * @returns {Array<string>} Benefits list
   * @private
   */
  _getSubstitutionBenefits(alternative) {
    const benefitMap = {
      "incline-bench-press": [
        "Upper chest focus",
        "Shoulder-friendly angle",
        "Strength variation",
      ],
      "dumbbell-press": [
        "Unilateral training",
        "Greater range of motion",
        "Stabilizer activation",
      ],
      "push-ups": [
        "Bodyweight convenience",
        "Core engagement",
        "Functional movement",
      ],
      "leg-press": [
        "Reduced spinal load",
        "Isolated leg strength",
        "Safer for beginners",
      ],
      "goblet-squat": [
        "Improved mobility",
        "Core activation",
        "Beginner-friendly",
      ],
      "romanian-deadlift": [
        "Hamstring focus",
        "Hip hinge pattern",
        "Posterior chain",
      ],
      "lat-pulldown": [
        "Controlled resistance",
        "Beginner-friendly",
        "Adjustable weight",
      ],
      "hammer-curls": [
        "Forearm strength",
        "Neutral grip",
        "Reduced wrist stress",
      ],
    };

    return (
      benefitMap[alternative] || [
        "Muscle variation",
        "Movement diversity",
        "Progression option",
      ]
    );
  }

  /**
   * Get exercise difficulty level
   * @param {string} exercise - Exercise name
   * @returns {string} Difficulty level
   * @private
   */
  _getExerciseDifficulty(exercise) {
    const difficultyMap = {
      "push-ups": "Beginner",
      "goblet-squat": "Beginner",
      "lat-pulldown": "Beginner",
      "dumbbell-press": "Intermediate",
      "incline-bench-press": "Intermediate",
      "romanian-deadlift": "Intermediate",
      "pull-ups": "Advanced",
      dips: "Advanced",
    };

    return difficultyMap[exercise] || "Intermediate";
  }

  /**
   * Get exercise equipment requirements
   * @param {string} exercise - Exercise name
   * @returns {string} Equipment type
   * @private
   */
  _getExerciseEquipment(exercise) {
    const equipmentMap = {
      "push-ups": "Bodyweight",
      "pull-ups": "Pull-up bar",
      dips: "Dip bars",
      "goblet-squat": "Dumbbell",
      "dumbbell-press": "Dumbbells",
      "hammer-curls": "Dumbbells",
      "lat-pulldown": "Cable machine",
      "leg-press": "Leg press machine",
      "incline-bench-press": "Barbell + Incline bench",
      "romanian-deadlift": "Barbell",
    };

    return equipmentMap[exercise] || "Standard gym equipment";
  }

  /**
   * Calculate progression for multiple exercises in a single batch request
   * This dramatically reduces API calls by processing all exercises together
   * @param {string} userId - User identifier
   * @param {Array<string>} exerciseIds - Array of exercise identifiers
   * @returns {Promise<Array<ProgressionSuggestion>>}
   */
  async calculateBatchProgressions(userId, exerciseIds) {
    try {
      this._log("Calculating batch progressions", {
        userId,
        exerciseCount: exerciseIds.length,
      });

      // Step 1: Get all analyses and user profile
      const [analyses, userProfile] = await Promise.all([
        Promise.all(
          exerciseIds.map((id) => this._analyzeExerciseHistory(userId, id))
        ),
        this._getUserProgressionProfile(userId),
      ]);

      // Step 2: Generate rule-based suggestions for all
      const ruleBasedSuggestions = await Promise.all(
        analyses.map((analysis) =>
          this._generateProgressionSuggestion(analysis, userProfile)
        )
      );

      // Step 3: Use single Gemini AI call for all exercises (when enabled)
      if (this.config.useGeminiAI && exerciseIds.length > 0) {
        try {
          const workoutHistory = await this._getRecentWorkoutHistory(userId, 5);
          const batchGeminiSuggestion =
            await geminiAIService.generateBatchProgressionSuggestions(
              analyses,
              userProfile,
              workoutHistory
            );

          // Step 4: Combine batch suggestions
          return ruleBasedSuggestions.map((ruleSuggestion, index) => {
            const geminiSuggestion = batchGeminiSuggestion.suggestions?.[index];
            if (geminiSuggestion) {
              return this._combineProgressionSuggestions(ruleSuggestion, {
                primarySuggestion: geminiSuggestion,
              });
            }
            return this._enhanceRuleBasedSuggestion(
              ruleSuggestion,
              analyses[index]
            );
          });
        } catch (error) {
          this._log(
            "Gemini AI unavailable for batch, using rule-based suggestions",
            {
              exerciseCount: exerciseIds.length,
              error: error.message,
            }
          );
          return ruleBasedSuggestions.map((suggestion, index) =>
            this._enhanceRuleBasedSuggestion(suggestion, analyses[index])
          );
        }
      }

      // Fallback to enhanced rule-based suggestions
      return ruleBasedSuggestions.map((suggestion, index) =>
        this._enhanceRuleBasedSuggestion(suggestion, analyses[index])
      );
    } catch (error) {
      this._logError("Error calculating batch progressions", error);
      throw error;
    }
  }

  /**
   * Get or create user progression profile
   * @param {string} userId - User identifier
   * @returns {Promise<UserProgressionProfile>}
   */
  async _getUserProgressionProfile(userId) {
    try {
      let profile = await aiFirestoreService.getUserProgressionProfile(userId);

      if (profile) {
        // Convert to expected format
        return {
          userId: profile.userId,
          bodyweight: profile.personalMetrics?.bodyweight || 70,
          age: profile.personalMetrics?.age || 25,
          experienceLevel:
            profile.personalMetrics?.experienceLevel || "intermediate",
          trainingFrequency: profile.personalMetrics?.trainingFrequency || 3,
          preferredProgressionStyle:
            profile.progressionPreferences?.style || "moderate",
          plateauTolerance:
            profile.progressionPreferences?.plateauTolerance || 3,
          lastUpdated: profile.lastUpdated || new Date(),
        };
      }

      // Create default profile using AI Firestore service
      const defaultProfileData = {
        bodyweight: 70,
        age: 25,
        experienceLevel: "intermediate",
        trainingFrequency: 3,
        preferredProgressionStyle: "moderate",
        plateauTolerance: 3,
      };

      await aiFirestoreService.saveUserProgressionProfile(
        userId,
        defaultProfileData
      );

      return {
        userId,
        ...defaultProfileData,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this._logError("Error getting user progression profile", error);
      throw error;
    }
  }

  /**
   * Analyze specific exercise history
   * @param {string} userId - User identifier
   * @param {string} exerciseId - Exercise identifier
   * @returns {Promise<ProgressionAnalysis>}
   * @private
   */
  async _analyzeExerciseHistory(userId, exerciseId) {
    // Get all recent exercises and filter client-side to avoid index requirements
    const exercisesQuery = query(
      collection(db, "exercises"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(50) // Get more to ensure we have enough for the specific exercise
    );

    const exercisesSnapshot = await getDocs(exercisesQuery);
    const allExercises = exercisesSnapshot.docs.map((doc) => ({
      id: doc.id,
      date: doc.data().timestamp,
      ...doc.data(),
    }));

    // Filter for the specific exercise and limit to 10 most recent
    const exerciseSessions = allExercises
      .filter((exercise) => exercise.exerciseName === exerciseId)
      .slice(0, 10)
      .map((exercise) => ({
        ...exercise,
        exerciseId: exerciseId, // Add for compatibility
        exerciseName: exerciseId,
      }));

    return this._calculateProgressionAnalysis(exerciseId, exerciseSessions);
  }

  /**
   * Calculate progression analysis for exercise sessions
   * @param {string} exerciseId - Exercise identifier
   * @param {Array} sessions - Exercise sessions
   * @returns {ProgressionAnalysis}
   * @private
   */
  _calculateProgressionAnalysis(exerciseId, sessions) {
    if (sessions.length === 0) {
      return {
        exerciseId,
        exerciseName: exerciseId
          ? exerciseId.replace("-", " ")
          : "Unknown Exercise",
        currentWeight: 0,
        currentReps: 0,
        currentSets: 0,
        progressionTrend: "maintaining",
        progressionRate: 0,
        confidenceLevel: 0,
        lastProgressDate: null,
        totalSessions: 0,
      };
    }

    // Sort sessions by date (newest first)
    sessions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const latestSession = sessions[0];
    const currentWeight = this._getMaxWeight(latestSession.sets || []);
    const currentReps = this._getMaxReps(latestSession.sets || []);
    const currentSets =
      latestSession.sets && Array.isArray(latestSession.sets)
        ? latestSession.sets.length
        : 0;

    // Calculate progression trend
    const progressionTrend = this._calculateProgressionTrend(sessions);
    const progressionRate = this._calculateProgressionRate(sessions);
    const lastProgressDate = this._findLastProgressDate(sessions);
    const confidenceLevel = this._calculateConfidenceLevel(sessions);

    return {
      exerciseId,
      exerciseName: exerciseId
        ? exerciseId.replace("-", " ")
        : "Unknown Exercise",
      currentWeight,
      currentReps,
      currentSets,
      progressionTrend,
      progressionRate,
      confidenceLevel,
      lastProgressDate,
      totalSessions: sessions.length,
    };
  }

  /**
   * Get maximum weight from sets
   * @param {Array} sets - Exercise sets
   * @returns {number}
   * @private
   */
  _getMaxWeight(sets) {
    if (!sets || !Array.isArray(sets) || sets.length === 0) return 0;
    return Math.max(...sets.map((set) => set.weight || 0));
  }

  /**
   * Get maximum reps from sets
   * @param {Array} sets - Exercise sets
   * @returns {number}
   * @private
   */
  _getMaxReps(sets) {
    if (!sets || !Array.isArray(sets) || sets.length === 0) return 0;
    return Math.max(...sets.map((set) => set.reps || 0));
  }

  /**
   * Calculate progression trend
   * @param {Array} sessions - Exercise sessions
   * @returns {'improving'|'maintaining'|'declining'}
   * @private
   */
  _calculateProgressionTrend(sessions) {
    if (sessions.length < 2) return "maintaining";

    const recentSessions = sessions.slice(0, 3);
    const weights = recentSessions.map((session) =>
      this._getMaxWeight(session.sets || [])
    );

    const isImproving = weights[0] > weights[weights.length - 1];
    const isDeclining = weights[0] < weights[weights.length - 1];

    if (isImproving) return "improving";
    if (isDeclining) return "declining";
    return "maintaining";
  }

  /**
   * Calculate progression rate in kg per week
   * @param {Array} sessions - Exercise sessions
   * @returns {number}
   * @private
   */
  _calculateProgressionRate(sessions) {
    if (sessions.length < 2) return 0;

    const firstSession = sessions[sessions.length - 1];
    const lastSession = sessions[0];

    const firstWeight = this._getMaxWeight(firstSession.sets || []);
    const lastWeight = this._getMaxWeight(lastSession.sets || []);

    const weightDiff = lastWeight - firstWeight;
    const timeDiff = new Date(lastSession.date) - new Date(firstSession.date);
    const weeksDiff = timeDiff / (1000 * 60 * 60 * 24 * 7);

    return weeksDiff > 0 ? weightDiff / weeksDiff : 0;
  }

  /**
   * Find last progress date
   * @param {Array} sessions - Exercise sessions
   * @returns {Date|null}
   * @private
   */
  _findLastProgressDate(sessions) {
    if (sessions.length < 2) return null;

    for (let i = 0; i < sessions.length - 1; i++) {
      const currentWeight = this._getMaxWeight(sessions[i].sets || []);
      const previousWeight = this._getMaxWeight(sessions[i + 1].sets || []);

      if (currentWeight > previousWeight) {
        return new Date(sessions[i].date);
      }
    }

    return null;
  }

  /**
   * Calculate confidence level for analysis
   * @param {Array} sessions - Exercise sessions
   * @returns {number}
   * @private
   */
  _calculateConfidenceLevel(sessions) {
    if (sessions.length === 0) return 0;
    if (sessions.length < 3) return 0.3;
    if (sessions.length < 5) return 0.6;
    return Math.min(0.95, 0.6 + (sessions.length - 5) * 0.05);
  }

  /**
   * Generate progression suggestion based on analysis
   * @param {ProgressionAnalysis} analysis - Exercise analysis
   * @param {UserProgressionProfile} userProfile - User profile
   * @returns {Promise<ProgressionSuggestion>}
   * @private
   */
  async _generateProgressionSuggestion(analysis) {
    const isCompound = this.compoundExercises.includes(analysis.exerciseId);
    const baseIncrease = isCompound
      ? this.config.compoundWeightIncrease
      : this.config.isolationWeightIncrease;

    let suggestedWeight = analysis.currentWeight;
    let suggestedReps = analysis.currentReps;
    let suggestedSets = analysis.currentSets;
    let progressionType = "weight";
    let reasoning = "";

    // Determine progression strategy
    if (
      analysis.progressionTrend === "improving" &&
      analysis.confidenceLevel > this.config.confidenceThreshold
    ) {
      suggestedWeight = analysis.currentWeight + baseIncrease;
      reasoning = `Progressive overload: increase weight by ${baseIncrease}kg based on recent improvements`;
    } else if (analysis.progressionTrend === "maintaining") {
      // Check if we should increase reps first
      if (analysis.currentReps < (isCompound ? 8 : 12)) {
        suggestedReps = Math.min(
          analysis.currentReps + 2,
          isCompound ? 10 : 15
        );
        progressionType = "reps";
        reasoning = `Increase reps to ${suggestedReps} before adding weight`;
      } else {
        suggestedWeight = analysis.currentWeight + baseIncrease;
        suggestedReps = isCompound ? 6 : 8; // Reset reps when increasing weight
        reasoning = `Ready for weight progression: increase to ${suggestedWeight}kg`;
      }
    } else {
      // Declining trend - suggest deload
      suggestedWeight = Math.max(
        analysis.currentWeight * (1 - this.config.deloadPercentage),
        baseIncrease
      );
      progressionType = "deload";
      reasoning = `Deload recommended: reduce weight by ${Math.round(
        this.config.deloadPercentage * 100
      )}% to break plateau`;
    }

    // Generate alternative options
    const alternativeOptions = this._generateAlternativeOptions(
      analysis,
      baseIncrease
    );

    return {
      exerciseId: analysis.exerciseId,
      exerciseName: analysis.exerciseName,
      currentWeight: analysis.currentWeight,
      suggestedWeight,
      suggestedReps,
      suggestedSets,
      progressionType,
      reasoning,
      confidenceLevel: analysis.confidenceLevel,
      alternativeOptions,
    };
  }

  /**
   * Generate alternative progression options
   * @param {ProgressionAnalysis} analysis - Exercise analysis
   * @param {number} baseIncrease - Base weight increase
   * @returns {Array<ProgressionOption>}
   * @private
   */
  _generateAlternativeOptions(analysis, baseIncrease) {
    const options = [];

    // Conservative option
    options.push({
      weight: analysis.currentWeight + baseIncrease * 0.5,
      reps: analysis.currentReps,
      reasoning: "Conservative progression - smaller weight increase",
    });

    // Rep-focused option
    options.push({
      weight: analysis.currentWeight,
      reps: Math.min(analysis.currentReps + 2, 15),
      reasoning: "Rep progression - increase volume before weight",
    });

    // Aggressive option (if confidence is high)
    if (analysis.confidenceLevel > 0.8) {
      options.push({
        weight: analysis.currentWeight + baseIncrease * 1.5,
        reps: Math.max(analysis.currentReps - 1, 5),
        reasoning:
          "Aggressive progression - larger weight increase with fewer reps",
      });
    }

    return options;
  }

  /**
   * Detect plateaus in user's training
   * @param {string} userId - User identifier
   * @returns {Promise<Array<PlateauDetection>>}
   */
  async detectPlateaus(userId) {
    try {
      this._log("Detecting plateaus", { userId });

      // Use the advanced plateau detection engine
      return await this.detectPlateausAdvanced(userId);
    } catch (error) {
      this._logError("Error detecting plateaus", error);
      throw error;
    }
  }

  /**
   * Enhanced intervention suggestion system using hybrid AI approach
   * Provides comprehensive plateau intervention strategies
   * @param {PlateauDetection} plateauData - Plateau information
   * @param {string} userId - User identifier for personalization
   * @returns {Promise<Array<InterventionSuggestion>>}
   */
  async suggestPlateauInterventions(plateauData, userId = null) {
    try {
      this._log("Generating plateau interventions", {
        exerciseId: plateauData.exerciseId,
        severity: plateauData.severity,
        plateauType: plateauData.plateauType,
      });

      // Step 1: Generate rule-based interventions (reliable baseline)
      const ruleBasedInterventions = await this._generateRuleBasedInterventions(
        plateauData
      );

      // Step 2: Use Gemini AI for intelligent analysis (when enabled and userId available)
      if (this.config.useGeminiAI && userId) {
        try {
          const userProfile = await this._getUserProgressionProfile(userId);
          const pastInterventions = await this._getPastInterventions(
            userId,
            plateauData.exerciseId
          );

          const geminiInterventions =
            await geminiAIService.generatePlateauInterventions(
              plateauData,
              userProfile,
              pastInterventions
            );

          // Step 3: Combine and enhance interventions
          const combinedInterventions = this._combineInterventionSuggestions(
            ruleBasedInterventions,
            geminiInterventions
          );

          return this._prioritizeInterventions(
            combinedInterventions,
            plateauData
          );
        } catch (error) {
          this._log(
            "Gemini AI unavailable for interventions, using rule-based",
            {
              exerciseId: plateauData.exerciseId,
              error: error.message,
            }
          );
        }
      }

      // Fallback to rule-based interventions with enhancements
      const sortedInterventions = this._prioritizeInterventions(
        ruleBasedInterventions,
        plateauData
      );

      this._log("Generated plateau interventions", {
        exerciseId: plateauData.exerciseId,
        interventionCount: sortedInterventions.length,
      });

      return sortedInterventions;
    } catch (error) {
      this._logError("Error generating plateau interventions", error);
      throw error;
    }
  }

  /**
   * Calculate deload week intervention with 10% weight reduction
   * @param {PlateauDetection} plateauData - Plateau information
   * @returns {InterventionSuggestion} Deload intervention
   */
  calculateDeloadIntervention(plateauData) {
    const deloadPercentage = this._calculateDeloadPercentage(plateauData);
    const deloadWeight = Math.max(
      plateauData.currentWeight * (1 - deloadPercentage),
      this._getMinimumWeight(plateauData.exerciseId)
    );

    const deloadDuration = this._calculateDeloadDuration(plateauData);

    return {
      type: "deload",
      priority: "high",
      title: `Deload Week - ${Math.round(
        deloadPercentage * 100
      )}% Weight Reduction`,
      description: `Reduce weight to ${
        Math.round(deloadWeight * 2) / 2
      }kg for ${deloadDuration} week(s)`,
      implementation: {
        newWeight: Math.round(deloadWeight * 2) / 2, // Round to nearest 0.5kg
        originalWeight: plateauData.currentWeight,
        duration: deloadDuration,
        targetReps: plateauData.currentReps,
        targetSets: Math.max(plateauData.currentSets || 3, 3),
      },
      reasoning: `After ${plateauData.plateauDuration} sessions without progress, a deload will help recovery and break the plateau`,
      expectedOutcome:
        "Improved recovery, form refinement, and renewed progression capacity",
      confidenceLevel: 0.85,
      estimatedEffectiveness: this._calculateInterventionEffectiveness(
        "deload",
        plateauData
      ),
    };
  }

  /**
   * Generate rep range modification suggestions
   * @param {PlateauDetection} plateauData - Plateau information
   * @returns {Array<InterventionSuggestion>} Rep range interventions
   */
  generateRepRangeModifications(plateauData) {
    const interventions = [];
    const isCompound = this.compoundExercises.includes(plateauData.exerciseId);
    const currentReps = plateauData.currentReps || 8;

    // High rep range intervention (hypertrophy focus)
    if (currentReps < 12) {
      interventions.push({
        type: "rep_range_modification",
        priority: "medium",
        title: "Switch to Hypertrophy Rep Range",
        description: `Increase reps to 12-15 range while maintaining current weight`,
        implementation: {
          newWeight: plateauData.currentWeight,
          targetReps: isCompound ? 12 : 15,
          targetSets: plateauData.currentSets || 3,
          restTime: isCompound ? 90 : 60, // seconds
        },
        reasoning:
          "Higher rep ranges can stimulate muscle growth and break strength plateaus",
        expectedOutcome: "Improved muscular endurance and volume tolerance",
        confidenceLevel: 0.75,
        estimatedEffectiveness: this._calculateInterventionEffectiveness(
          "rep_range",
          plateauData
        ),
      });
    }

    // Low rep range intervention (strength focus)
    if (currentReps > 6) {
      const strengthWeight = plateauData.currentWeight * 1.1; // 10% increase for lower reps
      interventions.push({
        type: "rep_range_modification",
        priority: "medium",
        title: "Switch to Strength Rep Range",
        description: `Increase weight to ${
          Math.round(strengthWeight * 2) / 2
        }kg and reduce reps to 4-6`,
        implementation: {
          newWeight: Math.round(strengthWeight * 2) / 2,
          targetReps: isCompound ? 5 : 6,
          targetSets: plateauData.currentSets || 3,
          restTime: isCompound ? 180 : 120, // seconds
        },
        reasoning:
          "Lower rep ranges with higher weight can break through strength plateaus",
        expectedOutcome: "Improved maximal strength and neural adaptations",
        confidenceLevel: 0.7,
        estimatedEffectiveness: this._calculateInterventionEffectiveness(
          "strength_focus",
          plateauData
        ),
      });
    }

    // Volume manipulation intervention
    interventions.push({
      type: "volume_modification",
      priority: "low",
      title: "Increase Training Volume",
      description: `Add 1-2 additional sets while maintaining weight and reps`,
      implementation: {
        newWeight: plateauData.currentWeight,
        targetReps: currentReps,
        targetSets: Math.min((plateauData.currentSets || 3) + 1, 5),
        restTime: isCompound ? 120 : 90,
      },
      reasoning:
        "Increased volume can provide additional stimulus for adaptation",
      expectedOutcome: "Enhanced work capacity and muscle growth stimulus",
      confidenceLevel: 0.65,
      estimatedEffectiveness: this._calculateInterventionEffectiveness(
        "volume_increase",
        plateauData
      ),
    });

    return interventions;
  }

  /**
   * Generate exercise variation recommendations
   * @param {PlateauDetection} plateauData - Plateau information
   * @returns {Promise<Array<InterventionSuggestion>>} Exercise variation interventions
   */
  async generateExerciseVariationRecommendations(plateauData) {
    const interventions = [];
    const exerciseVariations = this._getExerciseVariations(
      plateauData.exerciseId
    );

    for (const variation of exerciseVariations) {
      interventions.push({
        type: "exercise_variation",
        priority: "medium",
        title: `Switch to ${variation.name}`,
        description: variation.description,
        implementation: {
          newExerciseId: variation.exerciseId,
          newExerciseName: variation.name,
          transferWeight: this._calculateTransferWeight(
            plateauData.currentWeight,
            variation.difficulty
          ),
          targetReps: plateauData.currentReps,
          targetSets: plateauData.currentSets || 3,
        },
        reasoning: variation.reasoning,
        expectedOutcome: variation.expectedOutcome,
        confidenceLevel: 0.7,
        estimatedEffectiveness: this._calculateInterventionEffectiveness(
          "variation",
          plateauData
        ),
      });
    }

    return interventions;
  }

  /**
   * Generate severity-specific interventions
   * @param {PlateauDetection} plateauData - Plateau information
   * @returns {Array<InterventionSuggestion>} Severity-specific interventions
   * @private
   */
  _generateSeveritySpecificInterventions(plateauData) {
    const interventions = [];

    switch (plateauData.severity) {
      case "mild":
        interventions.push({
          type: "technique_refinement",
          priority: "low",
          title: "Focus on Form and Technique",
          description:
            "Emphasize perfect form, mind-muscle connection, and controlled tempo",
          implementation: {
            newWeight: plateauData.currentWeight,
            targetReps: plateauData.currentReps,
            targetSets: plateauData.currentSets || 3,
            tempoModification: "3-1-2-1", // 3 sec eccentric, 1 sec pause, 2 sec concentric, 1 sec pause
          },
          reasoning:
            "Technical improvements can unlock progress without changing load",
          expectedOutcome: "Better muscle activation and movement efficiency",
          confidenceLevel: 0.6,
          estimatedEffectiveness: 0.65,
        });

        interventions.push({
          type: "rest_optimization",
          priority: "low",
          title: "Optimize Rest Periods",
          description:
            "Increase rest time between sets to ensure full recovery",
          implementation: {
            newWeight: plateauData.currentWeight,
            targetReps: plateauData.currentReps,
            targetSets: plateauData.currentSets || 3,
            restTime: this.compoundExercises.includes(plateauData.exerciseId)
              ? 180
              : 120,
          },
          reasoning: "Inadequate rest may be limiting performance",
          expectedOutcome: "Better set-to-set performance maintenance",
          confidenceLevel: 0.55,
          estimatedEffectiveness: 0.6,
        });
        break;

      case "moderate":
        interventions.push({
          type: "frequency_modification",
          priority: "medium",
          title: "Increase Training Frequency",
          description: "Train this exercise 2-3 times per week instead of once",
          implementation: {
            newWeight: plateauData.currentWeight * 0.9, // Slightly reduce weight for higher frequency
            targetReps: plateauData.currentReps,
            targetSets: Math.max((plateauData.currentSets || 3) - 1, 2),
            frequency: "2-3x per week",
          },
          reasoning: "Higher frequency can provide more practice and stimulus",
          expectedOutcome: "Improved motor learning and adaptation",
          confidenceLevel: 0.75,
          estimatedEffectiveness: 0.8,
        });
        break;

      case "severe":
        interventions.push({
          type: "periodization_change",
          priority: "high",
          title: "Switch Training Phase",
          description:
            "Move to hypertrophy phase with higher volume, lower intensity",
          implementation: {
            newWeight: plateauData.currentWeight * 0.8,
            targetReps: 12,
            targetSets: 4,
            restTime: 90,
            duration: "4-6 weeks",
          },
          reasoning:
            "Complete phase change can provide novel stimulus and recovery",
          expectedOutcome: "Renewed adaptation capacity and muscle growth",
          confidenceLevel: 0.85,
          estimatedEffectiveness: 0.9,
        });

        interventions.push({
          type: "complete_exercise_substitution",
          priority: "high",
          title: "Temporarily Replace Exercise",
          description: "Replace with similar movement pattern for 4-6 weeks",
          implementation: {
            pauseDuration: "4-6 weeks",
            replacementExercises: this._getReplacementExercises(
              plateauData.exerciseId
            ),
          },
          reasoning:
            "Complete break from stagnant exercise allows recovery and renewed focus",
          expectedOutcome: "Mental and physical recovery, renewed motivation",
          confidenceLevel: 0.8,
          estimatedEffectiveness: 0.85,
        });
        break;
    }

    return interventions;
  }

  /**
   * Calculate appropriate deload percentage based on plateau characteristics
   * @param {PlateauDetection} plateauData - Plateau information
   * @returns {number} Deload percentage (0.1 = 10%)
   * @private
   */
  _calculateDeloadPercentage(plateauData) {
    let baseDeload = 0.1; // 10% base deload

    // Increase deload for severe plateaus
    if (plateauData.severity === "severe") {
      baseDeload = 0.2; // 20%
    } else if (plateauData.severity === "moderate") {
      baseDeload = 0.15; // 15%
    }

    // Adjust based on plateau duration
    if (plateauData.plateauDuration >= 6) {
      baseDeload += 0.05; // Additional 5%
    }

    return Math.min(baseDeload, 0.25); // Cap at 25%
  }

  /**
   * Calculate deload duration in weeks
   * @param {PlateauDetection} plateauData - Plateau information
   * @returns {number} Duration in weeks
   * @private
   */
  _calculateDeloadDuration(plateauData) {
    if (plateauData.severity === "severe") return 2;
    if (plateauData.severity === "moderate") return 1;
    return 1; // Default 1 week
  }

  /**
   * Get minimum weight for an exercise
   * @param {string} exerciseId - Exercise identifier
   * @returns {number} Minimum weight in kg
   * @private
   */
  _getMinimumWeight(exerciseId) {
    const isCompound = this.compoundExercises.includes(exerciseId);
    return isCompound ? 20 : 5; // 20kg for compounds, 5kg for isolation
  }

  /**
   * Calculate intervention effectiveness score
   * @param {string} interventionType - Type of intervention
   * @param {PlateauDetection} plateauData - Plateau information
   * @returns {number} Effectiveness score (0-1)
   * @private
   */
  _calculateInterventionEffectiveness(interventionType, plateauData) {
    const baseEffectiveness = {
      deload: 0.85,
      rep_range: 0.75,
      strength_focus: 0.7,
      volume_increase: 0.65,
      variation: 0.8,
      technique_refinement: 0.6,
      frequency_modification: 0.75,
      periodization_change: 0.9,
    };

    let effectiveness = baseEffectiveness[interventionType] || 0.7;

    // Adjust based on plateau severity
    if (plateauData.severity === "severe") {
      effectiveness *= 1.1; // More effective for severe plateaus
    } else if (plateauData.severity === "mild") {
      effectiveness *= 0.9; // Less critical for mild plateaus
    }

    return Math.min(effectiveness, 0.95);
  }

  /**
   * Get exercise variations for a given exercise
   * @param {string} exerciseId - Exercise identifier
   * @returns {Array<Object>} Exercise variations
   * @private
   */
  _getExerciseVariations(exerciseId) {
    const variations = {
      "bench-press": [
        {
          exerciseId: "incline-bench-press",
          name: "Incline Bench Press",
          description: "Switch to incline angle to target upper chest",
          difficulty: 0.9, // 90% of flat bench weight
          reasoning: "Different angle provides novel stimulus",
          expectedOutcome: "Upper chest development and renewed progress",
        },
        {
          exerciseId: "dumbbell-bench-press",
          name: "Dumbbell Bench Press",
          description: "Use dumbbells for greater range of motion",
          difficulty: 0.8, // 80% of barbell weight (per dumbbell)
          reasoning: "Unilateral loading and stability challenge",
          expectedOutcome: "Improved stability and muscle balance",
        },
      ],
      "shoulder-press": [
        {
          exerciseId: "dumbbell-shoulder-press",
          name: "Dumbbell Shoulder Press",
          description: "Switch to dumbbells for unilateral training",
          difficulty: 0.8,
          reasoning: "Independent arm movement and stability challenge",
          expectedOutcome: "Better shoulder stability and balance",
        },
        {
          exerciseId: "seated-shoulder-press",
          name: "Seated Shoulder Press",
          description: "Remove leg drive by sitting",
          difficulty: 0.85,
          reasoning: "Isolates shoulders by removing lower body assistance",
          expectedOutcome: "Pure shoulder strength development",
        },
      ],
      squat: [
        {
          exerciseId: "front-squat",
          name: "Front Squat",
          description: "Move bar to front position",
          difficulty: 0.75,
          reasoning: "Different loading pattern emphasizes quads and core",
          expectedOutcome: "Improved quad strength and posture",
        },
        {
          exerciseId: "goblet-squat",
          name: "Goblet Squat",
          description: "Hold weight at chest level",
          difficulty: 0.6,
          reasoning: "Teaches proper squat mechanics with front loading",
          expectedOutcome: "Better squat form and core engagement",
        },
      ],
    };

    return (
      variations[exerciseId] || [
        {
          exerciseId: `${exerciseId}-variation`,
          name: `${
            exerciseId ? exerciseId.replace("-", " ") : "Unknown Exercise"
          } Variation`,
          description:
            "Try a similar exercise with different equipment or angle",
          difficulty: 0.85,
          reasoning: "Novel stimulus can break plateau",
          expectedOutcome: "Renewed progress and motivation",
        },
      ]
    );
  }

  /**
   * Calculate transfer weight for exercise variations
   * @param {number} currentWeight - Current weight
   * @param {number} difficulty - Difficulty multiplier
   * @returns {number} Transfer weight
   * @private
   */
  _calculateTransferWeight(currentWeight, difficulty) {
    return Math.round(currentWeight * difficulty * 2) / 2; // Round to nearest 0.5kg
  }

  /**
   * Get replacement exercises for complete substitution
   * @param {string} exerciseId - Exercise identifier
   * @returns {Array<string>} Replacement exercise names
   * @private
   */
  _getReplacementExercises(exerciseId) {
    const replacements = {
      "bench-press": ["Push-ups", "Dips", "Chest Fly"],
      "shoulder-press": [
        "Lateral Raises",
        "Pike Push-ups",
        "Handstand Push-ups",
      ],
      squat: ["Lunges", "Step-ups", "Bulgarian Split Squats"],
      deadlift: ["Romanian Deadlifts", "Hip Thrusts", "Good Mornings"],
    };

    return (
      replacements[exerciseId] || [
        "Similar movement patterns",
        "Bodyweight alternatives",
      ]
    );
  }

  /**
   * Prioritize interventions based on effectiveness and plateau characteristics
   * @param {Array<InterventionSuggestion>} interventions - All interventions
   * @param {PlateauDetection} plateauData - Plateau information
   * @returns {Array<InterventionSuggestion>} Sorted interventions
   * @private
   */
  _prioritizeInterventions(interventions) {
    return interventions.sort((a, b) => {
      // Primary sort: priority (high > medium > low)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Secondary sort: effectiveness
      return b.estimatedEffectiveness - a.estimatedEffectiveness;
    });
  }

  /**
   * Calculate rep progression strategies
   * @param {ProgressionAnalysis} analysis - Exercise analysis
   * @param {UserProgressionProfile} userProfile - User profile
   * @returns {Object} Rep progression strategy
   */
  calculateRepProgression(analysis) {
    const isCompound = this.compoundExercises.includes(analysis.exerciseId);
    const targetRepRange = isCompound
      ? { min: 6, max: 10 }
      : { min: 8, max: 15 };

    let strategy = {
      currentReps: analysis.currentReps,
      targetReps: analysis.currentReps,
      progressionType: "maintain",
      reasoning: "",
    };

    // If current reps are below target range, increase reps
    if (analysis.currentReps < targetRepRange.min) {
      strategy.targetReps = targetRepRange.min;
      strategy.progressionType = "increase";
      strategy.reasoning = `Increase reps to minimum effective range (${targetRepRange.min})`;
    }
    // If current reps are in range but can progress
    else if (
      analysis.currentReps < targetRepRange.max &&
      analysis.progressionTrend === "improving"
    ) {
      strategy.targetReps = Math.min(
        analysis.currentReps + 2,
        targetRepRange.max
      );
      strategy.progressionType = "increase";
      strategy.reasoning = `Progressive rep increase within effective range`;
    }
    // If at max reps, ready for weight progression
    else if (analysis.currentReps >= targetRepRange.max) {
      strategy.targetReps = targetRepRange.min;
      strategy.progressionType = "reset_for_weight";
      strategy.reasoning = `Reset reps to ${targetRepRange.min} and increase weight`;
    }

    return strategy;
  }

  /**
   * Calculate deload recommendations
   * @param {ProgressionAnalysis} analysis - Exercise analysis
   * @param {number} plateauDuration - Duration of plateau in sessions
   * @returns {Object} Deload recommendation
   */
  calculateDeloadRecommendation(analysis, plateauDuration) {
    let deloadPercentage = 0.1; // Default 10%
    let deloadDuration = 1; // weeks

    // Adjust based on plateau severity
    if (plateauDuration >= 5) {
      deloadPercentage = 0.2; // 20% for severe plateaus
      deloadDuration = 2;
    } else if (plateauDuration >= 4) {
      deloadPercentage = 0.15; // 15% for moderate plateaus
      deloadDuration = 1;
    }

    const deloadWeight = Math.max(
      analysis.currentWeight * (1 - deloadPercentage),
      this.compoundExercises.includes(analysis.exerciseId) ? 20 : 10 // Minimum weights
    );

    return {
      originalWeight: analysis.currentWeight,
      deloadWeight: Math.round(deloadWeight * 2) / 2, // Round to nearest 0.5kg
      deloadPercentage: Math.round(deloadPercentage * 100),
      duration: deloadDuration,
      reasoning: `${plateauDuration} sessions without progress - deload ${Math.round(
        deloadPercentage * 100
      )}% for ${deloadDuration} week(s)`,
    };
  }

  /**
   * Calculate confidence scoring for recommendations
   * @param {ProgressionAnalysis} analysis - Exercise analysis
   * @param {UserProgressionProfile} userProfile - User profile
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidenceScore(analysis, userProfile) {
    let confidence = 0.5; // Base confidence

    // Factor 1: Data quantity (more sessions = higher confidence)
    const dataFactor = Math.min(analysis.totalSessions / 10, 1) * 0.3;
    confidence += dataFactor;

    // Factor 2: Consistency of progression trend
    const trendFactor =
      analysis.progressionTrend === "improving"
        ? 0.2
        : analysis.progressionTrend === "maintaining"
        ? 0.1
        : -0.1;
    confidence += trendFactor;

    // Factor 3: Recent performance
    const recentFactor =
      analysis.lastProgressDate &&
      Date.now() - analysis.lastProgressDate.getTime() <
        14 * 24 * 60 * 60 * 1000
        ? 0.15
        : 0;
    confidence += recentFactor;

    // Factor 4: User experience level
    const experienceFactor =
      userProfile.experienceLevel === "advanced"
        ? 0.1
        : userProfile.experienceLevel === "intermediate"
        ? 0.05
        : 0;
    confidence += experienceFactor;

    // Factor 5: Exercise type (compounds are more predictable)
    const exerciseFactor = this.compoundExercises.includes(analysis.exerciseId)
      ? 0.05
      : 0;
    confidence += exerciseFactor;

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  /**
   * Analyze user's 16 completed workouts for patterns and insights
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Comprehensive workout analysis
   */
  async analyzeWorkoutHistoryComprehensive(userId) {
    try {
      this._log("Analyzing comprehensive workout history", { userId });

      // Get last 16 workouts as per requirements
      const workoutsQuery = query(
        collection(db, "workouts"),
        where("userId", "==", userId),
        where("completed", "==", true),
        orderBy("timestamp", "desc"),
        limit(16)
      );

      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts = workoutsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (workouts.length === 0) {
        return this._getEmptyAnalysis();
      }

      // Perform comprehensive analysis
      const exerciseFrequencyAnalysis =
        this._analyzeExerciseFrequency(workouts);
      const personalRecordAnalysis = this._analyzePersonalRecords(workouts);
      const trendAnalysis = this._analyzeTrends(workouts);
      const consistencyAnalysis = this._analyzeConsistency(workouts);
      const volumeAnalysis = this._analyzeVolumeProgression(workouts);

      return {
        totalWorkouts: workouts.length,
        dateRange: {
          start: workouts[workouts.length - 1]?.date,
          end: workouts[0]?.date,
        },
        exerciseFrequency: exerciseFrequencyAnalysis,
        personalRecords: personalRecordAnalysis,
        trends: trendAnalysis,
        consistency: consistencyAnalysis,
        volume: volumeAnalysis,
        recommendations: this._generateHistoryBasedRecommendations(workouts),
      };
    } catch (error) {
      this._logError("Error analyzing comprehensive workout history", error);
      throw error;
    }
  }

  /**
   * Detect exercise frequency patterns
   * @param {Array} workouts - Workout data
   * @returns {Object} Exercise frequency analysis
   * @private
   */
  _analyzeExerciseFrequency(workouts) {
    const exerciseCount = new Map();
    const exerciseLastSeen = new Map();
    const totalExercises = new Set();

    workouts.forEach((workout, index) => {
      if (workout.exercises && Array.isArray(workout.exercises)) {
        workout.exercises.forEach((exercise) => {
          const exerciseId = exercise.exerciseId;
          // Skip exercises without valid exerciseId
          if (!exerciseId || typeof exerciseId !== "string") {
            return;
          }
          totalExercises.add(exerciseId);

          exerciseCount.set(
            exerciseId,
            (exerciseCount.get(exerciseId) || 0) + 1
          );

          if (!exerciseLastSeen.has(exerciseId)) {
            exerciseLastSeen.set(exerciseId, index);
          }
        });
      }
    });

    // Calculate frequency metrics
    const frequencyData = Array.from(exerciseCount.entries()).map(
      ([exerciseId, count]) => ({
        exerciseId,
        exerciseName: exerciseId
          ? exerciseId.replace("-", " ")
          : "Unknown Exercise",
        frequency: count,
        frequencyPercentage: (count / workouts.length) * 100,
        lastSeenWorkoutsAgo: exerciseLastSeen.get(exerciseId),
        isRegular: count >= Math.ceil(workouts.length * 0.3), // Appears in 30%+ of workouts
        isRecent: exerciseLastSeen.get(exerciseId) <= 2, // Seen in last 3 workouts
      })
    );

    // Sort by frequency
    frequencyData.sort((a, b) => b.frequency - a.frequency);

    return {
      totalUniqueExercises: totalExercises.size,
      mostFrequent: frequencyData.slice(0, 5),
      regularExercises: frequencyData.filter((ex) => ex.isRegular),
      recentExercises: frequencyData.filter((ex) => ex.isRecent),
      averageExercisesPerWorkout:
        workouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0) /
        workouts.length,
    };
  }

  /**
   * Analyze personal records and achievements
   * @param {Array} workouts - Workout data
   * @returns {Object} Personal record analysis
   * @private
   */
  _analyzePersonalRecords(workouts) {
    const personalRecords = new Map();
    const recordProgression = new Map();

    workouts.forEach((workout) => {
      if (workout.exercises && Array.isArray(workout.exercises)) {
        workout.exercises.forEach((exercise) => {
          const exerciseId = exercise.exerciseId;
          // Skip exercises without valid exerciseId
          if (!exerciseId || typeof exerciseId !== "string") {
            return;
          }

          if (exercise.sets && Array.isArray(exercise.sets)) {
            exercise.sets.forEach((set) => {
              const volume = (set.weight || 0) * (set.reps || 0);
              const maxWeight = set.weight || 0;

              if (!personalRecords.has(exerciseId)) {
                personalRecords.set(exerciseId, {
                  exerciseId,
                  exerciseName: exerciseId
                    ? exerciseId.replace("-", " ")
                    : "Unknown Exercise",
                  maxWeight: 0,
                  maxVolume: 0,
                  maxReps: 0,
                  firstSeen: workout.timestamp,
                  lastImprovement: null,
                });
              }

              const current = personalRecords.get(exerciseId);
              let improved = false;

              if (maxWeight > current.maxWeight) {
                current.maxWeight = maxWeight;
                current.lastImprovement = workout.timestamp;
                improved = true;
              }

              if (volume > current.maxVolume) {
                current.maxVolume = volume;
                if (!improved) current.lastImprovement = workout.timestamp;
                improved = true;
              }

              if ((set.reps || 0) > current.maxReps) {
                current.maxReps = set.reps || 0;
                if (!improved) current.lastImprovement = workout.timestamp;
              }

              // Track progression over time
              if (!recordProgression.has(exerciseId)) {
                recordProgression.set(exerciseId, []);
              }
              recordProgression.get(exerciseId).push({
                date: workout.timestamp,
                weight: maxWeight,
                volume: volume,
                reps: set.reps || 0,
              });
            });
          }
        });
      }
    });

    const recordsArray = Array.from(personalRecords.values());

    return {
      totalRecords: recordsArray.length,
      recentRecords: recordsArray.filter(
        (record) =>
          record.lastImprovement &&
          Date.now() - new Date(record.lastImprovement).getTime() <
            30 * 24 * 60 * 60 * 1000 // Last 30 days
      ),
      topPerformers: recordsArray
        .filter((record) => record.maxWeight > 0)
        .sort((a, b) => b.maxWeight - a.maxWeight)
        .slice(0, 5),
      progressionData: Object.fromEntries(recordProgression),
    };
  }

  /**
   * Analyze workout trends and patterns
   * @param {Array} workouts - Workout data
   * @returns {Object} Trend analysis
   * @private
   */
  _analyzeTrends(workouts) {
    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Calculate workout frequency trend
    const workoutDates = sortedWorkouts.map((w) => new Date(w.date));
    const daysBetweenWorkouts = [];

    for (let i = 1; i < workoutDates.length; i++) {
      const daysDiff =
        (workoutDates[i] - workoutDates[i - 1]) / (1000 * 60 * 60 * 24);
      daysBetweenWorkouts.push(daysDiff);
    }

    const averageDaysBetween =
      daysBetweenWorkouts.length > 0
        ? daysBetweenWorkouts.reduce((sum, days) => sum + days, 0) /
          daysBetweenWorkouts.length
        : 0;

    // Calculate volume trend
    const volumeTrend = sortedWorkouts.map((workout) => ({
      date: workout.timestamp,
      totalVolume: workout.totalVolume || 0,
      duration: workout.duration || 0,
      exerciseCount: workout.exercises?.length || 0,
    }));

    // Determine overall trends
    const recentWorkouts = volumeTrend.slice(-5);
    const earlierWorkouts = volumeTrend.slice(0, 5);

    const recentAvgVolume =
      recentWorkouts.reduce((sum, w) => sum + w.totalVolume, 0) /
      recentWorkouts.length;
    const earlierAvgVolume =
      earlierWorkouts.reduce((sum, w) => sum + w.totalVolume, 0) /
      earlierWorkouts.length;

    const volumeChange = recentAvgVolume - earlierAvgVolume;
    const volumeTrendDirection =
      volumeChange > 0
        ? "increasing"
        : volumeChange < 0
        ? "decreasing"
        : "stable";

    return {
      workoutFrequency: {
        averageDaysBetween: Math.round(averageDaysBetween * 10) / 10,
        weeklyFrequency: 7 / averageDaysBetween,
        consistency: this._calculateConsistencyScore(daysBetweenWorkouts),
      },
      volume: {
        trend: volumeTrendDirection,
        changeAmount: Math.round(volumeChange),
        changePercentage:
          earlierAvgVolume > 0
            ? Math.round((volumeChange / earlierAvgVolume) * 100)
            : 0,
        currentAverage: Math.round(recentAvgVolume),
        progression: volumeTrend,
      },
      duration: {
        average: Math.round(
          sortedWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) /
            sortedWorkouts.length
        ),
        trend: this._calculateDurationTrend(sortedWorkouts),
      },
    };
  }

  /**
   * Analyze workout consistency
   * @param {Array} workouts - Workout data
   * @returns {Object} Consistency analysis
   * @private
   */
  _analyzeConsistency(workouts) {
    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    if (sortedWorkouts.length < 2) {
      return { score: 0, rating: "insufficient_data" };
    }

    const workoutDates = sortedWorkouts.map((w) => new Date(w.date));
    const daysBetweenWorkouts = [];

    for (let i = 1; i < workoutDates.length; i++) {
      const daysDiff =
        (workoutDates[i] - workoutDates[i - 1]) / (1000 * 60 * 60 * 24);
      daysBetweenWorkouts.push(daysDiff);
    }

    const consistencyScore =
      this._calculateConsistencyScore(daysBetweenWorkouts);

    let rating = "poor";
    if (consistencyScore >= 0.8) rating = "excellent";
    else if (consistencyScore >= 0.6) rating = "good";
    else if (consistencyScore >= 0.4) rating = "fair";

    return {
      score: Math.round(consistencyScore * 100) / 100,
      rating,
      averageDaysBetween:
        Math.round(
          (daysBetweenWorkouts.reduce((sum, days) => sum + days, 0) /
            daysBetweenWorkouts.length) *
            10
        ) / 10,
      longestGap: Math.max(...daysBetweenWorkouts),
      shortestGap: Math.min(...daysBetweenWorkouts),
    };
  }

  /**
   * Analyze volume progression patterns
   * @param {Array} workouts - Workout data
   * @returns {Object} Volume analysis
   * @private
   */
  _analyzeVolumeProgression(workouts) {
    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    const volumeData = sortedWorkouts.map((workout) => ({
      date: workout.timestamp,
      totalVolume: workout.totalVolume || 0,
      exerciseCount: workout.exercises?.length || 0,
    }));

    const totalVolume = volumeData.reduce((sum, w) => sum + w.totalVolume, 0);
    const averageVolume = totalVolume / volumeData.length;

    // Calculate volume progression rate
    const firstHalf = volumeData.slice(0, Math.floor(volumeData.length / 2));
    const secondHalf = volumeData.slice(Math.floor(volumeData.length / 2));

    const firstHalfAvg =
      firstHalf.reduce((sum, w) => sum + w.totalVolume, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, w) => sum + w.totalVolume, 0) / secondHalf.length;

    const progressionRate = secondHalfAvg - firstHalfAvg;

    return {
      totalVolume,
      averageVolume: Math.round(averageVolume),
      progressionRate: Math.round(progressionRate),
      progressionPercentage:
        firstHalfAvg > 0
          ? Math.round((progressionRate / firstHalfAvg) * 100)
          : 0,
      volumeDistribution: volumeData,
      highestVolume: Math.max(...volumeData.map((w) => w.totalVolume)),
      lowestVolume: Math.min(...volumeData.map((w) => w.totalVolume)),
    };
  }

  /**
   * Generate recommendations based on workout history analysis
   * @param {Array} workouts - Workout data
   * @returns {Array<string>} Recommendations
   * @private
   */
  _generateHistoryBasedRecommendations(workouts) {
    const recommendations = [];

    // Analyze workout frequency
    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const workoutDates = sortedWorkouts.map((w) => new Date(w.date));
    const daysBetweenWorkouts = [];

    for (let i = 1; i < workoutDates.length; i++) {
      const daysDiff =
        (workoutDates[i] - workoutDates[i - 1]) / (1000 * 60 * 60 * 24);
      daysBetweenWorkouts.push(daysDiff);
    }

    const averageDaysBetween =
      daysBetweenWorkouts.reduce((sum, days) => sum + days, 0) /
      daysBetweenWorkouts.length;

    if (averageDaysBetween > 4) {
      recommendations.push(
        "Consider increasing workout frequency - aim for 3-4 sessions per week for optimal progress"
      );
    }

    if (averageDaysBetween < 1.5) {
      recommendations.push(
        "You might be overtraining - consider adding rest days between sessions"
      );
    }

    // Analyze exercise variety
    const uniqueExercises = new Set();
    workouts.forEach((workout) => {
      if (workout.exercises) {
        workout.exercises.forEach((ex) => uniqueExercises.add(ex.exerciseId));
      }
    });

    if (uniqueExercises.size < 8) {
      recommendations.push(
        "Add more exercise variety to target different muscle groups and movement patterns"
      );
    }

    // Analyze volume progression
    const recentVolume =
      sortedWorkouts
        .slice(-3)
        .reduce((sum, w) => sum + (w.totalVolume || 0), 0) / 3;
    const earlierVolume =
      sortedWorkouts
        .slice(0, 3)
        .reduce((sum, w) => sum + (w.totalVolume || 0), 0) / 3;

    if (recentVolume <= earlierVolume) {
      recommendations.push(
        "Your training volume has plateaued - consider progressive overload by increasing weights or reps"
      );
    }

    return recommendations;
  }

  /**
   * Calculate consistency score based on workout intervals
   * @param {Array<number>} daysBetweenWorkouts - Days between workouts
   * @returns {number} Consistency score (0-1)
   * @private
   */
  _calculateConsistencyScore(daysBetweenWorkouts) {
    if (daysBetweenWorkouts.length === 0) return 0;

    const mean =
      daysBetweenWorkouts.reduce((sum, days) => sum + days, 0) /
      daysBetweenWorkouts.length;
    const variance =
      daysBetweenWorkouts.reduce(
        (sum, days) => sum + Math.pow(days - mean, 2),
        0
      ) / daysBetweenWorkouts.length;
    const standardDeviation = Math.sqrt(variance);

    // Lower standard deviation = higher consistency
    // Normalize to 0-1 scale (assuming max reasonable std dev is 7 days)
    return Math.max(0, 1 - standardDeviation / 7);
  }

  /**
   * Calculate duration trend
   * @param {Array} workouts - Workout data
   * @returns {string} Trend direction
   * @private
   */
  _calculateDurationTrend(workouts) {
    if (workouts.length < 4) return "stable";

    const recentDurations = workouts.slice(-3).map((w) => w.duration || 0);
    const earlierDurations = workouts.slice(0, 3).map((w) => w.duration || 0);

    const recentAvg =
      recentDurations.reduce((sum, d) => sum + d, 0) / recentDurations.length;
    const earlierAvg =
      earlierDurations.reduce((sum, d) => sum + d, 0) / earlierDurations.length;

    const difference = recentAvg - earlierAvg;

    if (difference > 5) return "increasing";
    if (difference < -5) return "decreasing";
    return "stable";
  }

  /**
   * Get empty analysis structure
   * @returns {Object} Empty analysis
   * @private
   */
  _getEmptyAnalysis() {
    return {
      totalWorkouts: 0,
      dateRange: { start: null, end: null },
      exerciseFrequency: {
        totalUniqueExercises: 0,
        mostFrequent: [],
        regularExercises: [],
        recentExercises: [],
      },
      personalRecords: {
        totalRecords: 0,
        recentRecords: [],
        topPerformers: [],
      },
      trends: {
        workoutFrequency: { averageDaysBetween: 0, weeklyFrequency: 0 },
        volume: { trend: "stable" },
      },
      consistency: { score: 0, rating: "insufficient_data" },
      volume: { totalVolume: 0, averageVolume: 0, progressionRate: 0 },
      recommendations: [
        "Complete more workouts to get personalized insights and recommendations",
      ],
    };
  }

  /**
   * Enhanced plateau detection engine
   * Implements 3-session stagnation detection with severity assessment and type classification
   * @param {string} userId - User identifier
   * @returns {Promise<Array<PlateauDetection>>}
   */
  async detectPlateausAdvanced(userId) {
    try {
      this._log("Running advanced plateau detection", { userId });

      // Get recent workout history for detailed analysis
      const workoutsQuery = query(
        collection(db, "workouts"),
        where("userId", "==", userId),
        where("completed", "==", true),
        orderBy("timestamp", "desc"),
        limit(20) // Analyze more sessions for accurate plateau detection
      );

      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts = workoutsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (workouts.length < 3) {
        this._log("Insufficient workout data for plateau detection");
        return [];
      }

      // Group exercises by exerciseId
      const exerciseSessionsMap = new Map();

      workouts.forEach((workout) => {
        if (workout.exercises && Array.isArray(workout.exercises)) {
          workout.exercises.forEach((exercise) => {
            const exerciseId = exercise.exerciseId;
            // Skip exercises without valid exerciseId
            if (!exerciseId || typeof exerciseId !== "string") {
              return;
            }
            if (!exerciseSessionsMap.has(exerciseId)) {
              exerciseSessionsMap.set(exerciseId, []);
            }
            exerciseSessionsMap.get(exerciseId).push({
              date: workout.timestamp,
              workoutId: workout.id,
              ...exercise,
            });
          });
        }
      });

      const plateaus = [];

      // Analyze each exercise for plateaus
      for (const [exerciseId, sessions] of exerciseSessionsMap) {
        if (sessions.length >= 3) {
          const plateau = await this._detectExercisePlateau(
            exerciseId,
            sessions
          );
          if (plateau) {
            plateaus.push(plateau);
          }
        }
      }

      this._log("Plateau detection completed", {
        userId,
        totalExercises: exerciseSessionsMap.size,
        plateausDetected: plateaus.length,
      });

      return plateaus;
    } catch (error) {
      this._logError("Error in advanced plateau detection", error);
      throw error;
    }
  }

  /**
   * Detect plateau for a specific exercise using 3-session stagnation algorithm
   * @param {string} exerciseId - Exercise identifier
   * @param {Array} sessions - Exercise sessions sorted by date (newest first)
   * @returns {Promise<PlateauDetection|null>}
   * @private
   */
  async _detectExercisePlateau(exerciseId, sessions) {
    // Sort sessions by date (newest first)
    const sortedSessions = sessions.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    if (sortedSessions.length < 3) {
      return null;
    }

    // Analyze last 3 sessions for stagnation
    const recentSessions = sortedSessions.slice(0, 3);
    const plateauAnalysis = this._analyzeSessionsForPlateau(recentSessions);

    if (!plateauAnalysis.isPlateaued) {
      return null;
    }

    // Calculate plateau duration in sessions
    const plateauDuration = this._calculatePlateauDuration(sortedSessions);

    // Determine plateau severity
    const severity = this._assessPlateauSeverity(
      plateauDuration,
      plateauAnalysis
    );

    // Classify plateau type
    const plateauType = this._classifyPlateauType(recentSessions);

    // Get current performance metrics
    const currentMetrics = this._getCurrentPerformanceMetrics(
      recentSessions[0]
    );

    return {
      exerciseId,
      exerciseName: exerciseId
        ? exerciseId.replace("-", " ")
        : "Unknown Exercise",
      plateauDuration,
      lastProgressDate: this._findLastProgressDate(sortedSessions),
      plateauType,
      severity,
      currentWeight: currentMetrics.weight,
      currentReps: currentMetrics.reps,
      currentVolume: currentMetrics.volume,
      stagnationMetrics: plateauAnalysis.metrics,
      suggestedInterventions: [], // Will be filled by intervention system
      detectedAt: new Date(),
      confidenceLevel: this._calculatePlateauConfidence(
        plateauAnalysis,
        plateauDuration
      ),
    };
  }

  /**
   * Analyze sessions for plateau indicators using 3-session stagnation detection
   * @param {Array} sessions - Recent 3 sessions
   * @returns {Object} Plateau analysis result
   * @private
   */
  _analyzeSessionsForPlateau(sessions) {
    const metrics = sessions.map((session) => {
      const sets = session.sets || [];
      return {
        date: session.date,
        maxWeight: this._getMaxWeight(sets),
        maxReps: this._getMaxReps(sets),
        totalVolume: this._calculateTotalVolume(sets),
        averageWeight: this._getAverageWeight(sets),
        totalSets: sets.length,
      };
    });

    // Check for stagnation in weight progression
    const weightStagnation = this._checkWeightStagnation(metrics);

    // Check for stagnation in rep progression
    const repStagnation = this._checkRepStagnation(metrics);

    // Check for stagnation in volume progression
    const volumeStagnation = this._checkVolumeStagnation(metrics);

    // Determine if plateaued (any 2 of 3 metrics stagnant)
    const stagnationCount = [
      weightStagnation,
      repStagnation,
      volumeStagnation,
    ].filter(Boolean).length;
    const isPlateaued = stagnationCount >= 2;

    return {
      isPlateaued,
      metrics: {
        weight: weightStagnation,
        reps: repStagnation,
        volume: volumeStagnation,
        stagnationCount,
      },
      sessionMetrics: metrics,
    };
  }

  /**
   * Check for weight stagnation across sessions
   * @param {Array} metrics - Session metrics
   * @returns {boolean} True if weight has stagnated
   * @private
   */
  _checkWeightStagnation(metrics) {
    if (metrics.length < 3) return false;

    const weights = metrics.map((m) => m.maxWeight);
    const weightVariation = Math.max(...weights) - Math.min(...weights);

    // Consider stagnant if weight variation is less than minimum progression increment
    const minIncrement = 1.0; // 1kg minimum for any exercise
    return weightVariation < minIncrement;
  }

  /**
   * Check for rep stagnation across sessions
   * @param {Array} metrics - Session metrics
   * @returns {boolean} True if reps have stagnated
   * @private
   */
  _checkRepStagnation(metrics) {
    if (metrics.length < 3) return false;

    const reps = metrics.map((m) => m.maxReps);
    const repVariation = Math.max(...reps) - Math.min(...reps);

    // Consider stagnant if rep variation is less than 2 reps
    return repVariation < 2;
  }

  /**
   * Check for volume stagnation across sessions
   * @param {Array} metrics - Session metrics
   * @returns {boolean} True if volume has stagnated
   * @private
   */
  _checkVolumeStagnation(metrics) {
    if (metrics.length < 3) return false;

    const volumes = metrics.map((m) => m.totalVolume);
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;

    if (avgVolume === 0) return true;

    const volumeVariation =
      (Math.max(...volumes) - Math.min(...volumes)) / avgVolume;

    // Consider stagnant if volume variation is less than 5%
    return volumeVariation < 0.05;
  }

  /**
   * Calculate total volume for a set of exercise sets
   * @param {Array} sets - Exercise sets
   * @returns {number} Total volume (weight × reps × sets)
   * @private
   */
  _calculateTotalVolume(sets) {
    if (!sets || !Array.isArray(sets) || sets.length === 0) return 0;
    return sets.reduce(
      (total, set) => total + (set.weight || 0) * (set.reps || 0),
      0
    );
  }

  /**
   * Get average weight from sets
   * @param {Array} sets - Exercise sets
   * @returns {number} Average weight
   * @private
   */
  _getAverageWeight(sets) {
    if (!sets || !Array.isArray(sets) || sets.length === 0) return 0;
    const totalWeight = sets.reduce((sum, set) => sum + (set.weight || 0), 0);
    return totalWeight / sets.length;
  }

  /**
   * Calculate plateau duration in sessions
   * @param {Array} sessions - All exercise sessions
   * @returns {number} Number of sessions since last progress
   * @private
   */
  _calculatePlateauDuration(sessions) {
    let duration = 0;

    for (let i = 0; i < sessions.length - 1; i++) {
      const currentSession = sessions[i];
      const previousSession = sessions[i + 1];

      const currentMax = this._getMaxWeight(currentSession.sets || []);
      const previousMax = this._getMaxWeight(previousSession.sets || []);

      if (currentMax > previousMax) {
        // Found progress, stop counting
        break;
      }

      duration++;
    }

    return Math.max(duration, 3); // Minimum 3 sessions for plateau detection
  }

  /**
   * Assess plateau severity based on duration and metrics
   * @param {number} duration - Plateau duration in sessions
   * @param {Object} analysis - Plateau analysis
   * @returns {'mild'|'moderate'|'severe'} Severity level
   * @private
   */
  _assessPlateauSeverity(duration, analysis) {
    const stagnationCount = analysis.metrics.stagnationCount;

    // Severe: 6+ sessions OR all 3 metrics stagnant
    if (duration >= 6 || stagnationCount === 3) {
      return "severe";
    }

    // Moderate: 4-5 sessions OR 2 metrics stagnant for 3+ sessions
    if (duration >= 4 || (stagnationCount === 2 && duration >= 3)) {
      return "moderate";
    }

    // Mild: 3 sessions with limited stagnation
    return "mild";
  }

  /**
   * Classify the type of plateau based on which metrics are stagnant
   * @param {Array} sessions - Recent sessions
   * @returns {'weight'|'reps'|'volume'} Plateau type
   * @private
   */
  _classifyPlateauType(sessions) {
    const weightStagnant = this._checkWeightStagnation(
      sessions.map((s) => ({
        maxWeight: this._getMaxWeight(s.sets || []),
      }))
    );

    const repStagnant = this._checkRepStagnation(
      sessions.map((s) => ({
        maxReps: this._getMaxReps(s.sets || []),
      }))
    );

    const volumeStagnant = this._checkVolumeStagnation(
      sessions.map((s) => ({
        totalVolume: this._calculateTotalVolume(s.sets || []),
      }))
    );

    // Prioritize weight plateau as most critical
    if (weightStagnant) return "weight";
    if (volumeStagnant) return "volume";
    if (repStagnant) return "reps";

    return "weight"; // Default
  }

  /**
   * Get current performance metrics from latest session
   * @param {Object} session - Latest exercise session
   * @returns {Object} Current performance metrics
   * @private
   */
  _getCurrentPerformanceMetrics(session) {
    const sets = session.sets || [];
    return {
      weight: this._getMaxWeight(sets),
      reps: this._getMaxReps(sets),
      volume: this._calculateTotalVolume(sets),
      sets: sets.length,
    };
  }

  /**
   * Calculate confidence level for plateau detection
   * @param {Object} analysis - Plateau analysis
   * @param {number} duration - Plateau duration
   * @returns {number} Confidence level (0-1)
   * @private
   */
  _calculatePlateauConfidence(analysis, duration) {
    let confidence = 0.5; // Base confidence

    // Higher confidence with more stagnant metrics
    confidence += analysis.metrics.stagnationCount * 0.15;

    // Higher confidence with longer duration
    if (duration >= 6) confidence += 0.2;
    else if (duration >= 4) confidence += 0.1;

    // Cap at 0.95
    return Math.min(0.95, confidence);
  }

  /**
   * Assess plateau status for an exercise (legacy method - kept for compatibility)
   * @param {ProgressionAnalysis} analysis - Exercise analysis
   * @returns {PlateauDetection|null}
   * @private
   */
  _assessPlateauStatus(analysis) {
    // No plateau if we have recent progress
    if (
      analysis.lastProgressDate &&
      Date.now() - analysis.lastProgressDate.getTime() <
        21 * 24 * 60 * 60 * 1000
    ) {
      // 3 weeks
      return null;
    }

    // Determine plateau duration (estimate based on total sessions and lack of progress)
    const plateauDuration = analysis.lastProgressDate
      ? Math.floor(
          (Date.now() - analysis.lastProgressDate.getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        )
      : Math.min(analysis.totalSessions, 6);

    if (plateauDuration < 3) return null; // Not a plateau yet

    // Determine severity
    let severity = "mild";
    if (plateauDuration >= 6) severity = "severe";
    else if (plateauDuration >= 4) severity = "moderate";

    // Determine plateau type
    let plateauType = "weight";
    if (analysis.progressionTrend === "declining") plateauType = "volume";

    return {
      exerciseId: analysis.exerciseId,
      exerciseName: analysis.exerciseName,
      plateauDuration,
      lastProgressDate: analysis.lastProgressDate,
      plateauType,
      severity,
      suggestedInterventions: [], // Will be filled by suggestPlateauInterventions
      currentWeight: analysis.currentWeight,
    };
  }

  /**
   * Create plateau warning notifications for detected plateaus
   * @param {string} userId - User identifier
   * @param {Array<PlateauDetection>} plateaus - Detected plateaus
   * @returns {Promise<Array<PlateauAlert>>} Created alerts
   */
  async createPlateauWarningNotifications(userId, plateaus) {
    try {
      this._log("Creating plateau warning notifications", {
        userId,
        plateauCount: plateaus.length,
      });

      const alerts = [];
      const notificationSettings = await this._getNotificationSettings(userId);

      if (!notificationSettings.enabled) {
        this._log("Notifications disabled for user", { userId });
        return [];
      }

      for (const plateau of plateaus) {
        // Check if we should create an alert for this plateau
        if (this._shouldCreateAlert(plateau, notificationSettings)) {
          const alert = await this._createPlateauAlert(
            userId,
            plateau,
            notificationSettings
          );
          if (alert) {
            alerts.push(alert);
          }
        }
      }

      // Save alerts to Firestore
      if (alerts.length > 0) {
        await this._savePlateauAlerts(userId, alerts);
      }

      this._log("Created plateau warning notifications", {
        userId,
        alertsCreated: alerts.length,
      });

      return alerts;
    } catch (error) {
      this._logError("Error creating plateau warning notifications", error);
      throw error;
    }
  }

  /**
   * Get active plateau alerts for a user
   * @param {string} userId - User identifier
   * @returns {Promise<Array<PlateauAlert>>} Active alerts
   */
  async getActivePlateauAlerts(userId) {
    try {
      const alertsDoc = await getDoc(doc(db, "aiSuggestions", userId));

      if (!alertsDoc.exists()) {
        return [];
      }

      const data = alertsDoc.data();
      const plateauAlerts = data.plateauAlerts || [];

      // Filter for active alerts only
      const activeAlerts = plateauAlerts.filter(
        (alert) => alert.status === "active" && !alert.dismissed
      );

      // Check if any alerts need to be shown again based on timing
      const alertsToShow = [];
      const now = new Date();

      for (const alert of activeAlerts) {
        if (this._shouldShowAlert(alert, now)) {
          alertsToShow.push(alert);
        }
      }

      return alertsToShow;
    } catch (error) {
      this._logError("Error getting active plateau alerts", error);
      throw error;
    }
  }

  /**
   * Acknowledge a plateau alert
   * @param {string} userId - User identifier
   * @param {string} alertId - Alert identifier
   * @returns {Promise<boolean>} Success status
   */
  async acknowledgePlateauAlert(userId, alertId) {
    try {
      this._log("Acknowledging plateau alert", { userId, alertId });

      const alertsDoc = await getDoc(doc(db, "aiSuggestions", userId));

      if (!alertsDoc.exists()) {
        return false;
      }

      const data = alertsDoc.data();
      const plateauAlerts = data.plateauAlerts || [];

      // Find and update the alert
      const alertIndex = plateauAlerts.findIndex(
        (alert) => alert.id === alertId
      );

      if (alertIndex === -1) {
        this._log("Alert not found", { userId, alertId });
        return false;
      }

      plateauAlerts[alertIndex] = {
        ...plateauAlerts[alertIndex],
        acknowledged: true,
        status: "acknowledged",
        lastShown: new Date(),
      };

      // Update Firestore
      await updateDoc(doc(db, "aiSuggestions", userId), {
        plateauAlerts,
        lastUpdated: serverTimestamp(),
      });

      this._log("Plateau alert acknowledged", { userId, alertId });
      return true;
    } catch (error) {
      this._logError("Error acknowledging plateau alert", error);
      throw error;
    }
  }

  /**
   * Dismiss a plateau alert
   * @param {string} userId - User identifier
   * @param {string} alertId - Alert identifier
   * @param {string} reason - Dismissal reason
   * @returns {Promise<boolean>} Success status
   */
  async dismissPlateauAlert(userId, alertId, reason = "user_dismissed") {
    try {
      this._log("Dismissing plateau alert", { userId, alertId, reason });

      const alertsDoc = await getDoc(doc(db, "aiSuggestions", userId));

      if (!alertsDoc.exists()) {
        return false;
      }

      const data = alertsDoc.data();
      const plateauAlerts = data.plateauAlerts || [];

      // Find and update the alert
      const alertIndex = plateauAlerts.findIndex(
        (alert) => alert.id === alertId
      );

      if (alertIndex === -1) {
        this._log("Alert not found", { userId, alertId });
        return false;
      }

      plateauAlerts[alertIndex] = {
        ...plateauAlerts[alertIndex],
        dismissed: true,
        dismissedAt: new Date(),
        dismissalReason: reason,
        status: "dismissed",
      };

      // Update Firestore
      await updateDoc(doc(db, "aiSuggestions", userId), {
        plateauAlerts,
        lastUpdated: serverTimestamp(),
      });

      this._log("Plateau alert dismissed", { userId, alertId });
      return true;
    } catch (error) {
      this._logError("Error dismissing plateau alert", error);
      throw error;
    }
  }

  /**
   * Get notification settings for a user
   * @param {string} userId - User identifier
   * @returns {Promise<NotificationSettings>} Notification settings
   * @private
   */
  async _getNotificationSettings(userId) {
    try {
      const profileData = await aiFirestoreService.getUserProgressionProfile(
        userId
      );

      const defaultSettings = {
        enabled: true,
        frequency: 24, // 24 hours between repeated notifications
        severityLevels: ["moderate", "severe"], // Don't notify for mild plateaus by default
        showInterventions: true,
        maxShowCount: 3, // Maximum 3 times to show same alert
      };

      if (!profileData || !profileData.notificationSettings) {
        return defaultSettings;
      }

      return {
        ...defaultSettings,
        ...profileData.notificationSettings,
      };
    } catch (error) {
      this._logError("Error getting notification settings", error);
      return {
        enabled: true,
        frequency: 24,
        severityLevels: ["moderate", "severe"],
        showInterventions: true,
        maxShowCount: 3,
      };
    }
  }

  /**
   * Check if an alert should be created for a plateau
   * @param {PlateauDetection} plateau - Plateau data
   * @param {NotificationSettings} settings - Notification settings
   * @returns {boolean} Whether to create alert
   * @private
   */
  _shouldCreateAlert(plateau, settings) {
    // Check if severity level is enabled
    if (!settings.severityLevels.includes(plateau.severity)) {
      return false;
    }

    // Always create alerts for severe plateaus
    if (plateau.severity === "severe") {
      return true;
    }

    // For moderate plateaus, check duration
    if (plateau.severity === "moderate" && plateau.plateauDuration >= 4) {
      return true;
    }

    // For mild plateaus, only if duration is significant
    if (plateau.severity === "mild" && plateau.plateauDuration >= 5) {
      return true;
    }

    return false;
  }

  /**
   * Create a plateau alert
   * @param {string} userId - User identifier
   * @param {PlateauDetection} plateau - Plateau data
   * @param {NotificationSettings} settings - Notification settings
   * @returns {Promise<PlateauAlert>} Created alert
   * @private
   */
  async _createPlateauAlert(userId, plateau, settings) {
    const alertId = `plateau_${plateau.exerciseId}_${Date.now()}`;

    // Generate interventions if enabled
    let interventions = [];
    if (settings.showInterventions) {
      interventions = await this.suggestPlateauInterventions(plateau);
      // Limit to top 3 interventions for notification
      interventions = interventions.slice(0, 3);
    }

    // Create alert message
    const message = this._generateAlertMessage(plateau);

    return {
      id: alertId,
      userId,
      exerciseId: plateau.exerciseId,
      exerciseName: plateau.exerciseName,
      severity: plateau.severity,
      message,
      interventions,
      createdAt: new Date(),
      lastShown: null,
      acknowledged: false,
      dismissed: false,
      dismissedAt: null,
      showCount: 0,
      status: "active",
      plateauDuration: plateau.plateauDuration,
      currentWeight: plateau.currentWeight,
    };
  }

  /**
   * Generate alert message based on plateau data
   * @param {PlateauDetection} plateau - Plateau data
   * @returns {string} Alert message
   * @private
   */
  _generateAlertMessage(plateau) {
    const exerciseName = plateau.exerciseName;
    const duration = plateau.plateauDuration;

    switch (plateau.severity) {
      case "severe":
        return `⚠️ Severe plateau detected in ${exerciseName}. No progress for ${duration} sessions. Immediate intervention recommended.`;

      case "moderate":
        return `⚡ Plateau detected in ${exerciseName}. ${duration} sessions without progress. Consider adjusting your approach.`;

      case "mild":
        return `📊 Progress has slowed in ${exerciseName}. ${duration} sessions at current level. Time to mix things up?`;

      default:
        return `Plateau detected in ${exerciseName} after ${duration} sessions.`;
    }
  }

  /**
   * Check if an alert should be shown based on timing and frequency
   * @param {PlateauAlert} alert - Alert data
   * @param {Date} now - Current time
   * @returns {boolean} Whether to show alert
   * @private
   */
  _shouldShowAlert(alert, now) {
    // Don't show if already at max show count
    if (alert.showCount >= 3) {
      // Default max show count
      return false;
    }

    // Show if never shown before
    if (!alert.lastShown) {
      return true;
    }

    // Check frequency (default 24 hours)
    const hoursSinceLastShown =
      (now - new Date(alert.lastShown)) / (1000 * 60 * 60);
    const frequency = 24; // Default frequency

    return hoursSinceLastShown >= frequency;
  }

  /**
   * Save plateau alerts to Firestore
   * @param {string} userId - User identifier
   * @param {Array<PlateauAlert>} alerts - Alerts to save
   * @returns {Promise<void>}
   * @private
   */
  async _savePlateauAlerts(userId, alerts) {
    try {
      // Get existing alerts
      const alertsDoc = await getDoc(doc(db, "aiSuggestions", userId));
      let existingAlerts = [];

      if (alertsDoc.exists()) {
        const data = alertsDoc.data();
        existingAlerts = data.plateauAlerts || [];
      }

      // Merge new alerts with existing ones
      const allAlerts = [...existingAlerts, ...alerts];

      // Remove duplicates and old alerts (keep last 20)
      const uniqueAlerts = this._deduplicateAlerts(allAlerts).slice(0, 20);

      // Save to Firestore
      await setDoc(
        doc(db, "aiSuggestions", userId),
        {
          plateauAlerts: uniqueAlerts,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      this._logError("Error saving plateau alerts", error);
      throw error;
    }
  }

  /**
   * Remove duplicate alerts and keep most recent
   * @param {Array<PlateauAlert>} alerts - All alerts
   * @returns {Array<PlateauAlert>} Deduplicated alerts
   * @private
   */
  _deduplicateAlerts(alerts) {
    const alertMap = new Map();

    // Group by exercise ID, keeping most recent
    alerts.forEach((alert) => {
      const key = alert.exerciseId;
      if (
        !alertMap.has(key) ||
        new Date(alert.createdAt) > new Date(alertMap.get(key).createdAt)
      ) {
        alertMap.set(key, alert);
      }
    });

    return Array.from(alertMap.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  /**
   * Track suggestion interaction for learning and effectiveness measurement
   * @param {string} userId - User identifier
   * @param {string} exerciseId - Exercise identifier
   * @param {'accepted'|'dismissed'} action - User action
   * @param {Object} metadata - Additional interaction data
   * @returns {Promise<void>}
   */
  async trackSuggestionInteraction(userId, exerciseId, action, metadata = {}) {
    try {
      this._log("Tracking suggestion interaction", {
        userId,
        exerciseId,
        action,
      });

      const interactionData = {
        userId,
        exerciseId,
        action,
        timestamp: new Date(),
        metadata,
        modelVersion: this.config.modelVersion,
      };

      // Save to AI suggestions collection for tracking
      await aiFirestoreService.trackSuggestionInteraction(
        userId,
        interactionData
      );

      // Update suggestion effectiveness metrics
      if (action === "accepted") {
        await this._updateSuggestionEffectiveness(
          userId,
          exerciseId,
          "accepted"
        );
      } else if (action === "dismissed") {
        await this._updateSuggestionEffectiveness(
          userId,
          exerciseId,
          "dismissed"
        );
      }

      this._log("Suggestion interaction tracked successfully", {
        exerciseId,
        action,
      });
    } catch (error) {
      this._logError("Error tracking suggestion interaction", error);
      // Don't throw error to avoid breaking user flow
    }
  }

  /**
   * Update suggestion effectiveness metrics for learning
   * @param {string} userId - User identifier
   * @param {string} exerciseId - Exercise identifier
   * @param {'accepted'|'dismissed'} action - User action
   * @returns {Promise<void>}
   * @private
   */
  async _updateSuggestionEffectiveness(userId, exerciseId, action) {
    try {
      // Get current user progression profile
      const profile = await this._getUserProgressionProfile(userId);

      // Update effectiveness metrics
      const currentMetrics = profile.performanceMetrics || {};
      const suggestionStats = currentMetrics.suggestionStats || {
        totalSuggestions: 0,
        acceptedSuggestions: 0,
        dismissedSuggestions: 0,
        acceptanceRate: 0,
      };

      suggestionStats.totalSuggestions += 1;

      if (action === "accepted") {
        suggestionStats.acceptedSuggestions += 1;
      } else if (action === "dismissed") {
        suggestionStats.dismissedSuggestions += 1;
      }

      suggestionStats.acceptanceRate =
        suggestionStats.totalSuggestions > 0
          ? suggestionStats.acceptedSuggestions /
            suggestionStats.totalSuggestions
          : 0;

      // Update the profile with new metrics
      const updatedMetrics = {
        ...currentMetrics,
        suggestionStats,
      };

      await aiFirestoreService.updatePerformanceMetrics(userId, updatedMetrics);

      this._log("Suggestion effectiveness updated", {
        userId,
        exerciseId,
        action,
        acceptanceRate: suggestionStats.acceptanceRate,
      });
    } catch (error) {
      this._logError("Error updating suggestion effectiveness", error);
    }
  }

  /**
   * Get suggestion effectiveness metrics for a user
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Effectiveness metrics
   */
  async getSuggestionEffectiveness(userId) {
    try {
      const profile = await this._getUserProgressionProfile(userId);
      const suggestionStats = profile.performanceMetrics?.suggestionStats || {
        totalSuggestions: 0,
        acceptedSuggestions: 0,
        dismissedSuggestions: 0,
        acceptanceRate: 0,
      };

      return {
        ...suggestionStats,
        effectivenessScore: this._calculateEffectivenessScore(suggestionStats),
        recommendations:
          this._generateEffectivenessRecommendations(suggestionStats),
      };
    } catch (error) {
      this._logError("Error getting suggestion effectiveness", error);
      return {
        totalSuggestions: 0,
        acceptedSuggestions: 0,
        dismissedSuggestions: 0,
        acceptanceRate: 0,
        effectivenessScore: 0,
        recommendations: [],
      };
    }
  }

  /**
   * Calculate effectiveness score based on user interactions
   * @param {Object} suggestionStats - Suggestion statistics
   * @returns {number} Effectiveness score (0-1)
   * @private
   */
  _calculateEffectivenessScore(suggestionStats) {
    if (suggestionStats.totalSuggestions === 0) return 0;

    const acceptanceWeight = 0.7;
    const volumeWeight = 0.3;

    const acceptanceScore = suggestionStats.acceptanceRate;
    const volumeScore = Math.min(suggestionStats.totalSuggestions / 20, 1); // Max score at 20 suggestions

    return acceptanceScore * acceptanceWeight + volumeScore * volumeWeight;
  }

  /**
   * Generate recommendations based on effectiveness metrics
   * @param {Object} suggestionStats - Suggestion statistics
   * @returns {Array<string>} Recommendations
   * @private
   */
  _generateEffectivenessRecommendations(suggestionStats) {
    const recommendations = [];

    if (suggestionStats.acceptanceRate < 0.3) {
      recommendations.push(
        "Consider adjusting AI suggestion sensitivity to better match your preferences"
      );
    }

    if (
      suggestionStats.acceptanceRate > 0.8 &&
      suggestionStats.totalSuggestions > 10
    ) {
      recommendations.push(
        "AI suggestions are working well for you! Consider enabling more advanced features"
      );
    }

    if (suggestionStats.totalSuggestions < 5) {
      recommendations.push(
        "Complete more workouts to improve AI suggestion accuracy"
      );
    }

    return recommendations;
  }

  /**
   * Log debug information
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @private
   */
  _log(message, data = {}) {
    if (this.config.enableLogging) {
      console.log(`[ProgressiveOverloadAI] ${message}`, data);
    }
  }

  /**
   * Log error information
   * @param {string} message - Error message
   * @param {Error} error - Error object
   * @private
   */
  _logError(message, error) {
    console.error(`[ProgressiveOverloadAI] ${message}`, error);
  }

  // ==================== Hybrid AI Helper Methods ====================

  /**
   * Get recent workout history for AI analysis
   * @param {string} userId - User identifier
   * @param {number} limit - Number of recent workouts
   * @returns {Promise<Array>} Recent workout data
   * @private
   */
  async _getRecentWorkoutHistory(userId, limitCount = 5) {
    try {
      this._log("Getting recent workout history", { userId, limitCount });

      // Validate parameters
      if (!userId || typeof userId !== "string") {
        throw new Error(`Invalid userId: ${userId}`);
      }

      if (!limitCount || typeof limitCount !== "number" || limitCount <= 0) {
        this._log("Invalid limit count, using default", { limitCount });
        limitCount = 5;
      }

      const workoutsQuery = query(
        collection(db, "workouts"),
        where("userId", "==", userId),
        where("completed", "==", true),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );

      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts = workoutsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      this._log("Retrieved workout history", {
        userId,
        workoutCount: workouts.length,
        sampleWorkout: workouts[0]
          ? {
              id: workouts[0].id,
              timestamp: workouts[0].timestamp,
              exerciseCount: workouts[0].exercises?.length || 0,
            }
          : null,
      });

      return workouts;
    } catch (error) {
      this._logError("Error getting workout history", error);
      this._log("Workout history query failed", {
        userId,
        limitCount,
        errorMessage: error.message,
        errorStack: error.stack,
      });
      return [];
    }
  }

  /**
   * Combine rule-based and Gemini AI progression suggestions
   * @param {ProgressionSuggestion} ruleBasedSuggestion - Rule-based suggestion
   * @param {Object} geminiSuggestion - Gemini AI suggestion
   * @returns {ProgressionSuggestion} Combined suggestion
   * @private
   */
  _combineProgressionSuggestions(ruleBasedSuggestion, geminiSuggestion) {
    const rulePriority = 1 - this.config.geminiPriority; // e.g., 0.6
    const geminiPriority = this.config.geminiPriority; // e.g., 0.4

    // Combine confidence scores
    const combinedConfidence =
      ruleBasedSuggestion.confidenceLevel * rulePriority +
      (geminiSuggestion.primarySuggestion?.confidence || 0.5) * geminiPriority;

    // Use Gemini's reasoning if available, otherwise rule-based
    const reasoning =
      geminiSuggestion.primarySuggestion?.reasoning ||
      ruleBasedSuggestion.reasoning;

    // Combine suggestions intelligently
    return {
      ...ruleBasedSuggestion,
      confidenceLevel: Math.min(combinedConfidence, 0.95),
      reasoning: `${reasoning} (AI-Enhanced)`,
      alternativeOptions: [
        ...(ruleBasedSuggestion.alternativeOptions || []),
        ...(geminiSuggestion.alternatives || []).map((alt) => ({
          weight: ruleBasedSuggestion.currentWeight,
          reps: ruleBasedSuggestion.suggestedReps,
          reasoning: alt.description,
        })),
      ],
      personalizedTips: geminiSuggestion.personalizedTips || [],
      riskFactors: geminiSuggestion.primarySuggestion?.riskFactors || [],
      aiEnhanced: true,
      geminiInsights: geminiSuggestion.primarySuggestion || null,
    };
  }

  /**
   * Enhance rule-based suggestion with additional context
   * @param {ProgressionSuggestion} ruleBasedSuggestion - Rule-based suggestion
   * @param {ProgressionAnalysis} analysis - Exercise analysis
   * @returns {ProgressionSuggestion} Enhanced suggestion
   * @private
   */
  _enhanceRuleBasedSuggestion(ruleBasedSuggestion, analysis) {
    return {
      ...ruleBasedSuggestion,
      reasoning: `${ruleBasedSuggestion.reasoning} (Based on ${analysis.totalSessions} sessions of data)`,
      personalizedTips: this._generateBasicTips(analysis),
      riskFactors: this._assessBasicRiskFactors(analysis),
      aiEnhanced: false,
    };
  }

  /**
   * Generate rule-based interventions (refactored from existing methods)
   * @param {PlateauDetection} plateauData - Plateau information
   * @returns {Promise<Array<InterventionSuggestion>>} Rule-based interventions
   * @private
   */
  async _generateRuleBasedInterventions(plateauData) {
    const interventions = [];

    // Generate deload recommendations
    const deloadSuggestion = this.calculateDeloadIntervention(plateauData);
    if (deloadSuggestion) {
      interventions.push(deloadSuggestion);
    }

    // Generate rep range modification suggestions
    const repRangeSuggestions = this.generateRepRangeModifications(plateauData);
    interventions.push(...repRangeSuggestions);

    // Generate exercise variation recommendations
    const variationSuggestions =
      await this.generateExerciseVariationRecommendations(plateauData);
    interventions.push(...variationSuggestions);

    // Add severity-specific interventions
    const severityInterventions =
      this._generateSeveritySpecificInterventions(plateauData);
    interventions.push(...severityInterventions);

    return interventions;
  }

  /**
   * Combine rule-based and Gemini intervention suggestions
   * @param {Array<InterventionSuggestion>} ruleBasedInterventions - Rule-based interventions
   * @param {Object} geminiInterventions - Gemini AI interventions
   * @returns {Array<InterventionSuggestion>} Combined interventions
   * @private
   */
  _combineInterventionSuggestions(ruleBasedInterventions, geminiInterventions) {
    const combined = [...ruleBasedInterventions];

    // Add Gemini interventions that don't duplicate existing ones
    if (geminiInterventions.interventions) {
      geminiInterventions.interventions.forEach((geminiIntervention) => {
        // Check if this type of intervention already exists
        const existingIntervention = combined.find(
          (existing) => existing.type === geminiIntervention.type
        );

        if (!existingIntervention) {
          combined.push({
            ...geminiIntervention,
            aiGenerated: true,
            priority: this._calculateInterventionPriority(
              geminiIntervention,
              {}
            ),
          });
        } else {
          // Enhance existing intervention with AI insights
          existingIntervention.reasoning = `${existingIntervention.reasoning} | AI Insight: ${geminiIntervention.reasoning}`;
          existingIntervention.aiEnhanced = true;
        }
      });
    }

    return combined;
  }

  /**
   * Get past interventions for a user and exercise
   * @param {string} userId - User identifier
   * @param {string} exerciseId - Exercise identifier
   * @returns {Promise<Array>} Past interventions
   * @private
   */
  async _getPastInterventions(userId, exerciseId) {
    try {
      const suggestions = await aiFirestoreService.getAISuggestions(userId);
      if (!suggestions || !suggestions.interactions) {
        return [];
      }

      return suggestions.interactions
        .filter(
          (interaction) =>
            interaction.exerciseId === exerciseId &&
            interaction.action === "accepted" &&
            interaction.metadata?.interventionType
        )
        .map((interaction) => ({
          type: interaction.metadata.interventionType,
          dateUsed: interaction.timestamp,
          effectiveness: interaction.metadata.effectiveness || "unknown",
        }));
    } catch (error) {
      this._logError("Error getting past interventions", error);
      return [];
    }
  }

  /**
   * Generate basic tips for rule-based suggestions
   * @param {ProgressionAnalysis} analysis - Exercise analysis
   * @returns {Array<string>} Basic tips
   * @private
   */
  _generateBasicTips(analysis) {
    const tips = [];

    if (analysis.confidenceLevel < 0.7) {
      tips.push("Focus on consistent form and full range of motion");
    }

    if (analysis.progressionTrend === "improving") {
      tips.push("Great progress! Maintain current trajectory");
    } else if (analysis.progressionTrend === "maintaining") {
      tips.push("Consider varying your approach to break through");
    }

    const isCompound = this.compoundExercises.includes(analysis.exerciseId);
    if (isCompound) {
      tips.push("Ensure adequate rest between sets (2-3 minutes)");
    } else {
      tips.push("Focus on mind-muscle connection and controlled tempo");
    }

    return tips;
  }

  /**
   * Assess basic risk factors for rule-based suggestions
   * @param {ProgressionAnalysis} analysis - Exercise analysis
   * @returns {Array<string>} Risk factors
   * @private
   */
  _assessBasicRiskFactors(analysis) {
    const risks = [];

    if (analysis.progressionTrend === "declining") {
      risks.push("Potential overreaching - consider deload");
    }

    if (analysis.confidenceLevel < 0.5) {
      risks.push("Insufficient data - suggestions may be less accurate");
    }

    if (analysis.totalSessions < 3) {
      risks.push("Limited history - start conservatively");
    }

    return risks;
  }

  /**
   * Generate workout suggestions using hybrid AI approach
   * @param {string} userId - User identifier
   * @param {Object} workoutContext - Workout context
   * @returns {Promise<Array<WorkoutSuggestion>>} AI-generated workout suggestions
   */
  async generateWorkoutSuggestions(userId, workoutContext) {
    try {
      this._log("Generating workout suggestions", { userId, workoutContext });

      // Get user data for personalization
      const userProfile = await this._getUserProgressionProfile(userId);
      const recentWorkouts = await this._getRecentWorkoutHistory(userId, 3);
      const analyses = await this.analyzeWorkoutHistory(userId);

      // Use Gemini AI for intelligent workout planning
      if (this.config.useGeminiAI && analyses.length > 0) {
        this._log("Using Gemini AI for workout suggestions", {
          analysisCount: analyses.length,
        });
        const geminiResult =
          await geminiAIService.generateBatchProgressionSuggestions(
            analyses,
            userProfile,
            recentWorkouts
          );

        // Transform Gemini suggestions to the required format
        return geminiResult.suggestions.map((suggestion) => ({
          ...suggestion,
          confidenceLevel: suggestion.confidence,
          suggestedWeight: suggestion.suggestedWeight || 0,
          suggestedReps: suggestion.suggestedReps || 10,
          suggestedSets: suggestion.suggestedSets || 3,
        }));
      }

      // Fallback to rule-based suggestions if Gemini is disabled or no analysis
      this._log("Using rule-based workout suggestions", {
        geminiEnabled: this.config.useGeminiAI,
        analysisCount: analyses.length,
      });

      // Use rule-based suggestions
      return this._generateRuleBasedWorkoutSuggestions(
        analyses,
        workoutContext
      );
    } catch (error) {
      this._logError("Error generating workout suggestions", error);
      return [];
    }
  }

  /**
   * Calculate progressive weight based on analysis
   * @param {string} exerciseId - Exercise identifier
   * @param {Array} analyses - Exercise analyses
   * @returns {number} Suggested weight
   * @private
   */
  _calculateProgressiveWeight(exerciseId, analyses) {
    const exerciseAnalysis = analyses.find((a) => a.exerciseId === exerciseId);
    if (!exerciseAnalysis) return 20; // Default weight

    const isCompound = this.compoundExercises.includes(exerciseId);
    const baseIncrease = isCompound ? 2.5 : 1.0;

    return exerciseAnalysis.currentWeight > 0
      ? exerciseAnalysis.currentWeight + baseIncrease
      : 20;
  }

  /**
   * Generate rule-based workout suggestions
   * @param {Array} analyses - Exercise analyses
   * @param {Object} workoutContext - Workout context
   * @returns {Array<WorkoutSuggestion>} Rule-based suggestions
   * @private
   */
  _generateRuleBasedWorkoutSuggestions(analyses, workoutContext) {
    const exerciseLimit = workoutContext?.maxExercises || 5;
    const timeBasedReps = workoutContext?.availableTime < 45 ? 6 : 8;

    return analyses.slice(0, exerciseLimit).map((analysis) => ({
      exerciseId: analysis.exerciseId,
      exerciseName: analysis.exerciseName,
      suggestedWeight: this._calculateProgressiveWeight(
        analysis.exerciseId,
        analyses
      ),
      suggestedReps: timeBasedReps,
      suggestedSets: workoutContext?.quickWorkout ? 2 : 3,
      restTime: this.compoundExercises.includes(analysis.exerciseId) ? 120 : 90,
      priority: analysis.confidenceLevel >= 0.7 ? "high" : "medium",
      reasoning: `Based on ${analysis.totalSessions} sessions of data`,
      aiGenerated: false,
    }));
  }
}

// Export singleton instance
export default new ProgressiveOverloadAIService({
  enableLogging: import.meta.env?.MODE === "development" || false,
});

// Export class for testing
export { ProgressiveOverloadAIService };
