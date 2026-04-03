/**
 * @fileoverview AI-Enhanced Supabase Database Service
 * Manages AI-specific Postgres tables and data operations for the Progressive Overload AI system.
 * Handles ai_suggestions, user_progression_profiles, and exercise_analytics tables.
 */

// We don't import db from Firebase anymore.
// Note: In React components, you should prefer the `useSupabase` hook.
// This service expects you to pass an instantiated Supabase client if you want RLS to apply securely,
// or we can initialize a singleton client for server-side operations if needed.

class AIDatabaseService {
  constructor() {
    this.tables = {
      aiSuggestions: "ai_suggestions",
      userProgressionProfiles: "user_progression_profiles",
      exerciseAnalytics: "exercise_analytics",
    };
  }

  // ==================== AI Suggestions Table ====================

  /**
   * Save AI suggestions for a user
   */
  async saveAISuggestions(supabase, userId, suggestionsData) {
    try {
      const { error } = await supabase
        .from(this.tables.aiSuggestions)
        .upsert({
          user_id: userId,
          next_workout_suggestions: suggestionsData.nextWorkoutSuggestions || [],
          plateau_alerts: suggestionsData.plateauAlerts || [],
          progression_plan: suggestionsData.progressionPlan || {},
          model_version: "1.0.0",
          last_updated: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      console.log("AI suggestions saved successfully", { userId });
    } catch (error) {
      console.error("Error saving AI suggestions:", error);
      throw error;
    }
  }

  /**
   * Get AI suggestions for a user
   */
  async getAISuggestions(supabase, userId) {
    try {
      const { data, error } = await supabase
        .from(this.tables.aiSuggestions)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Map snake_case back to camelCase for the frontend
      return {
        id: data.user_id,
        userId: data.user_id,
        nextWorkoutSuggestions: data.next_workout_suggestions,
        plateauAlerts: data.plateau_alerts,
        progressionPlan: data.progression_plan,
        modelVersion: data.model_version,
        lastUpdated: data.last_updated,
        interactions: data.interactions
      };
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      throw error;
    }
  }

  /**
   * Update specific AI suggestion fields
   */
  async updateAISuggestions(supabase, userId, updates) {
    try {
      // Map frontend camelCase to snake_case db columns
      const dbPayload = {
        last_updated: new Date().toISOString()
      };
      
      if (updates.plateauAlerts !== undefined) dbPayload.plateau_alerts = updates.plateauAlerts;
      if (updates.nextWorkoutSuggestions !== undefined) dbPayload.next_workout_suggestions = updates.nextWorkoutSuggestions;
      if (updates.progressionPlan !== undefined) dbPayload.progression_plan = updates.progressionPlan;
      if (updates.interactions !== undefined) dbPayload.interactions = updates.interactions;

      const { error } = await supabase
        .from(this.tables.aiSuggestions)
        .update(dbPayload)
        .eq('user_id', userId);

      if (error) throw error;
      console.log("AI suggestions updated successfully", { userId, updates });
    } catch (error) {
      console.error("Error updating AI suggestions:", error);
      throw error;
    }
  }

  /**
   * Add plateau alert for user
   */
  async addPlateauAlert(supabase, userId, plateauAlert) {
    try {
      const suggestions = await this.getAISuggestions(supabase, userId);
      let plateauAlerts = suggestions?.plateauAlerts || [];

      plateauAlerts.push({
        ...plateauAlert,
        alertDate: new Date().toISOString(),
        acknowledged: false,
        id: `plateau_${Date.now()}`,
      });

      await this.updateAISuggestions(supabase, userId, { plateauAlerts });
    } catch (error) {
      console.error("Error adding plateau alert:", error);
      throw error;
    }
  }

  /**
   * Acknowledge plateau alert
   */
  async acknowledgePlateauAlert(supabase, userId, alertId) {
    try {
      const suggestions = await this.getAISuggestions(supabase, userId);
      if (!suggestions || !suggestions.plateauAlerts) return;

      const updatedAlerts = suggestions.plateauAlerts.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      );

      await this.updateAISuggestions(supabase, userId, { plateauAlerts: updatedAlerts });
    } catch (error) {
      console.error("Error acknowledging plateau alert:", error);
      throw error;
    }
  }

  /**
   * Track suggestion interaction
   */
  async trackSuggestionInteraction(supabase, userId, interactionData) {
    try {
      const suggestions = await this.getAISuggestions(supabase, userId);
      let interactions = suggestions?.interactions || [];

      interactions.push({
        ...interactionData,
        id: `interaction_${Date.now()}`,
        timestamp: new Date().toISOString(),
      });

      if (interactions.length > 100) interactions = interactions.slice(-100);

      await this.updateAISuggestions(supabase, userId, { interactions });
      console.log("Suggestion interaction tracked successfully", { userId });
    } catch (error) {
      console.error("Error tracking suggestion interaction:", error);
      throw error;
    }
  }

  // ==================== User Progression Profiles Table ====================

  async saveUserProgressionProfile(supabase, userId, profileData) {
    try {
      const payload = {
        user_id: userId,
        personal_metrics: {
          bodyweight: profileData.bodyweight || 70,
          age: profileData.age || 25,
          experienceLevel: profileData.experienceLevel || "intermediate",
          trainingFrequency: profileData.trainingFrequency || 3,
        },
        progression_preferences: {
          style: profileData.preferredProgressionStyle || "moderate",
          plateauTolerance: profileData.plateauTolerance || 3,
          preferredRepRanges: profileData.preferredRepRanges || {
            compound: { min: 6, max: 10 },
            isolation: { min: 8, max: 15 },
          },
          exercisePreferences: profileData.exercisePreferences || [],
        },
        performance_metrics: {
          averageProgressionRate: 0,
          plateauFrequency: 0,
          goalAchievementRate: 0,
          consistencyScore: 0,
          ...profileData.performanceMetrics,
        },
        ai_model_data: {
          personalizedWeights: {},
          learningRate: 0.1,
          confidenceScores: {},
          lastTrainingDate: null,
          ...profileData.aiModelData,
        },
        last_updated: new Date().toISOString(),
      };

      const { error } = await supabase
        .from(this.tables.userProgressionProfiles)
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;
      console.log("User progression profile saved successfully", { userId });
    } catch (error) {
      console.error("Error saving user progression profile:", error);
      throw error;
    }
  }

  async getUserProgressionProfile(supabase, userId) {
    try {
      const { data, error } = await supabase
        .from(this.tables.userProgressionProfiles)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.user_id,
        userId: data.user_id,
        personalMetrics: data.personal_metrics,
        progressionPreferences: data.progression_preferences,
        performanceMetrics: data.performance_metrics,
        aiModelData: data.ai_model_data,
        createdAt: data.created_at,
        lastUpdated: data.last_updated
      };
    } catch (error) {
      console.error("Error getting user progression profile:", error);
      throw error;
    }
  }

