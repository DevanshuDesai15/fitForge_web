/**
 * @fileoverview Gemini AI Service
 * Integrates Google's Gemini API for intelligent fitness coaching and analysis.
 * Works in conjunction with the rule-based progressive overload system.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import geminiConfig from "../config/geminiConfig";

class GeminiAIService {
  constructor() {
    this.config = geminiConfig;

    // Validate API key configuration
    if (
      !this.config.apiKey ||
      this.config.apiKey === "your-gemini-api-key-here" ||
      this.config.apiKey === "YOUR_ACTUAL_API_KEY"
    ) {
      console.error("❌ Gemini API key not configured!");
      console.error("📋 Please follow these steps:");
      console.error(
        "   1. Get API key: https://aistudio.google.com/app/apikey"
      );
      console.error(
        "   2. Create .env file with: VITE_GEMINI_API_KEY=your_actual_key"
      );
      console.error("   3. Restart dev server: npm run dev");
      console.error("📖 Full guide: see GEMINI_API_SETUP.md");
      throw new Error(
        "Gemini API key not configured. Please set VITE_GEMINI_API_KEY in .env file."
      );
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.config.model });
      this.maxRetries = this.config.maxRetries;
      this.requestTimeout = this.config.requestTimeout;

      console.log(
        `✅ Gemini AI Service initialized with model: ${this.config.model}`
      );
      console.log(
        `🔑 API Key configured: ${this.config.apiKey.substring(0, 10)}...`
      );
    } catch (error) {
      console.error("❌ Failed to initialize Gemini AI Service:", error);
      throw error;
    }
  }

  /**
   * Analyze workout data and generate intelligent progression suggestions
   * @param {Object} analysisData - Data from rule-based analysis
   * @param {Object} userProfile - User progression profile
   * @param {Object} workoutHistory - Recent workout history
   * @returns {Promise<Object>} Enhanced AI suggestions
   */
  async generateProgressionSuggestions(
    analysisData,
    userProfile,
    workoutHistory
  ) {
    try {
      const prompt = this._buildProgressionPrompt(
        analysisData,
        userProfile,
        workoutHistory
      );

      const result = await this._makeGeminiRequest(prompt);
      const responseText = await result.response.text();

      console.log(
        "Gemini progression response:",
        responseText.substring(0, 500) + "..."
      );
      const aiResponse = this._extractJsonFromResponse(responseText);

      return {
        ...aiResponse,
        confidence: this._calculateEnhancedConfidence(analysisData, aiResponse),
        reasoning: aiResponse.reasoning,
        alternatives: aiResponse.alternatives || [],
        personalizedTips: aiResponse.personalizedTips || [],
      };
    } catch (error) {
      console.error(
        "Gemini API error, falling back to rule-based system:",
        error
      );
      return this._generateFallbackSuggestion(analysisData);
    }
  }

  /**
   * Generate progression suggestions for multiple exercises in a single API call
   * This reduces API usage by batching multiple exercise analyses together
   * @param {Array<Object>} analysesData - Array of exercise analysis data
   * @param {Object} userProfile - User progression profile
   * @param {Object} workoutHistory - Recent workout history
   * @returns {Promise<Object>} Batch AI suggestions
   */
  async generateBatchProgressionSuggestions(
    analysesData,
    userProfile,
    workoutHistory
  ) {
    try {
      this._log("Generating batch progression suggestions", {
        exerciseCount: analysesData.length,
      });

      const prompt = this._buildBatchProgressionPrompt(
        analysesData,
        userProfile,
        workoutHistory
      );

      const result = await this._makeGeminiRequest(prompt);
      const responseText = await result.response.text();

      console.log(
        "Gemini batch progression response:",
        responseText.substring(0, 500) + "..."
      );
      const aiResponse = this._extractJsonFromResponse(responseText);

      return {
        suggestions: aiResponse.suggestions || [],
        overallInsights: aiResponse.overallInsights,
        batchConfidence: this._calculateBatchConfidence(
          analysesData,
          aiResponse
        ),
        processedCount: analysesData.length,
      };
    } catch (error) {
      console.error(
        "Gemini batch API error, falling back to rule-based system:",
        error
      );
      return this._generateBatchFallbackSuggestions(analysesData);
    }
  }

  /**
   * Analyze plateau and generate intelligent interventions
   * @param {Object} plateauData - Plateau detection data
   * @param {Object} userProfile - User profile
   * @param {Array} pastInterventions - Previous interventions tried
   * @returns {Promise<Object>} AI-generated intervention strategies
   */
  async generatePlateauInterventions(
    plateauData,
    userProfile,
    pastInterventions = []
  ) {
    try {
      const prompt = this._buildPlateauPrompt(
        plateauData,
        userProfile,
        pastInterventions
      );

      const result = await this._makeGeminiRequest(prompt);
      const responseText = await result.response.text();

      console.log(
        "Gemini intervention response:",
        responseText.substring(0, 500) + "..."
      );
      const aiResponse = this._extractJsonFromResponse(responseText);

      return {
        interventions: aiResponse.interventions.map((intervention) => ({
          ...intervention,
          aiGenerated: true,
          confidence: intervention.confidence,
          priority: this._calculateInterventionPriority(
            intervention,
            plateauData
          ),
        })),
        explanation: aiResponse.explanation,
        expectedOutcome: aiResponse.expectedOutcome,
        timeframe: aiResponse.timeframe,
      };
    } catch (error) {
      console.error("Gemini API error for plateau interventions:", error);
      return this._generateFallbackInterventions(plateauData);
    }
  }

  /**
   * Generate personalized workout recommendations
   * @param {Object} context - Workout context (time, equipment, goals)
   * @param {Object} userProfile - User profile and preferences
   * @param {Array} recentWorkouts - Recent workout data
   * @returns {Promise<Object>} AI-generated workout plan
   */
  async generateWorkoutRecommendations(context, userProfile, recentWorkouts) {
    try {
      const prompt = this._buildWorkoutPrompt(
        context,
        userProfile,
        recentWorkouts
      );

      const result = await this._makeGeminiRequest(prompt);
      const responseText = await result.response.text();

      console.log(
        "Gemini workout response:",
        responseText.substring(0, 500) + "..."
      );
      const aiResponse = this._extractJsonFromResponse(responseText);

      return {
        workoutPlan: aiResponse.workoutPlan,
        reasoning: aiResponse.reasoning,
        adaptations: aiResponse.adaptations,
        tips: aiResponse.tips,
        estimatedDuration: aiResponse.estimatedDuration,
        difficultyLevel: aiResponse.difficultyLevel,
      };
    } catch (error) {
      console.error("Gemini API error for workout recommendations:", error);
      return this._generateFallbackWorkout(context, userProfile);
    }
  }

  /**
   * Build progression analysis prompt for Gemini
   * @private
   */
  _buildProgressionPrompt(analysisData, userProfile, workoutHistory) {
    return `You are an expert fitness AI coach analyzing a user's workout progression data. 

USER PROFILE:
- Experience Level: ${userProfile.experienceLevel}
- Age: ${userProfile.age}
- Training Frequency: ${userProfile.trainingFrequency} sessions/week
- Preferred Style: ${userProfile.preferredProgressionStyle}
- Bodyweight: ${userProfile.bodyweight}kg

CURRENT ANALYSIS DATA:
${JSON.stringify(analysisData, null, 2)}

RECENT WORKOUT HISTORY:
${JSON.stringify(workoutHistory.slice(0, 5), null, 2)}

TASK: Provide intelligent progression suggestions that enhance the rule-based analysis. Consider:
1. User's psychology and motivation
2. Potential form breakdown risks
3. Recovery capacity
4. Long-term progression strategy
5. Individual biomechanics and preferences

Respond in JSON format:
{
  "primarySuggestion": {
    "exerciseId": "string",
    "exerciseName": "string",
    "suggestion": "string",
    "reasoning": "detailed explanation",
    "confidence": 0.85,
    "riskFactors": ["string"],
    "benefits": ["string"]
  },
  "alternatives": [
    {
      "approach": "string",
      "description": "string",
      "reasoning": "string"
    }
  ],
  "personalizedTips": ["string"],
  "cautionaryNotes": ["string"]
}`;
  }

  /**
   * Build batch progression prompt for multiple exercises
   * @param {Array<Object>} analysesData - Array of exercise analyses
   * @param {Object} userProfile - User profile
   * @param {Object} workoutHistory - Recent workout history
   * @returns {string} Batch progression prompt
   * @private
   */
  _buildBatchProgressionPrompt(analysesData, userProfile, workoutHistory) {
    return `You are an expert fitness AI coach analyzing multiple exercises for progression optimization.

USER PROFILE:
- Experience Level: ${userProfile.experienceLevel}
- Age: ${userProfile.age}
- Training Frequency: ${userProfile.trainingFrequency} sessions/week
- Preferred Style: ${userProfile.preferredProgressionStyle}
- Bodyweight: ${userProfile.bodyweight}kg

EXERCISES TO ANALYZE:
${analysesData
  .map(
    (analysis, index) => `
Exercise ${index + 1}: ${analysis.exerciseName}
- Current Weight: ${analysis.currentWeight}kg
- Current Reps: ${analysis.currentReps}
- Current Sets: ${analysis.currentSets}
- Progression Trend: ${analysis.progressionTrend}
- Confidence Level: ${analysis.confidenceLevel}
- Total Sessions: ${analysis.totalSessions}
`
  )
  .join("\n")}

RECENT WORKOUT HISTORY:
${JSON.stringify(workoutHistory.slice(0, 3), null, 2)}

TASK: Provide progression suggestions for ALL exercises in a single response. Consider:
1. Exercise interactions and recovery between sessions
2. Overall training volume and fatigue management
3. Prioritization based on user goals and current performance
4. Balanced progression across muscle groups

Respond in JSON format:
{
  "suggestions": [
    {
      "exerciseId": "string",
      "exerciseName": "string", 
      "suggestion": "string",
      "reasoning": "detailed explanation",
      "confidence": 0.85,
      "riskFactors": ["string"],
      "benefits": ["string"]
    }
  ],
  "overallInsights": {
    "trainingBalance": "string",
    "recoveryRecommendations": ["string"],
    "priorityExercises": ["string"]
  }
}`;
  }

  /**
   * Build plateau intervention prompt for Gemini
   * @private
   */
  _buildPlateauPrompt(plateauData, userProfile, pastInterventions) {
    return `You are an expert fitness AI coach analyzing a training plateau situation.

USER PROFILE:
- Experience Level: ${userProfile.experienceLevel}
- Plateau Tolerance: ${userProfile.plateauTolerance} sessions
- Preferred Style: ${userProfile.preferredProgressionStyle}

PLATEAU DATA:
- Exercise: ${plateauData.exerciseName}
- Duration: ${plateauData.plateauDuration} sessions
- Severity: ${plateauData.severity}
- Current Weight: ${plateauData.currentWeight}kg
- Plateau Type: ${plateauData.plateauType}

PAST INTERVENTIONS TRIED:
${JSON.stringify(pastInterventions, null, 2)}

TASK: Generate intelligent intervention strategies that go beyond basic deload/rep manipulation. Consider:
1. Psychological factors (motivation, frustration)
2. Recovery and stress levels
3. Technical skill development
4. Periodization principles
5. Individual response patterns

Respond in JSON format:
{
  "interventions": [
    {
      "type": "string",
      "title": "string",
      "description": "detailed explanation",
      "implementation": {
        "duration": "string",
        "parameters": {},
        "progressionPlan": "string"
      },
      "reasoning": "why this intervention",
      "confidence": 0.8,
      "expectedTimeframe": "string"
    }
  ],
  "explanation": "overall strategy explanation",
  "expectedOutcome": "what user can expect",
  "timeframe": "expected recovery timeframe",
  "preventionTips": ["future plateau prevention"]
}`;
  }

  /**
   * Build workout recommendation prompt for Gemini
   * @private
   */
  _buildWorkoutPrompt(context, userProfile, recentWorkouts) {
    return `You are an expert fitness AI coach creating a personalized workout plan.

WORKOUT CONTEXT:
- Available Time: ${context.availableTime} minutes
- Equipment: ${context.equipment}
- Target Muscle Groups: ${context.targetMuscleGroups.join(", ")}
- Workout Type: ${context.workoutType}

USER PROFILE:
- Experience Level: ${userProfile.experienceLevel}
- Training Frequency: ${userProfile.trainingFrequency} sessions/week
- Recovery Status: ${context.recoveryStatus || "normal"}

RECENT WORKOUTS (last 3):
${JSON.stringify(recentWorkouts.slice(0, 3), null, 2)}

TASK: Create an intelligent workout plan that:
1. Optimizes for available time and equipment
2. Considers recent training volume and recovery
3. Provides progressive challenge
4. Includes exercise variations and alternatives

Respond in JSON format:
{
  "workoutPlan": {
    "exercises": [
      {
        "exerciseId": "string",
        "exerciseName": "string",
        "sets": 3,
        "reps": "8-10",
        "weight": "progressive",
        "restTime": 90,
        "notes": "form cues and tips"
      }
    ]
  },
  "reasoning": "why this workout structure",
  "adaptations": {
    "timeConstrained": "modifications for less time",
    "equipmentLimited": "alternative exercises",
    "fatigue": "easier variations"
  },
  "tips": ["workout-specific tips"],
  "estimatedDuration": 45,
  "difficultyLevel": "intermediate"
}`;
  }

  /**
   * Extract JSON from Gemini response text
   * @param {string} responseText - Raw response from Gemini
   * @returns {Object} Parsed JSON object
   * @private
   */
  _extractJsonFromResponse(responseText) {
    // First, try to parse as direct JSON
    try {
      return JSON.parse(responseText);
    } catch (directParseError) {
      console.log(
        "Direct JSON parse failed, trying extraction methods...",
        directParseError.message
      );
    }

    // Method 1: Extract from ```json code blocks
    let jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      console.log("Found JSON in ```json code block");
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (error) {
        console.warn("Failed to parse JSON from ```json block:", error);
      }
    }

    // Method 2: Extract from generic ``` code blocks
    jsonMatch = responseText.match(/```\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      console.log("Found JSON in generic code block");
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (error) {
        console.warn("Failed to parse JSON from generic code block:", error);
      }
    }

    // Method 3: Extract JSON object (find the largest/most complete JSON)
    const allJsonMatches = responseText.match(/\{[\s\S]*?\}/g);
    if (allJsonMatches && allJsonMatches.length > 0) {
      console.log(`Found ${allJsonMatches.length} potential JSON objects`);

      // Sort by length (longest first) to get the most complete JSON
      const sortedMatches = allJsonMatches.sort((a, b) => b.length - a.length);

      for (const match of sortedMatches) {
        try {
          const parsed = JSON.parse(match.trim());
          console.log("Successfully parsed JSON object");
          return parsed;
        } catch (error) {
          console.warn("Failed to parse JSON candidate:", error.message);
        }
      }
    }

    // If all methods fail, throw an error
    throw new Error(
      `Could not extract valid JSON from response: ${responseText.substring(
        0,
        300
      )}...`
    );
  }

  /**
   * Make request to Gemini API with retry logic
   * @private
   */
  async _makeGeminiRequest(prompt, retryCount = 0) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Request timeout")),
          this.requestTimeout
        )
      );

      const requestPromise = this.model.generateContent(prompt);

      const result = await Promise.race([requestPromise, timeoutPromise]);
      return result;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.log(`Gemini API retry ${retryCount + 1}/${this.maxRetries}`);
        await this._delay(1000 * (retryCount + 1)); // Exponential backoff
        return this._makeGeminiRequest(prompt, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Calculate enhanced confidence combining rule-based and AI analysis
   * @private
   */
  _calculateEnhancedConfidence(ruleBasedAnalysis, aiResponse) {
    const ruleConfidence = ruleBasedAnalysis.confidenceLevel || 0.5;
    const aiConfidence = aiResponse.primarySuggestion?.confidence || 0.5;

    // Weighted combination: 60% rule-based (reliable) + 40% AI (intelligent)
    return ruleConfidence * 0.6 + aiConfidence * 0.4;
  }

  /**
   * Calculate intervention priority based on AI analysis
   * @private
   */
  _calculateInterventionPriority(intervention, plateauData) {
    if (plateauData?.severity === "severe" && intervention.confidence > 0.8) {
      return "high";
    } else if (intervention.confidence > 0.7) {
      return "medium";
    }
    return "low";
  }

  /**
   * Generate fallback suggestion when API fails
   * @private
   */
  _generateFallbackSuggestion(analysisData) {
    return {
      primarySuggestion: {
        exerciseId: analysisData.exerciseId,
        exerciseName: analysisData.exerciseName,
        suggestion: `Continue with rule-based progression`,
        reasoning: `Based on ${analysisData.totalSessions} sessions of data`,
        confidence: analysisData.confidenceLevel,
        riskFactors: [],
        benefits: ["Consistent progression"],
      },
      alternatives: [],
      personalizedTips: ["Focus on proper form"],
      cautionaryNotes: ["AI service temporarily unavailable"],
    };
  }

  /**
   * Generate fallback interventions when API fails
   * @private
   */
  _generateFallbackInterventions() {
    return {
      interventions: [
        {
          type: "deload",
          title: "Standard Deload Week",
          description: `Reduce weight by 10% for 1 week`,
          implementation: {
            duration: "1 week",
            parameters: { weightReduction: 0.1 },
            progressionPlan: "Return to previous weight after deload",
          },
          reasoning: "Basic plateau intervention",
          confidence: 0.7,
          expectedTimeframe: "1-2 weeks",
        },
      ],
      explanation: "Using standard deload protocol",
      expectedOutcome: "Should help break plateau",
      timeframe: "1-2 weeks",
    };
  }

  /**
   * Generate fallback workout when API fails
   * @private
   */
  _generateFallbackWorkout(context, userProfile) {
    return {
      workoutPlan: {
        exercises: [
          {
            exerciseId: "squat",
            exerciseName: "Squat",
            sets: 3,
            reps: "8-10",
            weight: "progressive",
            restTime: 90,
            notes: "Standard progression",
          },
        ],
      },
      reasoning: "Fallback workout plan",
      adaptations: {},
      tips: ["Focus on proper form"],
      estimatedDuration: context?.availableTime || 45,
      difficultyLevel: userProfile?.experienceLevel || "intermediate",
    };
  }

  /**
   * Calculate batch confidence combining multiple analyses
   * @param {Array<Object>} analysesData - Array of exercise analyses
   * @param {Object} aiResponse - AI batch response
   * @returns {number} Overall batch confidence
   * @private
   */
  _calculateBatchConfidence(analysesData, aiResponse) {
    if (!aiResponse.suggestions || aiResponse.suggestions.length === 0) {
      return 0.5;
    }

    // Calculate average confidence across all suggestions
    const avgAIConfidence =
      aiResponse.suggestions.reduce(
        (sum, suggestion) => sum + (suggestion.confidence || 0.5),
        0
      ) / aiResponse.suggestions.length;

    // Calculate average rule-based confidence
    const avgRuleConfidence =
      analysesData.reduce(
        (sum, analysis) => sum + (analysis.confidenceLevel || 0.5),
        0
      ) / analysesData.length;

    // Weighted combination: 60% rule-based + 40% AI
    return avgRuleConfidence * 0.6 + avgAIConfidence * 0.4;
  }

  /**
   * Generate batch fallback suggestions when AI fails
   * @param {Array<Object>} analysesData - Array of exercise analyses
   * @returns {Object} Batch fallback suggestions
   * @private
   */
  _generateBatchFallbackSuggestions(analysesData) {
    return {
      suggestions: analysesData.map((analysis) => ({
        exerciseId: analysis.exerciseId,
        exerciseName: analysis.exerciseName,
        suggestion: "Continue with rule-based progression",
        reasoning: `Based on ${analysis.totalSessions} sessions of data`,
        confidence: analysis.confidenceLevel || 0.5,
        riskFactors: [],
        benefits: ["Consistent progression"],
      })),
      overallInsights: {
        trainingBalance: "Using rule-based progression for balanced training",
        recoveryRecommendations: ["Monitor form and recovery between sessions"],
        priorityExercises: analysesData.slice(0, 3).map((a) => a.exerciseName),
      },
      processedCount: analysesData.length,
      fallbackReason: "AI service temporarily unavailable",
    };
  }

  /**
   * Log debug information (simple implementation)
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @private
   */
  _log(message, data = {}) {
    if (import.meta.env?.MODE === "development") {
      console.log(`[GeminiAI] ${message}`, data);
    }
  }

  /**
   * Delay utility for retries
   * @private
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if Gemini API is available
   * @returns {Promise<boolean>}
   */
  async isApiAvailable() {
    try {
      console.log("Testing Gemini API availability...");
      console.log(
        "API Key configured:",
        this.config.apiKey !== "your-gemini-api-key-here"
      );

      const testPrompt =
        "Respond with just the word 'OK' if you can understand this message.";
      const result = await this._makeGeminiRequest(testPrompt);
      const responseText = await result.response.text();

      console.log("Gemini API test response:", responseText);

      const isAvailable = responseText.includes("OK");
      console.log("Gemini API available:", isAvailable);

      return isAvailable;
    } catch (error) {
      console.warn("Gemini API not available:", error);
      console.log(
        "API Key starts with:",
        this.config.apiKey?.substring(0, 10) + "..."
      );
      return false;
    }
  }

  /**
   * Handle different types of Gemini API errors with specific guidance
   * @param {string} operation - What operation failed
   * @param {Error} error - The error object
   * @private
   */
  _handleGeminiError(operation, error) {
    const errorMessage = error.message || error.toString();

    if (
      errorMessage.includes("API_KEY_INVALID") ||
      errorMessage.includes("API key")
    ) {
      console.error(`❌ Gemini ${operation} failed: Invalid API Key`);
      console.error("🔧 Fix: Check your API key in .env file");
      console.error("📖 Guide: see GEMINI_API_SETUP.md");
    } else if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      console.error(`❌ Gemini ${operation} failed: Quota/Rate Limit`);
      console.error("📊 Reason: Too many requests");
      console.error("🔧 Options:");
      console.error("   • Wait for quota reset (shown in error details)");
      console.error("   • Upgrade to paid plan: https://ai.google.dev/pricing");
      console.error(
        "💡 Note: Falling back to rule-based suggestions (still intelligent!)"
      );
    } else if (errorMessage.includes("PERMISSION_DENIED")) {
      console.error(`❌ Gemini ${operation} failed: Permission Denied`);
      console.error("🔧 Fix: Enable Gemini API in Google Cloud Console");
    } else if (errorMessage.includes("timeout")) {
      console.error(`❌ Gemini ${operation} failed: Request Timeout`);
      console.error("🔧 Fix: Check internet connection or increase timeout");
    } else {
      console.error(`❌ Gemini ${operation} failed:`, errorMessage);
      console.error("🔧 Check: Network connection and API status");
    }

    console.log("🛡️ Using rule-based fallback system");
  }

  /**
   * Get API usage statistics
   * @returns {Object} Usage stats
   */
  getUsageStats() {
    // Implementation would track API calls, costs, response times
    return {
      totalRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      estimatedCost: 0,
    };
  }
}

// Export singleton instance
export default new GeminiAIService();

// Export class for testing
export { GeminiAIService };
