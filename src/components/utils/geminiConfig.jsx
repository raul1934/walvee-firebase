/**
 * ⚠️ GEMINI API - DISABLED ⚠️
 * 
 * Configuration for Gemini AI API usage across the app.
 * Currently: DISABLED - No AI calls will be made
 */

const GEMINI_API_KEY = "AIzaSyB1KK6atvIwCBXSqnFbjWePaPZD3SXW-MQ";

/**
 * Feature flag - Gemini API
 * ⚠️ SET TO FALSE TO DISABLE API AND AVOID CHARGES
 */
const ENABLE_GEMINI = false;

/**
 * Configuration object - MUST BE EXPORTED
 */
export const GEMINI_CONFIG = {
  ENABLED: ENABLE_GEMINI,
  API_KEY: GEMINI_API_KEY,
  MODEL: "gemini-2.0-flash-exp",
  PRICING: {
    INPUT_TOKEN: 0.00000015,     // $0.15 per 1M tokens
    OUTPUT_TOKEN: 0.0000006,     // $0.60 per 1M tokens
  },
  LIMITS: {
    MAX_INPUT_TOKENS: 1000000,
    MAX_OUTPUT_TOKENS: 8192,
    RATE_LIMIT_PER_MINUTE: 15,
  }
};

/**
 * Stats tracking storage key
 */
const STATS_STORAGE_KEY = 'walvee_gemini_stats';

/**
 * Initialize or get stats from sessionStorage
 */
function getStatsObject() {
  try {
    const stored = sessionStorage.getItem(STATS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('[Gemini Stats] Error reading from storage:', error);
  }
  
  return {
    callCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    estimatedCost: 0,
    lastReset: new Date().toISOString(),
    errors: 0
  };
}

/**
 * Save stats to sessionStorage
 */
function saveStatsObject(stats) {
  try {
    sessionStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn('[Gemini Stats] Error saving to storage:', error);
  }
}

/**
 * Log Gemini API call stats
 */
export function logGeminiStats(inputTokens, outputTokens) {
  const stats = getStatsObject();
  
  stats.callCount++;
  stats.totalInputTokens += inputTokens;
  stats.totalOutputTokens += outputTokens;
  
  const inputCost = inputTokens * GEMINI_CONFIG.PRICING.INPUT_TOKEN;
  const outputCost = outputTokens * GEMINI_CONFIG.PRICING.OUTPUT_TOKEN;
  stats.estimatedCost += (inputCost + outputCost);
  
  saveStatsObject(stats);
  
  console.log('[Gemini Stats] Call logged:', {
    inputTokens,
    outputTokens,
    callCost: (inputCost + outputCost).toFixed(6),
    totalCost: stats.estimatedCost.toFixed(6)
  });
}

/**
 * Get current Gemini stats
 */
export function getGeminiStats() {
  return getStatsObject();
}

/**
 * Reset Gemini stats
 */
export function resetGeminiStats() {
  const freshStats = {
    callCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    estimatedCost: 0,
    lastReset: new Date().toISOString(),
    errors: 0
  };
  
  saveStatsObject(freshStats);
  console.log('[Gemini Stats] Stats reset');
  
  return freshStats;
}

/**
 * Check if Gemini API should be used
 */
export function shouldUseGemini() {
  console.log('[Gemini] API DISABLED - no AI calls will be made');
  return false;
}

/**
 * Call Gemini API with stats tracking
 * DISABLED - Will throw error
 */
export async function callGeminiAPI(prompt, options = {}) {
  console.error('[Gemini] API DISABLED - Cannot make AI calls');
  throw new Error('Gemini API is currently disabled. Enable it in geminiConfig.js');
}

/**
 * Get available Gemini models
 */
export function getAvailableModels() {
  return [
    {
      name: "gemini-2.0-flash-exp",
      description: "Latest experimental model (DISABLED)",
      inputPrice: GEMINI_CONFIG.PRICING.INPUT_TOKEN,
      outputPrice: GEMINI_CONFIG.PRICING.OUTPUT_TOKEN,
      disabled: true
    }
  ];
}