  async updatePerformanceMetrics(supabase, userId, metrics) {
    try {
      const { error } = await supabase
        .from(this.tables.userProgressionProfiles)
        .update({
          performance_metrics: metrics,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      console.log("Performance metrics updated successfully", { userId });
    } catch (error) {
      console.error("Error updating performance metrics:", error);
      throw error;
    }
  }

  // ==================== Exercise Analytics Table ====================

  async saveExerciseAnalytics(supabase, userId, exerciseId, analyticsData) {
    try {
      const compositeId = `${userId}_${exerciseId}`;
      const payload = {
        id: compositeId,
        user_id: userId,
        exercise_id: exerciseId,
        exercise_name: analyticsData.exerciseName || exerciseId.replace("-", " "),
        performance_history: analyticsData.performanceHistory || [],
        progression_metrics: {
          currentWeight: 0,
          bestWeight: 0,
          averageProgressionRate: 0,
          lastProgressDate: null,
          plateauStatus: "none",
          trendDirection: "maintaining",
          ...analyticsData.progressionMetrics,
        },
        ai_insights: {
          optimalRepRange: { min: 8, max: 12 },
          suggestedRestTime: 90,
          plateauRisk: 0,
          nextProgressionDate: null,
          confidenceLevel: 0.5,
          ...analyticsData.aiInsights,
        },
        last_analyzed: new Date().toISOString(),
      };

      const { error } = await supabase
        .from(this.tables.exerciseAnalytics)
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving exercise analytics:", error);
      throw error;
    }
  }

  async getExerciseAnalytics(supabase, userId, exerciseId) {
    try {
      const compositeId = `${userId}_${exerciseId}`;
      const { data, error } = await supabase
        .from(this.tables.exerciseAnalytics)
        .select('*')
        .eq('id', compositeId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        exerciseId: data.exercise_id,
        exerciseName: data.exercise_name,
        performanceHistory: data.performance_history,
        progressionMetrics: data.progression_metrics,
        aiInsights: data.ai_insights,
        lastAnalyzed: data.last_analyzed
      };
    } catch (error) {
      console.error("Error getting exercise analytics:", error);
      throw error;
    }
  }

  async getAllExerciseAnalytics(supabase, userId) {
    try {
      const { data, error } = await supabase
        .from(this.tables.exerciseAnalytics)
        .select('*')
        .eq('user_id', userId)
        .order('last_analyzed', { ascending: false });

      if (error) throw error;
      
      return data.map(record => ({
        id: record.id,
        userId: record.user_id,
        exerciseId: record.exercise_id,
        exerciseName: record.exercise_name,
        performanceHistory: record.performance_history,
        progressionMetrics: record.progression_metrics,
        aiInsights: record.ai_insights,
        lastAnalyzed: record.last_analyzed
      }));
    } catch (error) {
      console.error("Error getting all exercise analytics:", error);
      throw error;
    }
  }

  async addPerformanceRecord(supabase, userId, exerciseId, performanceRecord) {
    try {
      const analytics = await this.getExerciseAnalytics(supabase, userId, exerciseId);
      let performanceHistory = analytics?.performanceHistory || [];

      performanceHistory.push({
        date: new Date().toISOString(),
        weight: performanceRecord.weight || 0,
        reps: performanceRecord.reps || 0,
        sets: performanceRecord.sets || 0,
        volume: (performanceRecord.weight || 0) * (performanceRecord.reps || 0) * (performanceRecord.sets || 0),
        rpe: performanceRecord.rpe || null,
        restTime: performanceRecord.restTime || null,
        personalRecord: performanceRecord.personalRecord || false,
      });

      if (performanceHistory.length > 50) {
        performanceHistory = performanceHistory.slice(-50);
      }

      await this.saveExerciseAnalytics(supabase, userId, exerciseId, {
        performanceHistory,
        exerciseName: performanceRecord.exerciseName,
      });
    } catch (error) {
      console.error("Error adding performance record:", error);
      throw error;
    }
  }

  // ==================== Batch Operations ====================
  // Note: Supabase JS client doesn't strictly have identical writeBatches. 
  // Often it's done via raw SQL functions or executing standard arrays of promises.
  async batchUpdate(supabase, operations) {
    try {
      await Promise.all(operations.map(async op => {
        const { collection: tableName, docId, data, type = "set" } = op;
        
        // Ensure table name maps from legacy firestore mapping to postgres
        let mappedTable = tableName;
        if (tableName === 'aiSuggestions') mappedTable = this.tables.aiSuggestions;
        if (tableName === 'userProgressionProfiles') mappedTable = this.tables.userProgressionProfiles;
        if (tableName === 'exerciseAnalytics') mappedTable = this.tables.exerciseAnalytics;

        if (type === "set" || type === "update") {
          // Both trigger an upsert/update effectively
          await supabase.from(mappedTable).upsert({ ...data, id: docId, last_updated: new Date().toISOString() });
        } else if (type === "delete") {
          await supabase.from(mappedTable).delete().eq('id', docId);
        }
      }));
      
      console.log("Batch update completed successfully", { operationsCount: operations.length });
    } catch (error) {
      console.error("Error in batch update:", error);
      throw error;
    }
  }

  // ==================== Real-time Listeners ====================

  listenToAISuggestions(supabase, userId, callback) {
    return supabase.channel('ai_suggestions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: this.tables.aiSuggestions, filter: `user_id=eq.${userId}` }, payload => {
        callback(payload.new);
      })
      .subscribe();
  }

  listenToUserProgressionProfile(supabase, userId, callback) {
    return supabase.channel('user_progression_profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: this.tables.userProgressionProfiles, filter: `user_id=eq.${userId}` }, payload => {
        callback(payload.new);
      })
      .subscribe();
  }

  // ==================== Cleanup Operations ====================

  async cleanupOldAIData(supabase, userId, daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error, count } = await supabase
        .from(this.tables.exerciseAnalytics)
        .delete()
        .eq('user_id', userId)
        .lt('last_analyzed', cutoffDate.toISOString());

      if (error) throw error;
      if (count > 0) {
        console.log(`Cleaned up ${count} old analytics records for user ${userId}`);
      }
    } catch (error) {
      console.error("Error cleaning up old AI data:", error);
      throw error;
    }
  }
}

export default new AIDatabaseService();
export { AIDatabaseService };
