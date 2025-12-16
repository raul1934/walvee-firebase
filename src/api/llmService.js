/**
 * LLM Service - Placeholder for AI/LLM functionality
 *
 * TODO: Implement one of the following options:
 * 1. Firebase Cloud Functions + OpenAI/Claude API
 * 2. Direct API calls to OpenAI/Claude with API keys
 * 3. Use Firebase Extensions for AI features
 *
 * For now, this returns stub responses to allow the app to run.
 */

/**
 * Invoke an LLM with a prompt
 * @param {Object} options - LLM invocation options
 * @param {string} options.prompt - The prompt to send to the LLM
 * @param {boolean} options.add_context_from_internet - Whether to add internet context
 * @param {Object} options.response_json_schema - Expected JSON schema for response
 * @param {string} options.model - Model to use (optional)
 * @returns {Promise<any>} - LLM response
 */
export async function invokeLLM({
  prompt,
  add_context_from_internet = false,
  response_json_schema = null,
  model = 'gpt-4'
}) {
  console.warn('[LLM Service] LLM functionality not yet implemented');
  console.warn('[LLM Service] Prompt:', prompt?.substring(0, 100) + '...');

  // Return stub response based on expected schema
  if (response_json_schema) {
    // Return empty object matching schema
    const stubResponse = {};
    if (response_json_schema.properties) {
      Object.keys(response_json_schema.properties).forEach(key => {
        const propType = response_json_schema.properties[key].type;
        if (propType === 'array') {
          stubResponse[key] = [];
        } else if (propType === 'object') {
          stubResponse[key] = {};
        } else if (propType === 'string') {
          stubResponse[key] = '';
        } else if (propType === 'number') {
          stubResponse[key] = 0;
        } else if (propType === 'boolean') {
          stubResponse[key] = false;
        } else {
          stubResponse[key] = null;
        }
      });
    }
    return stubResponse;
  }

  // Return generic stub text response
  return 'LLM service not yet configured. Please set up Firebase Cloud Functions with an LLM API.';
}

// Legacy API compatibility - matches base44 integrations API
export const Core = {
  InvokeLLM: invokeLLM
};
