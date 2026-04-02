/**
 * @fileoverview Hugging Face AI Service
 * Integrates Hugging Face's Inference API for intelligent fitness coaching and analysis,
 * completely replacing the deprecated Gemini integration.
 */

import { HfInference } from "@huggingface/inference";
import { fetchExerciseForRAG } from "./localExerciseService";

// Get environment variables in a Vite-compatible way
const getEnvVar = (key, defaultValue = "") => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  if (typeof process !== "undefined" && process?.env) {
    return process.env[key] || defaultValue;
  }
  if (typeof window !== "undefined" && window.env) {
    return window.env[key] || defaultValue;
  }
  return defaultValue;
};

// Global instance
let hfModel = null;

const initializeHF = () => {
  const apiKey = getEnvVar("VITE_HF_API_KEY");
  if (!apiKey) {
    console.warn("Hugging Face API key is missing. AI features will fail or fallback.");
    return false;
  }
  if (hfModel) return true;
  
  try {
    hfModel = new HfInference(apiKey);
    return true;
  } catch (error) {
    console.error("Error initializing Hugging Face API:", error);
    return false;
  }
};

// Config Settings
const hfConfig = {
  model: "Qwen/Qwen2.5-72B-Instruct", // Top tier open weights model, excellent for JSON formatting
  temperature: 0.4, // Lower temperature for more deterministic coaching advice
  maxTokens: 1500,
  emergencyDisable: false,
};

class HuggingFaceService {
  constructor() {
    this.disabled = !initializeHF();
    this.requestCache = new Map();
    this.pendingRequests = new Map();
  }

  /**
   * Helper to execute inference using the serverless HF api
   */
  async _makeRequest(systemPrompt, userPrompt) {
    if (this.disabled || hfConfig.emergencyDisable) {
      throw new Error("AI Service is disabled.");
    }
    
    try {
      const response = await hfModel.chatCompletion({
        model: hfConfig.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: hfConfig.temperature,
        max_tokens: hfConfig.maxTokens,
        response_format: { type: "json_object" } // Tell Qwen to strictly format as json
      });
      
      return response.choices[0].message.content;
    } catch (err) {
      console.error("HF Inference API Error:", err);
      throw err;
    }
  }

