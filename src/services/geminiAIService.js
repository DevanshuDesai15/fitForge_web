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

    // 🔥 Rate limiting to prevent 429 errors
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 second between requests
    this.maxConcurrentRequests = 1; // Only 1 request at a time
    this.requestCount = 0;
    this.requestCountResetTime = Date.now();

    // 🔥 Request deduplication to prevent duplicate API calls
    this.pendingRequests = new Map(); // Cache ongoing requests
    this.requestCache = new Map(); // Cache recent results (5 minutes)

    // 🔥 Circuit breaker pattern to handle API failures gracefully
    this.circuitBreaker = {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: 0,
      threshold: 2, // Open circuit after 2 failures (more aggressive)
      timeout: 10 * 60 * 1000, // 10 minutes before trying again (longer)
    };

    // 🚨 Emergency brake - completely disable API if too many requests
    this.emergencyBrake = {
      isActive: false, // Start with the brake off
      dailyRequestCount: 0, // Start with 0 requests
      dailyResetTime: Date.now(),
      maxDailyRequests: 100, // Hard limit per day
      activationThreshold: 10, // Very low threshold (10 requests)
    };

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

      // 🔥 Set up automatic cleanup every 5 minutes
      if (typeof window !== "undefined") {
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
      }
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
    // 🔥 Request deduplication: create unique key for this request
    const requestKey = `progression_${analysisData.exerciseId}_${analysisData.currentWeight}_${analysisData.currentReps}`;

    // Check if we have a cached result (5 minutes)
    const cached = this.requestCache.get(requestKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      console.log(
        `✅ Using cached Gemini result for ${analysisData.exerciseId}`
      );
      return cached.result;
    }

    // Check if this exact request is already pending
    if (this.pendingRequests.has(requestKey)) {
      console.log(
        `⏳ Waiting for pending Gemini request for ${analysisData.exerciseId}`
      );
      return this.pendingRequests.get(requestKey);
    }

    // Create new request
    const requestPromise = this._executeProgressionRequest(
      analysisData,
      userProfile,
      workoutHistory
    );
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;

      // Cache the result
      this.requestCache.set(requestKey, {
        result,
        timestamp: Date.now(),
      });

      return result;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Execute the actual progression request
   * @private
   */
  async _executeProgressionRequest(analysisData, userProfile, workoutHistory) {
    // 🚨 Global kill switch: check if Gemini is completely disabled
    if (this.config.emergencyDisable || !this.config.useGeminiAI) {
      console.log(
        "🚨 GEMINI API GLOBALLY DISABLED - using rule-based fallback"
      );
      return this._generateFallbackSuggestion(analysisData);
    }

    // 🚨 Emergency brake: check if we've hit daily limits
    if (this._isEmergencyBrakeActive()) {
      console.log(
        "🚨 EMERGENCY BRAKE ACTIVE - API completely disabled for today"
      );
      return this._generateFallbackSuggestion(analysisData);
    }

    // 🔥 Circuit breaker: check if API is temporarily disabled
    if (this._isCircuitOpen()) {
      console.log(
        "🚫 Circuit breaker OPEN - using fallback (Gemini API temporarily disabled)"
      );
      return this._generateFallbackSuggestion(analysisData);
    }

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

      // 🔥 Success: reset circuit breaker
      this._resetCircuitBreaker();

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

      // 🔥 Record failure for circuit breaker
      this._recordFailure(error);

      return this._generateFallbackSuggestion(analysisData);
    }
  }

  /**
   * Check if circuit breaker is open (API temporarily disabled)
   * @private
   */
  _isCircuitOpen() {
    if (!this.circuitBreaker.isOpen) return false;

    // Check if timeout has passed
    const now = Date.now();
    if (
      now - this.circuitBreaker.lastFailureTime >
      this.circuitBreaker.timeout
    ) {
      console.log(
        "🔄 Circuit breaker timeout passed - attempting to close circuit"
      );
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failureCount = 0;
      return false;
    }

    return true;
  }

  /**
   * Record API failure for circuit breaker
   * @private
   */
  _recordFailure() {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();

    // Open circuit if threshold reached
    if (this.circuitBreaker.failureCount >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
      console.log(
        `🚫 Circuit breaker OPENED after ${this.circuitBreaker.failureCount} failures - Gemini API disabled for 5 minutes`
      );
      console.log(
        "💡 All requests will use rule-based fallbacks until circuit closes"
      );
    }
  }

  /**
   * Reset circuit breaker on successful request
   * @private
   */
  _resetCircuitBreaker() {
    if (this.circuitBreaker.failureCount > 0) {
      console.log("✅ Circuit breaker RESET - Gemini API working normally");
    }
    this.circuitBreaker.isOpen = false;
    this.circuitBreaker.failureCount = 0;
  }

  /**
   * Check if emergency brake is active (daily limit protection)
   * @private
   */
  _isEmergencyBrakeActive() {
    const now = Date.now();

    // Reset daily counter if new day
    if (now - this.emergencyBrake.dailyResetTime > 24 * 60 * 60 * 1000) {
      this.emergencyBrake.dailyRequestCount = 0;
      this.emergencyBrake.dailyResetTime = now;
      this.emergencyBrake.isActive = false;
    }

    // Check if we should activate emergency brake
    if (
      !this.emergencyBrake.isActive &&
      this.emergencyBrake.dailyRequestCount >=
        this.emergencyBrake.activationThreshold
    ) {
      this.emergencyBrake.isActive = true;
      console.log(
        `🚨 EMERGENCY BRAKE ACTIVATED - Hit ${this.emergencyBrake.dailyRequestCount} requests today`
      );
      console.log("🛡️ All Gemini API calls disabled until tomorrow");
    }

    return this.emergencyBrake.isActive;
  }

  /**
   * Increment daily request counter
   * @private
   */
  _incrementDailyCounter() {
    this.emergencyBrake.dailyRequestCount++;

    if (
      this.emergencyBrake.dailyRequestCount >=
      this.emergencyBrake.activationThreshold - 5
    ) {
      console.warn(
        `⚠️ Approaching daily limit: ${this.emergencyBrake.dailyRequestCount}/${this.emergencyBrake.activationThreshold}`
      );
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
    // 🔥 Circuit breaker: check if API is temporarily disabled
    if (this._isCircuitOpen()) {
      console.log(
        "🚫 Circuit breaker OPEN - using batch fallback (Gemini API temporarily disabled)"
      );
      return this._generateBatchFallbackSuggestions(analysesData);
    }

    // 🔥 Request deduplication for batch requests
    const exerciseIds = analysesData
      .map((a) => a.exerciseId)
      .sort()
      .join(",");
    const requestKey = `batch_${exerciseIds}_${
      Date.now() - (Date.now() % (5 * 60 * 1000))
    }`; // 5-minute buckets

    // Check cache
    const cached = this.requestCache.get(requestKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      console.log(
        `✅ Using cached batch Gemini result for ${analysesData.length} exercises`
      );
      return cached.result;
    }

    // Check pending
    if (this.pendingRequests.has(requestKey)) {
      console.log(
        `⏳ Waiting for pending batch Gemini request for ${analysesData.length} exercises`
      );
      return this.pendingRequests.get(requestKey);
    }

    const requestPromise = this._executeBatchProgressionRequest(
      analysesData,
      userProfile,
      workoutHistory
    );
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;

      // Cache the result
      this.requestCache.set(requestKey, {
        result,
        timestamp: Date.now(),
      });

      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Execute the actual batch progression request
   * @private
   */
  async _executeBatchProgressionRequest(
    analysesData,
    userProfile,
    workoutHistory
  ) {
    // 🚨 Global kill switch: check if Gemini is completely disabled
    if (this.config.emergencyDisable || !this.config.useGeminiAI) {
      console.log("🚨 GEMINI API GLOBALLY DISABLED - using batch fallback");
      return this._generateBatchFallbackSuggestions(analysesData);
    }

    // 🚨 Emergency brake: check if we've hit daily limits
    if (this._isEmergencyBrakeActive()) {
      console.log(
        "🚨 EMERGENCY BRAKE ACTIVE - batch API completely disabled for today"
      );
      return this._generateBatchFallbackSuggestions(analysesData);
    }

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

      // 🔥 Success: reset circuit breaker
      this._resetCircuitBreaker();

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

      // 🔥 Record failure for circuit breaker
      this._recordFailure(error);

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
   * Rate-limited request queue to prevent 429 errors
   * @private
   */
  async _queueRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this._processQueue();
    });
  }

  /**
   * Process the request queue with rate limiting
   * @private
   */
  async _processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { requestFn, resolve, reject } = this.requestQueue.shift();

      try {
        // Rate limiting: ensure minimum interval between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.minRequestInterval) {
          const waitTime = this.minRequestInterval - timeSinceLastRequest;
          console.log(
            `⏳ Rate limiting: waiting ${waitTime}ms before next request`
          );
          await this._delay(waitTime);
        }

        // Check daily request count (reset every hour)
        if (now - this.requestCountResetTime > 60 * 60 * 1000) {
          this.requestCount = 0;
          this.requestCountResetTime = now;
        }

        // Prevent excessive requests
        if (this.requestCount >= 50) {
          // Max 50 requests per hour
          throw new Error("Rate limit exceeded: too many requests per hour");
        }

        this.lastRequestTime = Date.now();
        this.requestCount++;
        this._incrementDailyCounter(); // Track daily usage

        console.log(
          `🔄 Making Gemini API request (${this.requestCount}/50 this hour, ${this.emergencyBrake.dailyRequestCount} today)`
        );
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        console.error("🚨 Gemini API request failed:", error.message);
        reject(error);
      }

      // Small delay between queue items
      await this._delay(100);
    }

    this.isProcessingQueue = false;
  }

  /**
   * Make request to Gemini API with retry logic and rate limiting
   * @private
   */
  async _makeGeminiRequest(prompt, retryCount = 0) {
    const requestFn = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Request timeout")),
            this.requestTimeout
          )
        );

        const requestPromise = this.model.generateContent(prompt);
        const result = await Promise.race([requestPromise, timeoutPromise]);

        console.log("✅ Gemini API request successful");
        return result;
      } catch (error) {
        // Handle specific 429 error
        if (
          error.message?.includes("429") ||
          error.message?.includes("quota") ||
          error.message?.includes("Too Many Requests")
        ) {
          console.error("🚨 429 Too Many Requests - Rate limit hit!");
          console.error("📊 Current stats:", this.getUsageStats());
          console.error("⏰ Implementing exponential backoff...");

          // Exponential backoff for rate limits: 5s, 10s, 20s
          const backoffDelay = 5000 * Math.pow(2, retryCount);
          await this._delay(backoffDelay);

          throw new Error(
            `Rate limit exceeded (429) - backing off for ${
              backoffDelay / 1000
            }s`
          );
        }

        if (retryCount < this.maxRetries) {
          console.log(
            `🔄 Gemini API retry ${retryCount + 1}/${this.maxRetries}`
          );
          await this._delay(2000 * (retryCount + 1)); // Longer exponential backoff
          return this._makeGeminiRequest(prompt, retryCount + 1);
        }
        throw error;
      }
    };

    // Queue the request to ensure rate limiting
    return this._queueRequest(requestFn);
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
    return {
      totalRequests: this.requestCount,
      pendingRequests: this.pendingRequests.size,
      cachedResults: this.requestCache.size,
      circuitBreakerStatus: this.circuitBreaker.isOpen ? "OPEN" : "CLOSED",
      failureCount: this.circuitBreaker.failureCount,
      requestsThisHour: this.requestCount,
      // Emergency brake stats
      emergencyBrakeActive: this.emergencyBrake.isActive,
      dailyRequestCount: this.emergencyBrake.dailyRequestCount,
      dailyLimit: this.emergencyBrake.activationThreshold,
    };
  }

  /**
   * Clean up expired cache entries and reset counters
   * Call this periodically to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    let cleanedCache = 0;

    // Clean expired cache entries (older than 5 minutes)
    for (const [key, value] of this.requestCache.entries()) {
      if (now - value.timestamp > 5 * 60 * 1000) {
        this.requestCache.delete(key);
        cleanedCache++;
      }
    }

    // Reset request count if hour has passed
    if (now - this.requestCountResetTime > 60 * 60 * 1000) {
      this.requestCount = 0;
      this.requestCountResetTime = now;
    }

    if (cleanedCache > 0) {
      console.log(`🧹 Cleaned ${cleanedCache} expired cache entries`);
    }
  }
}

// Export singleton instance
export default new GeminiAIService();

// Export class for testing
export { GeminiAIService };
