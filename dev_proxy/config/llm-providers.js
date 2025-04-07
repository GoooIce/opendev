// /config/llm-providers.js
// Based on Creative Phase Decision: Option 2 (Object Map)

export const llmProviders = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    apiBaseUrl: 'https://api.openai.com/v1',
    apiKeyEnvVar: 'OPENAI_API_KEY', // Name of the env var holding the key
    models: {
      // Map generic model names (used in requests) to provider-specific identifiers
      'gpt-4-turbo': 'gpt-4-turbo-preview',
      'gpt-4-vision': 'gpt-4-vision-preview',
      'gpt-4': 'gpt-4',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
    },
    // defaultHeaders: {},
    // adaptRequest: (payload) => payload, // Optional request adapter function
    // adaptResponse: (response) => response, // Optional response adapter function
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    apiBaseUrl: 'https://api.anthropic.com/v1', // Note: Path might differ (/messages)
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    models: {
      'claude-3-opus': 'claude-3-opus-20240229',
      'claude-3-sonnet': 'claude-3-sonnet-20240229',
      'claude-3-haiku': 'claude-3-haiku-20240307',
      'claude-2.1': 'claude-2.1',
      'claude-2.0': 'claude-2.0',
      'claude-instant-1.2': 'claude-instant-1.2',
    },
    defaultHeaders: {
      'anthropic-version': '2023-06-01',
      // Anthropic uses x-api-key header instead of Authorization: Bearer
      // This needs handling in the API call logic, not just default headers.
    },
    // adaptRequest: adaptAnthropicRequest, // Will need specific adaptation
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    // Base URL structure is different for Gemini
    // Example for generateContent: https://generativelanguage.googleapis.com/v1beta/models
    // Needs specific handling in API call logic.
    apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyEnvVar: 'GOOGLE_API_KEY',
    models: {
        'gemini-1.5-pro': 'gemini-1.5-pro-latest',
        'gemini-1.0-pro': 'gemini-pro',
        'gemini-1.0-pro-vision': 'gemini-pro-vision', // Vision model might need different endpoint/handling
    },
    // Gemini uses ?key=... query parameter for auth, needs special handling.
    // Request/Response format is significantly different, requires adaptation.
  },
  // Example for a local Ollama setup
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    apiBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api', // Configurable via env
    apiKeyEnvVar: null, // Typically no API key for local Ollama
    models: {
        // User adds models they have pulled locally, mapping generic name to Ollama model name
        'llama3': 'llama3',
        'mistral': 'mistral',
        'codellama': 'codellama',
    },
    // Ollama uses /generate (non-streaming) or /chat (streaming, OpenAI compatible-ish)
    // Needs adaptation.
  },
  // Add the new provider for the internal Rust logic adapter
  dev: {
    id: 'dev',
    name: 'Dev',
    apiBaseUrl: null, // Not applicable, uses custom logic
    apiKeyEnvVar: null, // Not applicable
    models: {
      // Define a model name that routes to this adapter
      'dev-claude-3-7-sonnet': 'us.anthropic.claude-3-7-sonnet-20250219-v1:0-thinking',
      'dev-gemini-1.5-pro': 'gemini-1.5-pro-002',
    },
    // This provider will use a dedicated adapter function
    // Needs specific environment variables defined elsewhere (e.g., API_ENDPOINT, DEVICE_ID)
  }
  // Add more providers here...
};

/**
 * Gets the provider configuration object for a given model name.
 * Model name should be in the format "providerId/genericModelName"
 * e.g., "openai/gpt-4-turbo", "anthropic/claude-3-opus"
 */
export function getProviderConfigForModel(modelName) {
  if (!modelName || typeof modelName !== 'string') {
    return null;
  }
  const parts = modelName.split('/');
  if (parts.length !== 2) {
      console.warn(`Invalid model name format: ${modelName}. Expected format: providerId/genericModelName`);
      // Attempt to find a default provider if only model name is given (e.g., assume openai)
      // OR return null / throw error. For now, return null.
      // Alternatively, check if modelName exists directly in ANY provider's models map?
      return null;
  }
  const providerId = parts[0];
  const provider = llmProviders[providerId];

  if (!provider) {
      console.warn(`Provider configuration not found for provider ID: ${providerId}`);
      return null;
  }
  return provider;
}

/**
 * Gets the actual provider-specific model identifier for a given generic model name.
 * Model name should be in the format "providerId/genericModelName"
 */
export function getActualModelId(modelName) {
    const provider = getProviderConfigForModel(modelName);
    if (!provider) {
        return modelName; // Return original if no provider found
    }

    const parts = modelName.split('/');
    const genericModelName = parts[1];

    return provider.models[genericModelName] || genericModelName; // Fallback to generic name if specific mapping not found
}

/**
 * Gets a list of all available models in the format "providerId/genericModelName".
 */
export function listAvailableModels() {
    const modelList = [
      'dev/dev-claude-3-7-sonnet',
      'dev/dev-gemini-1.5-pro',
    ];
    // for (const providerId in llmProviders) {
    //     const provider = llmProviders[providerId];
    //     if (provider.models) {
    //         for (const genericName in provider.models) {
    //             modelList.push(`${providerId}/${genericName}`);
    //         }
    //     }
    // }
    return modelList;
} 