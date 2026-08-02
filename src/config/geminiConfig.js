/**
 * @fileoverview AI provider configuration
 * Maintains legacy Gemini-era exports for compatibility while resolving
 * Hugging Face settings as the active generative provider.
 */

// Keep this list explicit. Dynamic access to import.meta.env causes Vite to
// serialize every VITE_* variable into the browser bundle, including unrelated
// legacy credentials that may still exist in a developer's local environment.
const browserEnv = {
  VITE_USE_HUGGINGFACE_AI: import.meta.env.VITE_USE_HUGGINGFACE_AI,
  VITE_USE_GEMINI_AI: import.meta.env.VITE_USE_GEMINI_AI,
  VITE_HUGGINGFACE_HYBRID_MODE:
    import.meta.env.VITE_HUGGINGFACE_HYBRID_MODE,
  VITE_HYBRID_MODE: import.meta.env.VITE_HYBRID_MODE,
  VITE_HUGGINGFACE_EMERGENCY_DISABLE:
    import.meta.env.VITE_HUGGINGFACE_EMERGENCY_DISABLE,
  VITE_GEMINI_EMERGENCY_DISABLE:
    import.meta.env.VITE_GEMINI_EMERGENCY_DISABLE,
  VITE_GEMINI_PRIORITY: import.meta.env.VITE_GEMINI_PRIORITY,
  VITE_HUGGINGFACE_TIMEOUT: import.meta.env.VITE_HUGGINGFACE_TIMEOUT,
  VITE_GEMINI_TIMEOUT: import.meta.env.VITE_GEMINI_TIMEOUT,
  VITE_HUGGINGFACE_MAX_RETRIES:
    import.meta.env.VITE_HUGGINGFACE_MAX_RETRIES,
  VITE_GEMINI_MAX_RETRIES: import.meta.env.VITE_GEMINI_MAX_RETRIES,
  VITE_MAX_REQUESTS_PER_USER: import.meta.env.VITE_MAX_REQUESTS_PER_USER,
  VITE_MAX_REQUESTS_PER_DAY: import.meta.env.VITE_MAX_REQUESTS_PER_DAY,
  NODE_ENV: import.meta.env.MODE,
};

const getEnvVar = (key, defaultValue = "") => {
  if (browserEnv[key]) {
    return browserEnv[key];
  }

  // Fallback for Node.js environment (SSR, build process)
  if (typeof process !== "undefined" && process?.env) {
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
