import { HfInference } from "@huggingface/inference";
import geminiConfig from "../config/geminiConfig";
import exerciseVectorSearchService from "./exerciseVectorSearchService";
import { fetchExerciseForRAG } from "./localExerciseService";

const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const DEFAULT_RETRY_DELAY_MS = 750;
const RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

class HuggingFaceService {
  constructor(config = geminiConfig) {
    this.config = config;
    this.client = null;
    this.supabase = null;
    this.requestCache = new Map();
    this.pendingRequests = new Map();
    this.requestCount = 0;
    this.requestCountResetTime = Date.now();
    this.circuitBreaker = {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: 0,
      threshold: 2,
      timeout: 10 * 60 * 1000,
    };

    if (typeof window !== "undefined") {
      setInterval(() => this.cleanup(), FIVE_MINUTES);
    }
  }

  setSupabase(supabase) {
    this.supabase = supabase;
    exerciseVectorSearchService.setSupabase(supabase);
  }

  _getClient() {
    if (this.client) {
      return this.client;
    }

    if (!this.config.apiKey) {
      throw new Error("Hugging Face API key is missing");
    }

    this.client = new HfInference(this.config.apiKey);
    return this.client;
  }

  _isEnabled() {
    return !!this.config.apiKey && !this.config.emergencyDisable && this.config.useGeminiAI;
  }

  _isCircuitOpen() {
    if (!this.circuitBreaker.isOpen) {
      return false;
    }

    if (Date.now() - this.circuitBreaker.lastFailureTime > this.circuitBreaker.timeout) {
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failureCount = 0;
      return false;
    }

    return true;
  }

