/**
 * @fileoverview Progressive Overload AI Service
 * Provides intelligent workout progression recommendations, plateau detection,
 * and adaptive training suggestions based on user workout history and performance patterns.
 */

import aiDatabaseService from "./aiDatabaseService";
import aiProviderService from "./aiProviderService";
import { normalizeAIProviderOptions } from "../config/aiProviderConfig";
import { listWorkouts } from "./workoutRepository";
import {
  calculateSubstitutionConfidence,
  calculateSubstitutionWeight,
  generateExerciseSubstitutions,
  getExerciseDifficulty,
  getExerciseEquipment,
  getSubstitutionBenefits,
  getSubstitutionReason,
} from "./progressiveOverload/substitutionEngine";
import {
  analyzeConsistency,
  analyzeExerciseFrequency,
  analyzePersonalRecords,
  analyzeTrends,
  analyzeVolumeProgression,
  calculateConsistencyScore,
  calculateDurationTrend,
  generateHistoryBasedRecommendations,
  getEmptyWorkoutAnalysis,
} from "./progressiveOverload/historyAnalytics";
import {
  calculateConfidenceLevel,
  calculateProgressionAnalysis,
  calculateProgressionRate,
  calculateProgressionTrend,
  findLastProgressDate,
  generateAlternativeOptions,
  generateProgressionSuggestion,
  getMaxReps,
  getMaxWeight,
} from "./progressiveOverload/progressionEngine";
import {
  analyzeSessionsForPlateau,
  assessPlateauSeverity,
  calculatePlateauConfidence,
  calculatePlateauDuration,
  calculateTotalVolume,
  checkRepStagnation,
  checkVolumeStagnation,
  checkWeightStagnation,
  classifyPlateauType,
  getAverageWeight,
  getCurrentPerformanceMetrics,
} from "./progressiveOverload/plateauAnalysis";
import {
  calculateDeloadDuration,
  calculateDeloadPercentage,
  calculateInterventionEffectiveness,
  calculateTransferWeight,
  getExerciseVariations,
  getMinimumWeight,
  getReplacementExercises,
  prioritizeInterventions,
} from "./progressiveOverload/plateauInterventions";

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
  setSupabase(supabaseClient) {
    this.supabase = supabaseClient;
    aiProviderService.setSupabase(supabaseClient);
  }

  /**
   * Initialize the AI service
   * @param {Object} config - Service configuration
   * @param {boolean} config.enableLogging - Enable debug logging
   * @param {string} config.modelVersion - AI model version
   */
  constructor(config = {}) {
    const providerOptions = normalizeAIProviderOptions(config);
    this.config = {
      enableLogging: config.enableLogging || false,
      modelVersion: config.modelVersion || "1.0.0",
      // Progression constants
      compoundWeightIncrease: 2.5, // kg
      isolationWeightIncrease: 1.0, // kg
      plateauThreshold: 3, // sessions
      deloadPercentage: 0.1, // 10%
      confidenceThreshold: 0.7,
      // Generative AI integration
      hybridMode: config.hybridMode !== false, // Use both rule-based and AI
      ...config,
      useAIProvider: providerOptions.useAIProvider,
      providerPriority: providerOptions.providerPriority,
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

      // Fetch workouts to extract flattened exercises in Postgres
      const workouts = await listWorkouts({
        supabase: this.supabase,
        userId,
        columns: 'id, timestamp, exercises',
        limit: 20,
      });

      const exercises = [];
      workouts.forEach(workout => {
        if (workout.exercises && Array.isArray(workout.exercises)) {
          workout.exercises.forEach((ex, idx) => {
             exercises.push({
               ...ex,
               id: `${workout.id}_${idx}`,
               timestamp: workout.timestamp
             });
          });
        }
      });

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
        // Support both "exerciseName" (AI service) and "name" (saved workout shape)
        const exerciseKey = exercise.exerciseName || exercise.name;
        if (!exerciseKey || typeof exerciseKey !== "string") {
          continue;
        }
        if (exercise.exercise_type === 'cardio') {
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

      // Step 2: Use the generative provider for enhanced intelligence (when enabled)
      if (this.config.useAIProvider) {
        try {
          const workoutHistory = await this._getRecentWorkoutHistory(userId, 5);
          const providerSuggestion =
            await aiProviderService.generateProgressionSuggestions(
              analysis,
              userProfile,
              workoutHistory
            );

          // Step 3: Combine both suggestions intelligently
          return this._combineProgressionSuggestions(
            ruleBasedSuggestion,
            providerSuggestion
          );
        } catch (error) {
          this._log("Generative AI unavailable, using rule-based suggestion", {
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
    void userProfile;
    return generateExerciseSubstitutions(originalAnalysis, reason);
  }

  /**
   * Calculate suggested weight for exercise substitution
   * @param {ProgressionAnalysis} originalAnalysis - Original exercise analysis
   * @param {string} alternativeExercise - Alternative exercise name
   * @returns {number} Suggested weight
   * @private
   */
  _calculateSubstitutionWeight(originalAnalysis, alternativeExercise) {
    return calculateSubstitutionWeight(originalAnalysis, alternativeExercise);
  }

  /**
   * Calculate confidence level for exercise substitution
   * @param {ProgressionAnalysis} originalAnalysis - Original exercise analysis
   * @param {string} alternativeExercise - Alternative exercise name
   * @returns {number} Confidence level (0-1)
   * @private
   */
  _calculateSubstitutionConfidence(originalAnalysis, alternativeExercise) {
    return calculateSubstitutionConfidence(originalAnalysis, alternativeExercise);
  }

  /**
   * Get substitution reason text
   * @param {string} reason - Reason code
   * @param {string} alternative - Alternative exercise
   * @returns {string} Reason text
   * @private
   */
  _getSubstitutionReason(reason, alternative) {
    return getSubstitutionReason(reason, alternative);
  }

  /**
   * Get substitution benefits
   * @param {string} alternative - Alternative exercise
   * @param {string} reason - Reason for substitution
   * @returns {Array<string>} Benefits list
   * @private
   */
  _getSubstitutionBenefits(alternative) {
    return getSubstitutionBenefits(alternative);
  }

  /**
   * Get exercise difficulty level
   * @param {string} exercise - Exercise name
   * @returns {string} Difficulty level
   * @private
   */
  _getExerciseDifficulty(exercise) {
    return getExerciseDifficulty(exercise);
  }

  /**
   * Get exercise equipment requirements
   * @param {string} exercise - Exercise name
   * @returns {string} Equipment type
   * @private
   */
  _getExerciseEquipment(exercise) {
    return getExerciseEquipment(exercise);
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

      // Step 3: Use a single provider call for all exercises (when enabled)
      if (this.config.useAIProvider && exerciseIds.length > 0) {
        try {
          const workoutHistory = await this._getRecentWorkoutHistory(userId, 5);
          const batchProviderSuggestion =
            await aiProviderService.generateBatchProgressionSuggestions(
              analyses,
              userProfile,
              workoutHistory
            );

          // Step 4: Combine batch suggestions
          return ruleBasedSuggestions.map((ruleSuggestion, index) => {
            const providerSuggestion = batchProviderSuggestion.suggestions?.[index];
            if (providerSuggestion) {
              return this._combineProgressionSuggestions(ruleSuggestion, {
                primarySuggestion: providerSuggestion,
              });
            }
            return this._enhanceRuleBasedSuggestion(
              ruleSuggestion,
              analyses[index]
            );
          });
        } catch (error) {
          this._log(
            "Generative AI unavailable for batch, using rule-based suggestions",
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
      let profile = await aiDatabaseService.getUserProgressionProfile(this.supabase, userId);

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

      await aiDatabaseService.saveUserProgressionProfile(
        this.supabase,
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
    // Fetch recent workouts from Supabase to extract exercises
    const workouts = await listWorkouts({
      supabase: this.supabase,
      userId,
      columns: 'id, timestamp, exercises',
      limit: 20,
    });

    const allExercises = [];
    workouts.forEach(workout => {
      if (workout.exercises && Array.isArray(workout.exercises)) {
        workout.exercises.forEach((ex, idx) => {
           allExercises.push({
             ...ex,
             id: `${workout.id}_${idx}`,
             date: workout.timestamp,
             timestamp: workout.timestamp
           });
        });
      }
    });

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
    return calculateProgressionAnalysis(exerciseId, sessions);
  }

  /**
   * Get maximum weight from sets
   * @param {Array} sets - Exercise sets
   * @returns {number}
   * @private
   */
  _getMaxWeight(sets) {
    return getMaxWeight(sets);
  }

  /**
   * Get maximum reps from sets
   * @param {Array} sets - Exercise sets
   * @returns {number}
   * @private
   */
  _getMaxReps(sets) {
    return getMaxReps(sets);
  }

  /**
   * Calculate progression trend
   * @param {Array} sessions - Exercise sessions
   * @returns {'improving'|'maintaining'|'declining'}
   * @private
   */
  _calculateProgressionTrend(sessions) {
    return calculateProgressionTrend(sessions);
  }

  /**
   * Calculate progression rate in kg per week
   * @param {Array} sessions - Exercise sessions
   * @returns {number}
   * @private
   */
  _calculateProgressionRate(sessions) {
    return calculateProgressionRate(sessions);
  }

  /**
   * Find last progress date
   * @param {Array} sessions - Exercise sessions
   * @returns {Date|null}
   * @private
   */
  _findLastProgressDate(sessions) {
    return findLastProgressDate(sessions);
  }

  /**
   * Calculate confidence level for analysis
   * @param {Array} sessions - Exercise sessions
   * @returns {number}
   * @private
   */
  _calculateConfidenceLevel(sessions) {
    return calculateConfidenceLevel(sessions);
  }

  /**
   * Generate progression suggestion based on analysis
   * @param {ProgressionAnalysis} analysis - Exercise analysis
   * @param {UserProgressionProfile} userProfile - User profile
   * @returns {Promise<ProgressionSuggestion>}
   * @private
   */
  async _generateProgressionSuggestion(analysis) {
    return generateProgressionSuggestion(
      analysis,
      this.config,
      this.compoundExercises
    );
  }

  /**
   * Generate alternative progression options
   * @param {ProgressionAnalysis} analysis - Exercise analysis
   * @param {number} baseIncrease - Base weight increase
   * @returns {Array<ProgressionOption>}
   * @private
   */
  _generateAlternativeOptions(analysis, baseIncrease) {
    return generateAlternativeOptions(analysis, baseIncrease);
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

      // Step 2: Use the generative provider for intelligent analysis (when enabled and userId available)
      if (this.config.useAIProvider && userId) {
        try {
          const userProfile = await this._getUserProgressionProfile(userId);
          const pastInterventions = await this._getPastInterventions(
            userId,
            plateauData.exerciseId
          );

          const providerInterventions =
            await aiProviderService.generatePlateauInterventions(
              plateauData,
              userProfile,
              pastInterventions
            );

          // Step 3: Combine and enhance interventions
          const combinedInterventions = this._combineInterventionSuggestions(
            ruleBasedInterventions,
            providerInterventions
          );

          return this._prioritizeInterventions(
            combinedInterventions,
            plateauData
          );
        } catch (error) {
          this._log(
            "Generative AI unavailable for interventions, using rule-based",
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
    return calculateDeloadPercentage(plateauData);
  }

  /**
   * Calculate deload duration in weeks
   * @param {PlateauDetection} plateauData - Plateau information
   * @returns {number} Duration in weeks
   * @private
   */
  _calculateDeloadDuration(plateauData) {
    return calculateDeloadDuration(plateauData);
  }

  /**
   * Get minimum weight for an exercise
   * @param {string} exerciseId - Exercise identifier
   * @returns {number} Minimum weight in kg
   * @private
   */
  _getMinimumWeight(exerciseId) {
    return getMinimumWeight(exerciseId, this.compoundExercises);
  }

  /**
   * Calculate intervention effectiveness score
   * @param {string} interventionType - Type of intervention
   * @param {PlateauDetection} plateauData - Plateau information
   * @returns {number} Effectiveness score (0-1)
   * @private
   */
  _calculateInterventionEffectiveness(interventionType, plateauData) {
    return calculateInterventionEffectiveness(interventionType, plateauData);
  }

  /**
   * Get exercise variations for a given exercise
   * @param {string} exerciseId - Exercise identifier
   * @returns {Array<Object>} Exercise variations
   * @private
   */
  _getExerciseVariations(exerciseId) {
    return getExerciseVariations(exerciseId);
  }

  /**
   * Calculate transfer weight for exercise variations
   * @param {number} currentWeight - Current weight
   * @param {number} difficulty - Difficulty multiplier
   * @returns {number} Transfer weight
   * @private
   */
  _calculateTransferWeight(currentWeight, difficulty) {
    return calculateTransferWeight(currentWeight, difficulty);
  }

  /**
   * Get replacement exercises for complete substitution
   * @param {string} exerciseId - Exercise identifier
   * @returns {Array<string>} Replacement exercise names
   * @private
   */
  _getReplacementExercises(exerciseId) {
    return getReplacementExercises(exerciseId);
  }

  /**
   * Prioritize interventions based on effectiveness and plateau characteristics
   * @param {Array<InterventionSuggestion>} interventions - All interventions
   * @param {PlateauDetection} plateauData - Plateau information
   * @returns {Array<InterventionSuggestion>} Sorted interventions
   * @private
   */
  _prioritizeInterventions(interventions) {
    return prioritizeInterventions(interventions);
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
      const workouts = await listWorkouts({
        supabase: this.supabase,
        userId,
        limit: 16,
      });

      if (workouts.length === 0) {
        return this._getEmptyAnalysis();
      }

      // Perform comprehensive analysis
      const exerciseFrequencyAnalysis =
        this._analyzeExerciseFrequency(workouts);
      const personalRecordAnalysis = analyzePersonalRecords(workouts);
      const trendAnalysis = analyzeTrends(workouts);
      const consistencyAnalysis = analyzeConsistency(workouts);
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
        recommendations: generateHistoryBasedRecommendations(workouts),
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
    return analyzeExerciseFrequency(workouts);
  }

  /**
   * Analyze personal records and achievements
   * @param {Array} workouts - Workout data
   * @returns {Object} Personal record analysis
   * @private
   */
  _analyzePersonalRecords(workouts) {
    return analyzePersonalRecords(workouts);
  }
  /**
   * Analyze workout trends and patterns
   * @param {Array} workouts - Workout data
   * @returns {Object} Trend analysis
   * @private
   */
  _analyzeTrends(workouts) {
    return analyzeTrends(workouts);
  }
  /**
   * Analyze workout consistency
   * @param {Array} workouts - Workout data
   * @returns {Object} Consistency analysis
   * @private
   */
  _analyzeConsistency(workouts) {
    return analyzeConsistency(workouts);
  }
  /**
   * Analyze volume progression patterns
   * @param {Array} workouts - Workout data
   * @returns {Object} Volume analysis
   * @private
   */
  _analyzeVolumeProgression(workouts) {
    return analyzeVolumeProgression(workouts);
  }

  /**
   * Generate recommendations based on workout history analysis
   * @param {Array} workouts - Workout data
   * @returns {Array<string>} Recommendations
   * @private
   */
  _generateHistoryBasedRecommendations(workouts) {
    return generateHistoryBasedRecommendations(workouts);
  }
  /**
   * Calculate consistency score based on workout intervals
   * @param {Array<number>} daysBetweenWorkouts - Days between workouts
   * @returns {number} Consistency score (0-1)
   * @private
   */
  _calculateConsistencyScore(daysBetweenWorkouts) {
    return calculateConsistencyScore(daysBetweenWorkouts);
  }

  /**
   * Calculate duration trend
   * @param {Array} workouts - Workout data
   * @returns {string} Trend direction
   * @private
   */
  _calculateDurationTrend(workouts) {
    return calculateDurationTrend(workouts);
  }

  /**
   * Get empty analysis structure
   * @returns {Object} Empty analysis
   * @private
   */
  _getEmptyAnalysis() {
    return getEmptyWorkoutAnalysis();
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
      const workouts = await listWorkouts({
        supabase: this.supabase,
        userId,
        limit: 20,
      });

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
    return analyzeSessionsForPlateau(sessions);
  }

  /**
   * Check for weight stagnation across sessions
   * @param {Array} metrics - Session metrics
   * @returns {boolean} True if weight has stagnated
   * @private
   */
  _checkWeightStagnation(metrics) {
    return checkWeightStagnation(metrics);
  }

  /**
   * Check for rep stagnation across sessions
   * @param {Array} metrics - Session metrics
   * @returns {boolean} True if reps have stagnated
   * @private
   */
  _checkRepStagnation(metrics) {
    return checkRepStagnation(metrics);
  }

  /**
   * Check for volume stagnation across sessions
   * @param {Array} metrics - Session metrics
   * @returns {boolean} True if volume has stagnated
   * @private
   */
  _checkVolumeStagnation(metrics) {
    return checkVolumeStagnation(metrics);
  }

  /**
   * Calculate total volume for a set of exercise sets
   * @param {Array} sets - Exercise sets
   * @returns {number} Total volume (weight × reps × sets)
   * @private
   */
  _calculateTotalVolume(sets) {
    return calculateTotalVolume(sets);
  }

  /**
   * Get average weight from sets
   * @param {Array} sets - Exercise sets
   * @returns {number} Average weight
   * @private
   */
  _getAverageWeight(sets) {
    return getAverageWeight(sets);
  }

  /**
   * Calculate plateau duration in sessions
   * @param {Array} sessions - All exercise sessions
   * @returns {number} Number of sessions since last progress
   * @private
   */
  _calculatePlateauDuration(sessions) {
    return calculatePlateauDuration(sessions);
  }

  /**
   * Assess plateau severity based on duration and metrics
   * @param {number} duration - Plateau duration in sessions
   * @param {Object} analysis - Plateau analysis
   * @returns {'mild'|'moderate'|'severe'} Severity level
   * @private
   */
  _assessPlateauSeverity(duration, analysis) {
    return assessPlateauSeverity(duration, analysis);
  }

  /**
   * Classify the type of plateau based on which metrics are stagnant
   * @param {Array} sessions - Recent sessions
   * @returns {'weight'|'reps'|'volume'} Plateau type
   * @private
   */
  _classifyPlateauType(sessions) {
    return classifyPlateauType(sessions);
  }

  /**
   * Get current performance metrics from latest session
   * @param {Object} session - Latest exercise session
   * @returns {Object} Current performance metrics
   * @private
   */
  _getCurrentPerformanceMetrics(session) {
    return getCurrentPerformanceMetrics(session);
  }

  /**
   * Calculate confidence level for plateau detection
   * @param {Object} analysis - Plateau analysis
   * @param {number} duration - Plateau duration
   * @returns {number} Confidence level (0-1)
   * @private
   */
  _calculatePlateauConfidence(analysis, duration) {
    return calculatePlateauConfidence(analysis, duration);
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
      const suggestions = await aiDatabaseService.getAISuggestions(
        this.supabase,
        userId
      );

      if (!suggestions) {
        return [];
      }

      const plateauAlerts = suggestions.plateauAlerts || [];

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

      const suggestions = await aiDatabaseService.getAISuggestions(
        this.supabase,
        userId
      );

      if (!suggestions) {
        return false;
      }

      const plateauAlerts = suggestions.plateauAlerts || [];

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

      await aiDatabaseService.updateAISuggestions(this.supabase, userId, {
        plateauAlerts,
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

      const suggestions = await aiDatabaseService.getAISuggestions(
        this.supabase,
        userId
      );

      if (!suggestions) {
        return false;
      }

      const plateauAlerts = suggestions.plateauAlerts || [];

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

      await aiDatabaseService.updateAISuggestions(this.supabase, userId, {
        plateauAlerts,
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
      const profileData = await aiDatabaseService.getUserProgressionProfile(
        this.supabase,
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
   * Save plateau alerts to Supabase-backed AI suggestion storage
   * @param {string} userId - User identifier
   * @param {Array<PlateauAlert>} alerts - Alerts to save
   * @returns {Promise<void>}
   * @private
   */
  async _savePlateauAlerts(userId, alerts) {
    try {
      const suggestions = await aiDatabaseService.getAISuggestions(
        this.supabase,
        userId
      );
      const existingAlerts = suggestions?.plateauAlerts || [];

      // Merge new alerts with existing ones
      const allAlerts = [...existingAlerts, ...alerts];

      // Remove duplicates and old alerts (keep last 20)
      const uniqueAlerts = this._deduplicateAlerts(allAlerts).slice(0, 20);

      await aiDatabaseService.saveAISuggestions(this.supabase, userId, {
          nextWorkoutSuggestions: suggestions?.nextWorkoutSuggestions || [],
          plateauAlerts: uniqueAlerts,
          progressionPlan: suggestions?.progressionPlan || {},
        });
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
      await aiDatabaseService.trackSuggestionInteraction(
        this.supabase,
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

      await aiDatabaseService.updatePerformanceMetrics(this.supabase, userId, updatedMetrics);

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

      const workouts = await listWorkouts({
        supabase: this.supabase,
        userId,
        limit: limitCount,
      });

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
   * Combine rule-based and AI provider progression suggestions
   * @param {ProgressionSuggestion} ruleBasedSuggestion - Rule-based suggestion
   * @param {Object} providerSuggestion - AI provider suggestion
   * @returns {ProgressionSuggestion} Combined suggestion
   * @private
   */
  _combineProgressionSuggestions(ruleBasedSuggestion, providerSuggestion) {
    const rulePriority = 1 - this.config.providerPriority; // e.g., 0.6
    const providerPriority = this.config.providerPriority; // e.g., 0.4

    // Combine confidence scores
    const combinedConfidence =
      ruleBasedSuggestion.confidenceLevel * rulePriority +
      (providerSuggestion.primarySuggestion?.confidence || 0.5) * providerPriority;

    // Use AI provider's reasoning if available, otherwise rule-based
    const reasoning =
      providerSuggestion.primarySuggestion?.reasoning ||
      ruleBasedSuggestion.reasoning;

    // Combine suggestions intelligently
    return {
      ...ruleBasedSuggestion,
      confidenceLevel: Math.min(combinedConfidence, 0.95),
      reasoning: `${reasoning} (AI-Enhanced)`,
      alternativeOptions: [
        ...(ruleBasedSuggestion.alternativeOptions || []),
        ...(providerSuggestion.alternatives || []).map((alt) => ({
          weight: ruleBasedSuggestion.currentWeight,
          reps: ruleBasedSuggestion.suggestedReps,
          reasoning: alt.description,
        })),
      ],
      personalizedTips: providerSuggestion.personalizedTips || [],
      riskFactors: providerSuggestion.primarySuggestion?.riskFactors || [],
      aiEnhanced: true,
      providerInsights: providerSuggestion.primarySuggestion || null,
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
   * Combine rule-based and AI provider intervention suggestions
   * @param {Array<InterventionSuggestion>} ruleBasedInterventions - Rule-based interventions
   * @param {Object} providerInterventions - AI provider interventions
   * @returns {Array<InterventionSuggestion>} Combined interventions
   * @private
   */
  _combineInterventionSuggestions(ruleBasedInterventions, providerInterventions) {
    const combined = [...ruleBasedInterventions];

    // Add AI provider interventions that don't duplicate existing ones
    if (providerInterventions.interventions) {
      providerInterventions.interventions.forEach((providerIntervention) => {
        // Check if this type of intervention already exists
        const existingIntervention = combined.find(
          (existing) => existing.type === providerIntervention.type
        );

        if (!existingIntervention) {
          combined.push({
            ...providerIntervention,
            aiGenerated: true,
            priority: this._calculateInterventionPriority(
              providerIntervention,
              {}
            ),
          });
        } else {
          // Enhance existing intervention with AI insights
          existingIntervention.reasoning = `${existingIntervention.reasoning} | AI Insight: ${providerIntervention.reasoning}`;
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
      const suggestions = await aiDatabaseService.getAISuggestions(this.supabase, userId);
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

      // Use the generative provider for intelligent workout planning
      if (this.config.useAIProvider && analyses.length > 0) {
        this._log("Using AI workout recommendations", {
          analysisCount: analyses.length,
        });
        const recommendationResult =
          await aiProviderService.generateWorkoutRecommendations(
            workoutContext,
            userProfile,
            recentWorkouts
          );

        const recommendedExercises =
          recommendationResult?.workoutPlan?.exercises || [];

        if (recommendedExercises.length > 0) {
          return recommendedExercises.map((exercise) => {
            const matchingAnalysis = analyses.find(
              (analysis) =>
                analysis.exerciseId === exercise.exerciseId ||
                analysis.exerciseName === exercise.exerciseName
            );

            const parsedReps = Number.parseInt(
              String(exercise.reps || "").split("-").pop(),
              10
            );
            const parsedWeight = Number.parseFloat(exercise.weight);

            return {
              exerciseId:
                exercise.exerciseId ||
                matchingAnalysis?.exerciseId ||
                exercise.exerciseName,
              exerciseName:
                exercise.exerciseName ||
                matchingAnalysis?.exerciseName ||
                "Recommended Exercise",
              suggestedWeight:
                Number.isFinite(parsedWeight)
                  ? parsedWeight
                  : matchingAnalysis?.currentWeight || 0,
              suggestedReps: Number.isFinite(parsedReps) ? parsedReps : 10,
              suggestedSets: exercise.sets || 3,
              restTime: exercise.restTime || 90,
              priority:
                matchingAnalysis?.confidenceLevel >= 0.7 ? "high" : "medium",
              reasoning:
                exercise.notes ||
                recommendationResult.reasoning ||
                "AI-generated workout recommendation",
              confidenceLevel: matchingAnalysis?.confidenceLevel || 0.75,
              aiGenerated: true,
              difficultyLevel: recommendationResult.difficultyLevel,
              estimatedDuration: recommendationResult.estimatedDuration,
            };
          });
        }
      }

      // Fallback to rule-based suggestions if AI is disabled or no analysis
      this._log("Using rule-based workout suggestions", {
        providerEnabled: this.config.useAIProvider,
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