  /**
   * Safe JSON extraction from marked down output ```json ... ```
   */
  _extractJsonFromResponse(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      // Try to extract from markdown blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1].trim());
        } catch (e2) {
          console.error("Failed to parse extracted JSON:", e2);
        }
      }
      
      // Attempt to find the first { and last }
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(text.substring(start, end + 1));
        } catch (e3) {
          console.error("Failed to parse bracketed JSON:", e3);
        }
      }
      
      throw new Error("Could not extract valid JSON from AI response");
    }
  }

  /**
   * Generate progression suggestions for a single exercise
   */
  async generateProgressionSuggestions(analysisData, userProfile, workoutHistory) {
    const requestKey = `prog_hf_${analysisData.exerciseId}_${analysisData.currentWeight}_${analysisData.currentReps}`;

    // Cache logic
    const cached = this.requestCache.get(requestKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) return cached.result;
    if (this.pendingRequests.has(requestKey)) return this.pendingRequests.get(requestKey);

    const exerciseRagContext = await fetchExerciseForRAG(analysisData.exerciseId);

    const requestPromise = this._executeProgressionRequest(analysisData, userProfile, workoutHistory, exerciseRagContext);
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      this.requestCache.set(requestKey, { result, timestamp: Date.now() });
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  async _executeProgressionRequest(analysisData, userProfile, workoutHistory, ragContext) {
    try {
      const { system, prompt } = this._buildProgressionPrompt(analysisData, userProfile, workoutHistory, ragContext);
      const responseText = await this._makeRequest(system, prompt);
      const aiResponse = this._extractJsonFromResponse(responseText);

      return {
        ...aiResponse,
        confidence: 0.85, // Stub standard confidence for now
        reasoning: aiResponse.reasoning,
        alternatives: aiResponse.alternatives || [],
        personalizedTips: aiResponse.personalizedTips || [],
      };
    } catch (error) {
      console.error("HF Inference error, returning null to force rule-based fallback:", error);
      return null;
    }
  }

  /**
   * Generate progression suggestions for multiple exercises
   */
  async generateBatchProgressionSuggestions(analysesData, userProfile, workoutHistory) {
    const exerciseIds = analysesData.map((a) => a.exerciseId).sort().join(",");
    const requestKey = `batch_hf_${exerciseIds}_${Date.now() - (Date.now() % (5 * 60 * 1000))}`;

    const cached = this.requestCache.get(requestKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) return cached.result;
    if (this.pendingRequests.has(requestKey)) return this.pendingRequests.get(requestKey);

    const ragContexts = [];
    for (const a of analysesData) {
      if (a.exerciseId) {
        const rag = await fetchExerciseForRAG(a.exerciseId);
        if (rag) ragContexts.push(rag);
      }
    }

    const requestPromise = this._executeBatchProgressionRequest(analysesData, userProfile, workoutHistory, ragContexts);
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      this.requestCache.set(requestKey, { result, timestamp: Date.now() });
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  async _executeBatchProgressionRequest(analysesData, userProfile, workoutHistory, ragContexts) {
    try {
      const { system, prompt } = this._buildBatchProgressionPrompt(analysesData, userProfile, workoutHistory, ragContexts);
      const responseText = await this._makeRequest(system, prompt);
      const aiResponse = this._extractJsonFromResponse(responseText);

      return {
        suggestions: aiResponse.suggestions || [],
        overallInsights: aiResponse.overallInsights,
        batchConfidence: 0.85,
        processedCount: analysesData.length,
      };
    } catch (error) {
      console.error("HF batch API error, returning empty to force rule-based fallback:", error);
      return null;
    }
  }

  // PRocess Prompts Arrays
  _buildProgressionPrompt(analysisData, userProfile, workoutHistory, ragContext) {
    const system = "You are an expert fitness AI coach analyzing a user's workout progression data. Your entire response MUST be valid JSON, strictly adhering to the schema provided. Do not include markdown wraps or conversational chatter outside the JSON.";
    
    // Stringify simple history into a Markdown Table for History RAG
    let historyStr = "No recent workouts available";
    if (workoutHistory && workoutHistory.length > 0) {
      historyStr = "| Date | Exercise | Weight (kg) | Reps |\n|---|---|---|---|\n";
      workoutHistory.slice(0, 3).forEach(w => {
        const date = w.timestamp?.toDate ? w.timestamp.toDate().toLocaleDateString() : 'unknown';
        (w.exercises || []).slice(0, 5).forEach(e => {
          const exName = e.name || e.exerciseName || 'exercise';
          historyStr += `| ${date} | ${exName} | ${e.weight || 0} | ${e.reps || 0} |\n`;
        });
      });
    }

    const ragStr = ragContext ? `\nEXERCISE MECHANICS (RAG CONTEXT):\n${ragContext}\n` : '';

    const prompt = `USER PROFILE:
- Experience Level: ${userProfile.experienceLevel}
- Age: ${userProfile.age}
- Training Frequency: ${userProfile.trainingFrequency} sessions/week
- Preferred Style: ${userProfile.preferredProgressionStyle}
- Bodyweight: ${userProfile.bodyweight}kg
${ragStr}
CURRENT ANALYSIS DATA:
${JSON.stringify(analysisData, null, 2)}

RECENT WORKOUT HISTORY:
${historyStr}

TASK: Provide intelligent progression suggestions that enhance the rule-based analysis.

Respond strictly in JSON format:
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

    return { system, prompt };
  }

  _buildBatchProgressionPrompt(analysesData, userProfile, workoutHistory, ragContexts) {
    const system = "You are an expert fitness AI coach analyzing multiple exercises for progression optimization. Your entire response MUST be valid JSON, strictly adhering to the schema provided.";
    
    // Stringify simple history into a Markdown Table for History RAG
    let historyStr = "No recent workouts available";
    if (workoutHistory && workoutHistory.length > 0) {
      historyStr = "| Date | Exercise | Weight (kg) | Reps |\n|---|---|---|---|\n";
      workoutHistory.slice(0, 3).forEach(w => {
        const date = w.timestamp?.toDate ? w.timestamp.toDate().toLocaleDateString() : 'unknown';
        (w.exercises || []).slice(0, 5).forEach(e => {
          const exName = e.name || e.exerciseName || 'exercise';
          historyStr += `| ${date} | ${exName} | ${e.weight || 0} | ${e.reps || 0} |\n`;
        });
      });
    }

    const ragStr = ragContexts && ragContexts.length > 0 
      ? `\nEXERCISE MECHANICS (RAG CONTEXT):\n${ragContexts.join('\n')}\n` 
      : '';

    const prompt = `USER PROFILE:
- Experience Level: ${userProfile.experienceLevel}
- Age: ${userProfile.age}
${ragStr}
EXERCISES TO ANALYZE:
${analysesData.map((a, i) => `Exercise ${i + 1}: ${a.exerciseName} | Wgt: ${a.currentWeight}kg | Reps: ${a.currentReps} | Trend: ${a.progressionTrend}`).join("\n")}

RECENT WORKOUT HISTORY:
${historyStr}

TASK: Provide progression suggestions for ALL exercises in a single response, optimizing fatigue management and balanced progression.

Respond strictly in JSON format:
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

    return { system, prompt };
  }

  async generatePlateauInterventions(plateauData, userProfile, pastInterventions) {
    console.warn("generatePlateauInterventions not yet implemented in huggingFaceService");
    return null;
  }
  
  async generateWorkoutRecommendations(context, userProfile, recentWorkouts) {
    console.warn("generateWorkoutRecommendations not yet implemented in huggingFaceService");
    return null;
  }
}

// Singleton pattern
const instance = new HuggingFaceService();
export default instance;