  _recordFailure() {
    this.circuitBreaker.failureCount += 1;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failureCount >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
    }
  }

  _resetCircuitBreaker() {
    this.circuitBreaker.isOpen = false;
    this.circuitBreaker.failureCount = 0;
  }

  _incrementRequestCount() {
    const now = Date.now();
    if (now - this.requestCountResetTime > ONE_HOUR) {
      this.requestCount = 0;
      this.requestCountResetTime = now;
    }
    this.requestCount += 1;
  }

  _sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  _withTimeout(promise, timeoutMs) {
    if (!timeoutMs || timeoutMs <= 0) {
      return promise;
    }

    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Hugging Face request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  }

  _getErrorStatus(error) {
    return (
      error?.status ||
      error?.statusCode ||
      error?.response?.status ||
      error?.cause?.status ||
      null
    );
  }

  _getRetryAfterMs(error) {
    const retryAfterHeader =
      error?.response?.headers?.["retry-after"] ||
      error?.response?.headers?.get?.("retry-after");

    if (!retryAfterHeader) {
      return null;
    }

    const seconds = Number.parseFloat(retryAfterHeader);
    if (Number.isFinite(seconds)) {
      return seconds * 1000;
    }

    const retryAt = Date.parse(retryAfterHeader);
    if (Number.isFinite(retryAt)) {
      return Math.max(retryAt - Date.now(), 0);
    }

    return null;
  }

  _isRetryableError(error) {
    const status = this._getErrorStatus(error);

    if (status && RETRYABLE_STATUS_CODES.has(status)) {
      return true;
    }

    const message = error?.message?.toLowerCase?.() || "";
    return (
      message.includes("timed out") ||
      message.includes("timeout") ||
      message.includes("rate limit") ||
      message.includes("temporarily unavailable") ||
      message.includes("network")
    );
  }

  _getRetryDelayMs(error, attempt) {
    const retryAfterMs = this._getRetryAfterMs(error);
    if (retryAfterMs !== null) {
      return retryAfterMs;
    }

    return DEFAULT_RETRY_DELAY_MS * 2 ** Math.max(attempt - 1, 0);
  }

  async _runCachedRequest(cacheKey, requestFn) {
    const cached = this.requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < FIVE_MINUTES) {
      return cached.result;
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = requestFn();
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.requestCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _makeRequest(systemPrompt, userPrompt) {
    if (!this._isEnabled()) {
      throw new Error("Hugging Face service is disabled");
    }

    if (this._isCircuitOpen()) {
      throw new Error("Hugging Face service circuit breaker is open");
    }

    const totalAttempts = Math.max(1, (this.config.maxRetries || 0) + 1);

    for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
      try {
        this._incrementRequestCount();
        const client = this._getClient();
        const response = await this._withTimeout(
          client.chatCompletion({
            model: this.config.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: this.config.temperature,
            max_tokens: this.config.maxTokens,
            response_format: { type: "json_object" },
          }),
          this.config.requestTimeout
        );

        this._resetCircuitBreaker();
        return response.choices?.[0]?.message?.content ?? "{}";
      } catch (error) {
        const shouldRetry =
          attempt < totalAttempts && this._isRetryableError(error);

        if (!shouldRetry) {
          this._recordFailure();
          throw error;
        }

        await this._sleep(this._getRetryDelayMs(error, attempt));
      }
    }

    throw new Error("Hugging Face request failed unexpectedly");
  }

  _extractJsonFromResponse(text) {
    try {
      return JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch?.[1]) {
        return JSON.parse(jsonMatch[1].trim());
      }

      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start >= 0 && end > start) {
        return JSON.parse(text.slice(start, end + 1));
      }

      throw new Error("Could not extract valid JSON from AI response");
    }
  }

  _formatWorkoutHistory(workoutHistory = [], limit = 3) {
    if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) {
      return "No recent workouts available";
    }

    return workoutHistory.slice(0, limit).map((workout) => {
      const date =
        typeof workout.timestamp?.toDate === "function"
          ? workout.timestamp.toDate().toLocaleDateString()
          : workout.timestamp || "unknown date";
      const exercises = (workout.exercises || []).slice(0, 5).map((exercise) => {
        const name = exercise.name || exercise.exerciseName || "exercise";
        return `${name}: ${exercise.weight || 0}kg x ${exercise.reps || 0}`;
      });

      return `Session ${date}\n${exercises.join("\n")}`;
    }).join("\n\n");
  }

  async generateProgressionSuggestions(analysisData, userProfile, workoutHistory) {
    const cacheKey = `progression:${analysisData.exerciseId}:${analysisData.currentWeight}:${analysisData.currentReps}`;

    return this._runCachedRequest(cacheKey, async () => {
      const ragContext = analysisData.exerciseId
        ? await fetchExerciseForRAG(analysisData.exerciseId).catch(() => null)
        : null;
      const { system, prompt } = this._buildProgressionPrompt(
        analysisData,
        userProfile,
        workoutHistory,
        ragContext
      );
      const response = await this._makeRequest(system, prompt);
      return this._extractJsonFromResponse(response);
    });
  }

  async generateBatchProgressionSuggestions(analysesData, userProfile, workoutHistory) {
    const exerciseIds = analysesData.map((analysis) => analysis.exerciseId).sort().join(",");
    const cacheKey = `batch:${exerciseIds}`;

    return this._runCachedRequest(cacheKey, async () => {
      const ragContexts = await Promise.all(
        analysesData.map(async (analysis) => {
          if (!analysis.exerciseId) {
            return null;
          }
          return fetchExerciseForRAG(analysis.exerciseId).catch(() => null);
        })
      );

      const { system, prompt } = this._buildBatchProgressionPrompt(
        analysesData,
        userProfile,
        workoutHistory,
        ragContexts.filter(Boolean)
      );
      const response = await this._makeRequest(system, prompt);
      return this._extractJsonFromResponse(response);
    });
  }

  async generatePlateauInterventions(plateauData, userProfile, pastInterventions = []) {
    const cacheKey = `plateau:${plateauData.exerciseId}:${plateauData.plateauDuration}:${plateauData.severity}`;
    return this._runCachedRequest(cacheKey, async () => {
      const { system, prompt } = this._buildPlateauPrompt(
        plateauData,
        userProfile,
        pastInterventions
      );
      const response = await this._makeRequest(system, prompt);
      return this._extractJsonFromResponse(response);
    });
  }

  async generateWorkoutRecommendations(context, userProfile, recentWorkouts) {
    const cacheKey = `workout:${context.workoutType}:${context.availableTime}:${(context.targetMuscleGroups || []).join(",")}`;
    return this._runCachedRequest(cacheKey, async () => {
      const relevantExercises = await exerciseVectorSearchService.searchRelevantExercises(context, {
        limit: 5,
      });
      const { system, prompt } = this._buildWorkoutPrompt(
        context,
        userProfile,
        recentWorkouts,
        relevantExercises
      );
      const response = await this._makeRequest(system, prompt);
      return this._extractJsonFromResponse(response);
    });
  }

  async generateWorkoutAnalysis(exercise, completedSets) {
    const cacheKey = `coach:${exercise.name}:${completedSets.length}:${completedSets.map((set) => `${set.weight}-${set.reps}`).join("|")}`;
    return this._runCachedRequest(cacheKey, async () => {
      const { system, prompt } = this._buildWorkoutAnalysisPrompt(exercise, completedSets);
      const response = await this._makeRequest(system, prompt);
      return this._extractJsonFromResponse(response);
    });
  }

  _buildProgressionPrompt(analysisData, userProfile, workoutHistory, ragContext) {
    const system =
      "You are an expert fitness AI coach. Respond with JSON only and no markdown.";
    const ragBlock = ragContext
      ? `\nEXERCISE CONTEXT:\n${ragContext}\n`
      : "";
    const prompt = `USER PROFILE:
- Experience Level: ${userProfile.experienceLevel}
- Age: ${userProfile.age}
- Training Frequency: ${userProfile.trainingFrequency} sessions/week
- Preferred Style: ${userProfile.preferredProgressionStyle}
- Bodyweight: ${userProfile.bodyweight}kg
${ragBlock}
CURRENT ANALYSIS DATA:
${JSON.stringify(analysisData, null, 2)}

RECENT WORKOUT HISTORY:
${this._formatWorkoutHistory(workoutHistory)}

Respond as JSON:
{
  "primarySuggestion": {
    "exerciseId": "string",
    "exerciseName": "string",
    "suggestion": "string",
    "reasoning": "string",
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

    return { system, prompt };
  }

  _buildBatchProgressionPrompt(analysesData, userProfile, workoutHistory, ragContexts) {
    const system =
      "You are an expert fitness AI coach. Respond with JSON only and no markdown.";
    const ragBlock =
      ragContexts.length > 0
        ? `\nEXERCISE CONTEXT:\n${ragContexts.join("\n\n")}\n`
        : "";
    const prompt = `USER PROFILE:
- Experience Level: ${userProfile.experienceLevel}
- Age: ${userProfile.age}
- Training Frequency: ${userProfile.trainingFrequency} sessions/week
- Preferred Style: ${userProfile.preferredProgressionStyle}
- Bodyweight: ${userProfile.bodyweight}kg
${ragBlock}
EXERCISES TO ANALYZE:
${analysesData.map((analysis, index) => `Exercise ${index + 1}: ${analysis.exerciseName}
- Current Weight: ${analysis.currentWeight}kg
- Current Reps: ${analysis.currentReps}
- Current Sets: ${analysis.currentSets}
- Progression Trend: ${analysis.progressionTrend}
- Confidence Level: ${analysis.confidenceLevel}
- Total Sessions: ${analysis.totalSessions}`).join("\n\n")}

RECENT WORKOUT HISTORY:
${this._formatWorkoutHistory(workoutHistory)}

Respond as JSON:
{
  "suggestions": [
    {
      "exerciseId": "string",
      "exerciseName": "string",
      "suggestion": "string",
      "reasoning": "string",
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

    return { system, prompt };
  }

  _buildPlateauPrompt(plateauData, userProfile, pastInterventions) {
    const system =
      "You are an expert fitness AI coach. Respond with JSON only and no markdown.";
    const prompt = `USER PROFILE:
- Experience Level: ${userProfile.experienceLevel}
- Plateau Tolerance: ${userProfile.plateauTolerance} sessions
- Preferred Style: ${userProfile.preferredProgressionStyle}

PLATEAU DATA:
${JSON.stringify(plateauData, null, 2)}

PAST INTERVENTIONS:
${JSON.stringify(pastInterventions, null, 2)}

Respond as JSON:
{
  "interventions": [
    {
      "type": "string",
      "title": "string",
      "description": "string",
      "implementation": {
        "duration": "string",
        "parameters": {},
        "progressionPlan": "string"
      },
      "reasoning": "string",
      "confidence": 0.8,
      "expectedTimeframe": "string"
    }
  ],
  "explanation": "string",
  "expectedOutcome": "string",
  "timeframe": "string",
  "preventionTips": ["string"]
}`;
    return { system, prompt };
  }

  _buildWorkoutPrompt(context, userProfile, recentWorkouts, relevantExercises = []) {
    const system =
      "You are an expert fitness AI coach. Respond with JSON only and no markdown.";
    const relevantExerciseBlock =
      relevantExercises.length > 0
        ? `\nSEMANTIC EXERCISE MATCHES:\n${JSON.stringify(relevantExercises, null, 2)}\n`
        : "";
    const prompt = `WORKOUT CONTEXT:
${JSON.stringify(context, null, 2)}

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

RECENT WORKOUTS:
${this._formatWorkoutHistory(recentWorkouts)}
${relevantExerciseBlock}

Respond as JSON:
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
        "notes": "string"
      }
    ]
  },
  "reasoning": "string",
  "adaptations": {
    "timeConstrained": "string",
    "equipmentLimited": "string",
    "fatigue": "string"
  },
  "tips": ["string"],
  "estimatedDuration": 45,
  "difficultyLevel": "intermediate"
}`;
    return { system, prompt };
  }

  _buildWorkoutAnalysisPrompt(exercise, completedSets) {
    const system =
      "You are an expert fitness AI coach. Respond with JSON only and no markdown.";
    const prompt = `EXERCISE:
${JSON.stringify(exercise, null, 2)}

COMPLETED SETS:
${JSON.stringify(completedSets, null, 2)}

Respond as JSON:
{
  "avgWeight": "135.5lbs",
  "avgReps": "9.5",
  "formScore": "95%",
  "insight": "string",
  "quality": "Excellent",
  "confidence": "92%"
}`;
    return { system, prompt };
  }

  async isAvailable() {
    return this._isEnabled() && !this._isCircuitOpen();
  }

  getUsageStats() {
    return {
      totalRequests: this.requestCount,
      pendingRequests: this.pendingRequests.size,
      cachedResults: this.requestCache.size,
      circuitBreakerStatus: this.circuitBreaker.isOpen ? "OPEN" : "CLOSED",
      failureCount: this.circuitBreaker.failureCount,
      requestsThisHour: this.requestCount,
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.requestCache.entries()) {
      if (now - value.timestamp > FIVE_MINUTES) {
        this.requestCache.delete(key);
      }
    }

    if (now - this.requestCountResetTime > ONE_HOUR) {
      this.requestCount = 0;
      this.requestCountResetTime = now;
    }
  }
}

const instance = new HuggingFaceService();

export default instance;
export { HuggingFaceService };
