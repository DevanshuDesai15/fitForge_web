/**
 * @fileoverview Browser-safe configuration for the active AI provider.
 * Legacy Gemini-era properties and environment variables remain supported as
 * deprecated aliases while Hugging Face remains the active provider.
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
  VITE_AI_PROVIDER_PRIORITY: import.meta.env.VITE_AI_PROVIDER_PRIORITY,
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

  if (typeof process !== "undefined" && process?.env) {
    return process.env[key] || defaultValue;
  }

  if (typeof window !== "undefined" && window.env) {
    return window.env[key] || defaultValue;
  }

  const envVars = {
    VITE_USE_GEMINI_AI: "true",
    VITE_HYBRID_MODE: "true",
    VITE_GEMINI_PRIORITY: "0.4",
    VITE_GEMINI_TIMEOUT: "8000",
    VITE_GEMINI_MAX_RETRIES: "1",
  };

  return envVars[key] || defaultValue;
};

const useAIProvider =
  (getEnvVar("VITE_USE_HUGGINGFACE_AI") ||
    getEnvVar("VITE_USE_GEMINI_AI", "true")) === "true";

const providerPriority = parseFloat(
  getEnvVar("VITE_AI_PROVIDER_PRIORITY") ||
    getEnvVar("VITE_GEMINI_PRIORITY", "0.4")
);

export const aiProviderConfig = {
  provider: "huggingface",

  useAIProvider,
  hybridMode:
    (getEnvVar("VITE_HUGGINGFACE_HYBRID_MODE") ||
      getEnvVar("VITE_HYBRID_MODE", "true")) === "true",
  emergencyDisable:
    (getEnvVar("VITE_HUGGINGFACE_EMERGENCY_DISABLE") ||
      getEnvVar("VITE_GEMINI_EMERGENCY_DISABLE", "false")) === "true",
  providerPriority,
  requestTimeout: parseInt(
    getEnvVar("VITE_HUGGINGFACE_TIMEOUT") ||
      getEnvVar("VITE_GEMINI_TIMEOUT", "20000")
  ),
  maxRetries: parseInt(
    getEnvVar("VITE_HUGGINGFACE_MAX_RETRIES") ||
      getEnvVar("VITE_GEMINI_MAX_RETRIES", "0")
  ),
  enableLogging: getEnvVar("NODE_ENV", "production") === "development",
  maxRequestsPerUser: parseInt(getEnvVar("VITE_MAX_REQUESTS_PER_USER", "100")),
  maxRequestsPerDay: parseInt(getEnvVar("VITE_MAX_REQUESTS_PER_DAY", "1000")),

  // Deprecated JavaScript aliases. New consumers must use the names above.
  useGeminiAI: useAIProvider,
  geminiPriority: providerPriority,
};

export const getAIProviderApiKey = () => aiProviderConfig.apiKey;

export const normalizeAIProviderOptions = (config = {}) => ({
  ...config,
  useAIProvider: config.useAIProvider ?? config.useGeminiAI ?? true,
  providerPriority:
    config.providerPriority ?? config.geminiPriority ?? 0.4,
});

/** @deprecated Use getAIProviderApiKey. */
export const getGeminiApiKey = getAIProviderApiKey;

export default aiProviderConfig;
