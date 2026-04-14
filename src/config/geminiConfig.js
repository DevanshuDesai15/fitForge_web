/**
 * @fileoverview AI provider configuration
 * Maintains legacy Gemini-era exports for compatibility while resolving
 * Hugging Face settings as the active generative provider.
 */

// Get environment variables in a Vite-compatible way
const getEnvVar = (key, defaultValue = "") => {
  // Vite environment variables
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }

  // Fallback for Node.js environment (SSR, build process)
  // eslint-disable-next-line no-undef
  if (typeof process !== "undefined" && process?.env) {
    // eslint-disable-next-line no-undef
    return process.env[key] || defaultValue;
  }

  // Fallback for window-based environments
  if (typeof window !== "undefined" && window.env) {
    return window.env[key] || defaultValue;
  }

  // Development fallback values (do not include API key here - it should come from env)
  const envVars = {
    VITE_USE_GEMINI_AI: "true",
    VITE_HYBRID_MODE: "true",
    VITE_GEMINI_PRIORITY: "0.4",
    VITE_GEMINI_TIMEOUT: "8000",
    VITE_GEMINI_MAX_RETRIES: "1",
  };

  return envVars[key] || defaultValue;
};

export const geminiConfig = {
  // API Configuration
  apiKey:
    getEnvVar("VITE_HUGGINGFACE_API_KEY") ||
    getEnvVar("VITE_HF_API_KEY") ||
    getEnvVar("VITE_GEMINI_API_KEY"),
  model:
    getEnvVar("VITE_HUGGINGFACE_MODEL") ||
    getEnvVar("VITE_HF_MODEL") ||
    "Qwen/Qwen2.5-72B-Instruct",
  provider: "huggingface",

  // Feature Flags
  useGeminiAI:
    (getEnvVar("VITE_USE_HUGGINGFACE_AI") ||
      getEnvVar("VITE_USE_GEMINI_AI", "true")) === "true",
  hybridMode:
    (getEnvVar("VITE_HUGGINGFACE_HYBRID_MODE") ||
      getEnvVar("VITE_HYBRID_MODE", "true")) === "true",

  // Emergency kill switch for the generative provider
  emergencyDisable:
    (getEnvVar("VITE_HUGGINGFACE_EMERGENCY_DISABLE") ||
      getEnvVar("VITE_GEMINI_EMERGENCY_DISABLE", "false")) === "true",

  // Performance Settings
  geminiPriority: parseFloat(getEnvVar("VITE_GEMINI_PRIORITY", "0.4")),
  requestTimeout: parseInt(
    getEnvVar("VITE_HUGGINGFACE_TIMEOUT") ||
      getEnvVar("VITE_GEMINI_TIMEOUT", "20000")
  ),
  maxRetries: parseInt(
    getEnvVar("VITE_HUGGINGFACE_MAX_RETRIES") ||
      getEnvVar("VITE_GEMINI_MAX_RETRIES", "0")
  ),
  temperature: parseFloat(
    getEnvVar("VITE_HUGGINGFACE_TEMPERATURE", "0.4")
  ),
  maxTokens: parseInt(getEnvVar("VITE_HUGGINGFACE_MAX_TOKENS", "1500")),

  // Development Settings
  enableLogging: getEnvVar("NODE_ENV", "production") === "development",

  // Cost Management
  maxRequestsPerUser: parseInt(getEnvVar("VITE_MAX_REQUESTS_PER_USER", "100")),
  maxRequestsPerDay: parseInt(getEnvVar("VITE_MAX_REQUESTS_PER_DAY", "1000")),
};

export const getGeminiApiKey = () => {
  return geminiConfig.apiKey;
};

export default geminiConfig;
