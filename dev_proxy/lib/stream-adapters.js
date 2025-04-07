// dev_proxy/lib/stream-adapters.js

/**
 * Adapts a chunk from an OpenAI-compatible stream provider.
 * In this case, OpenAI is our target format, so it's mostly a pass-through,
 * but this function exists for consistency and potential future adjustments.
 *
 * @param {object} backendChunk - The JSON object parsed from the backend SSE data field.
 * @returns {object} - The OpenAI-compatible chat completion chunk.
 */
export function adaptOpenAIStreamChunk(backendChunk) {
  // TODO: Potentially add validation or minor adjustments if needed.
  return backendChunk;
}

/**
 * Adapts a chunk from an Anthropic Claude stream (Messages API format).
 * Anthropic streams have different event types ('message_start', 'content_block_delta', 'message_delta', etc.)
 * and data structures compared to OpenAI.
 *
 * @param {string} eventType - The type of the event from Anthropic (e.g., 'message_start', 'content_block_delta').
 * @param {object} backendChunkData - The JSON object associated with the Anthropic event.
 * @param {object} context - Optional context to maintain state between chunks (e.g., request ID, model name).
 * @returns {object | null} - An OpenAI-compatible chat completion chunk, or null if the event doesn't map directly to an OpenAI chunk (e.g., 'ping', 'message_start').
 */
export function adaptAnthropicStreamChunk(eventType, backendChunkData, context = {}) {
  // console.log(`Anthropic Event: ${eventType}`, backendChunkData); // Debugging

  switch (eventType) {
    case 'message_start':
      // Contains metadata like the full model name. Useful for context, but no direct OpenAI chunk equivalent.
      // Store model in context if needed: context.model = backendChunkData?.message?.model;
      return null; // No direct data payload for the client initially

    case 'content_block_start':
       // Indicates the start of a content block (usually text). No direct OpenAI chunk equivalent.
      return null;

    case 'content_block_delta':
      // This is the most common event, containing text updates.
      if (backendChunkData?.delta?.type === 'text_delta') {
        return {
          // id: context.requestId || `chatcmpl-${Date.now()}`,
          object: 'chat.completion.chunk',
          // created: Math.floor(Date.now() / 1000),
          // model: context.model || 'anthropic-model',
          choices: [{
            index: 0,
            delta: { content: backendChunkData.delta.text || '' }, // Map text delta
            finish_reason: null,
            // logprobs: null,
          }],
        };
      }
      return null; // Ignore other delta types for now

    case 'content_block_stop':
       // Indicates the end of a content block. No direct OpenAI chunk equivalent.
      return null;

    case 'message_delta':
       if (backendChunkData?.delta?.stop_reason) {
         context.finish_reason = mapAnthropicFinishReason(backendChunkData.delta.stop_reason);
         console.log("Finish reason received in message_delta:", context.finish_reason);
       }
       if (backendChunkData?.usage) {
           context.usage = context.usage || {};
           Object.assign(context.usage, backendChunkData.usage); // Accumulate usage
           console.log("Usage received in message_delta:", context.usage);
       }

      return null; // Typically no content payload here for OpenAI format

    case 'message_stop':
       console.log("Anthropic message_stop received. Finish Reason was:", context.finish_reason, "Usage:", context.usage);
      return null; // Let the main stream handler send [DONE]

    case 'ping':
      // Keep-alive event, ignore.
      return null;

    default:
      console.warn(`Unhandled Anthropic event type: ${eventType}`);
      return null;
  }
}

// Helper to map Anthropic stop reasons to OpenAI finish reasons
function mapAnthropicFinishReason(reason) {
    switch (reason) {
        case 'end_turn':
        case 'stop_sequence':
            return 'stop';
        case 'max_tokens':
            return 'length';
        case 'tool_use':
            return 'tool_calls';
        default:
            return null;
    }
}

/**
 * Adapts a chunk from a Google Gemini stream.
 *
 * @param {object} backendChunk - The JSON object parsed from the Gemini stream.
 * @param {object} context - Optional context.
 * @returns {object | null} - An OpenAI-compatible chat completion chunk.
 */
export function adaptGeminiStreamChunk(backendChunk /*, context = {} */) {
    console.warn("Gemini stream adaptation not fully implemented yet.");
    const textDelta = backendChunk?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textDelta) {
         return {
             object: 'chat.completion.chunk',
             choices: [{
                 index: 0,
                 delta: { content: textDelta },
                 finish_reason: null,
             }],
         };
    }
     const finishReason = backendChunk?.candidates?.[0]?.finishReason;
     if (finishReason) {
         const mappedReason = mapGeminiFinishReason(finishReason);
         return {
             object: 'chat.completion.chunk',
             choices: [{
                 index: 0,
                 delta: {},
                 finish_reason: mappedReason,
             }],
         };
     }

    return null;
}

function mapGeminiFinishReason(reason) {
    switch (reason) {
        case 'STOP':
            return 'stop';
        case 'MAX_TOKENS':
            return 'length';
        case 'SAFETY':
        case 'RECITATION':
            return 'content_filter';
        case 'OTHER':
        case 'UNKNOWN':
        case 'FINISH_REASON_UNSPECIFIED':
        default:
            return null;
    }
}


/**
 * Adapts a chunk from a local Ollama stream (using /chat endpoint).
 *
 * @param {object} backendChunk - The JSON object parsed from the Ollama stream.
 * @param {object} context - Optional context.
 * @returns {object | null} - An OpenAI-compatible chat completion chunk.
 */
export function adaptOllamaStreamChunk(backendChunk, context = {}) {
    if (backendChunk?.done === true) {
         context.usage = {
             prompt_tokens: backendChunk.prompt_eval_count,
             completion_tokens: backendChunk.eval_count,
             total_tokens: (backendChunk.prompt_eval_count || 0) + (backendChunk.eval_count || 0)
         };
         context.finish_reason = 'stop';
         console.log("Ollama stream done. Reason:", context.finish_reason, "Usage:", context.usage);
       return null;
    }

    if (backendChunk?.message?.content) {
        return {
            object: 'chat.completion.chunk',
            choices: [{
                index: 0,
                delta: { content: backendChunk.message.content },
                finish_reason: null,
            }],
        };
    }

    return null;
} 