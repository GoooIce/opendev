import { NextResponse } from 'next/server';
import { getProviderConfigForModel, getActualModelId } from '@/config/llm-providers';
import { adaptOpenAIStreamChunk, adaptAnthropicStreamChunk, adaptGeminiStreamChunk, adaptOllamaStreamChunk } from '@/lib/stream-adapters';
import logger from '@/lib/logging';
import { handleRustLogicRequest } from '@/lib/rust_logic_adapter';

// Set runtime to edge for lower latency, if possible
// export const runtime = 'edge'; // Conflicts with node specific APIs if used, e.g. TextDecoder isn't exactly the same? Test carefully.

// --- Request Validation and Parsing ---
async function parseAndValidateRequest(request) {
    let requestBody;
    try {
        requestBody = await request.json();
    } catch (e) {
        logger.error('Invalid request body:', e);
        throw new Error('Invalid request body. Expecting JSON.'); // Throw error to be caught later
    }

    const { model: requestedModel, stream: isStreaming = false, ...restPayload } = requestBody; // Default isStreaming to false

    if (!requestedModel) {
        logger.warn('Model not specified in request');
        throw new Error('Missing required parameter: model');
    }

    return { requestBody, requestedModel, isStreaming, restPayload };
}

// --- Provider and Model Configuration ---
function getProviderAndModelInfo(requestedModel) {
    const providerConfig = getProviderConfigForModel(requestedModel);
    const actualModelId = getActualModelId(requestedModel);

    if (!providerConfig) {
        logger.warn(`Configuration for model ${requestedModel} not found`);
        throw new Error(`Configuration for model ${requestedModel} not found`);
    }

    // Handle internal rust logic provider early
    if (providerConfig.id === 'dev') {
        logger.info(`Identified internal_rust_logic provider for model ${actualModelId}`);
        // Return enough info for the main function to delegate
        return { providerConfig, actualModelId, isInternal: true };
    }

    const apiKey = providerConfig.apiKeyEnvVar ? process.env[providerConfig.apiKeyEnvVar] : null;
    if (providerConfig.apiKeyEnvVar && !apiKey) {
        logger.error(`API key (${providerConfig.apiKeyEnvVar}) for provider ${providerConfig.name} not configured`);
        throw new Error(`API key for provider ${providerConfig.name} not configured`);
    }

    return { providerConfig, actualModelId, apiKey, isInternal: false };
}

// --- Backend Request Preparation ---
function prepareBackendRequest(providerConfig, actualModelId, apiKey, restPayload) {
    let backendPayload = { ...restPayload, model: actualModelId };
    let backendUrl = `${providerConfig.apiBaseUrl}/chat/completions`; // Default
    let authHeaderType = 'Bearer'; // Default

    // Provider-specific adjustments
    if (providerConfig.id === 'anthropic') {
        backendUrl = `${providerConfig.apiBaseUrl}/messages`;
        authHeaderType = 'x-api-key';
        backendPayload = adaptAnthropicRequestPayload(backendPayload);
    } else if (providerConfig.id === 'google') {
        backendUrl = `${providerConfig.apiBaseUrl}/models/${actualModelId}:streamGenerateContent`;
        authHeaderType = 'key';
        backendPayload = adaptGeminiRequestPayload(backendPayload);
    } else if (providerConfig.id === 'ollama') {
        backendUrl = `${providerConfig.apiBaseUrl}/chat`;
        authHeaderType = 'None';
        backendPayload = adaptOllamaRequestPayload(backendPayload);
    }

    backendPayload.stream = true; // Always request stream from backend

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(providerConfig.defaultHeaders || {}),
    };

    if (authHeaderType === 'Bearer' && apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (authHeaderType === 'x-api-key' && apiKey) {
        headers['x-api-key'] = apiKey;
    }

    if (providerConfig.id === 'google' && apiKey) {
        backendUrl += `?key=${apiKey}`; // Append API key as query param for Google
    }

    logger.info(`Preparing request for ${providerConfig.name} (${providerConfig.id}) at ${backendUrl} for model ${actualModelId}`);

    return { backendUrl, headers, body: JSON.stringify(backendPayload) };
}

// --- Fetch and Validate Backend Response ---
async function fetchAndValidateBackendResponse(backendUrl, headers, body, providerName) {
    const backendResponse = await fetch(backendUrl, {
        method: 'POST',
        headers: headers,
        body: body,
    });

    if (!backendResponse.ok) {
        const errorBody = await backendResponse.text();
        logger.error(`Backend error (${providerName}): ${backendResponse.status} ${errorBody}`);
        // Throw a structured error
        const error = new Error(`Backend API error (${providerName}): ${errorBody}`);
        error.statusCode = backendResponse.status;
        error.type = 'backend_error';
        error.providerName = providerName;
        throw error;
    }

    if (!backendResponse.body) {
        logger.error('Backend response body is null');
        throw new Error('Backend returned empty response');
    }

    return backendResponse;
}

// --- 流转换逻辑 ---
function createAdapterTransformStream(adapterContext) {
    const encoder = new TextEncoder(); // 创建文本编码器
    const decoder = new TextDecoder(); // 创建文本解码器
    let streamClosed = false; // 在转换流闭包内跟踪流状态

    return new TransformStream({
        async transform(chunk, controller) {
            if (streamClosed) return; // 如果流已关闭则直接返回
            const decodedChunk = decoder.decode(chunk, { stream: true }); // 解码当前数据块
            const lines = decodedChunk.split('\n'); // 按换行符分割数据
            let currentEvent = adapterContext.currentEvent; // 获取当前事件类型
            let accumulatedQContent = adapterContext.accumulatedQContent || ''; // 初始化或获取累积的Q内容

            for (const line of lines) {
                if (line.startsWith('event:')) { // 处理事件行
                   const newEvent = line.substring(6).trim(); // 提取新事件类型
                   if (currentEvent === 'q' && newEvent !== 'q' && accumulatedQContent) {
                       // 如果从q事件切换到其他事件且有累积内容，先处理累积内容
                       const adaptedChunk = adaptQContentChunk(accumulatedQContent, adapterContext);
                       if (adaptedChunk) {
                           controller.enqueue(encoder.encode(`data: ${JSON.stringify(adaptedChunk)}\n\n`));
                       }
                       accumulatedQContent = ''; // 清空累积内容
                   }
                   currentEvent = newEvent; // 更新当前事件
                } else if (line.startsWith('data:')) { // 处理数据行
                    const dataString = line.substring(5).trim(); // 提取数据内容

                    if (currentEvent === 'q') { // 处理q事件数据
                        if (dataString && dataString !== '"') { // 忽略空引号
                            accumulatedQContent += dataString; // 累积内容
                        }
                        continue; // 跳过q事件的JSON解析
                    }

                    if (dataString === '[DONE]') { // 处理结束信号
                         logger.info('Received [DONE] signal from backend.');
                        continue;
                    }
                    if (!dataString) continue; // 跳过空数据

                    try {
                        const jsonData = JSON.parse(dataString); // 解析JSON数据
                        let adaptedChunk = null; // 初始化适配后的数据块
                        const eventType = currentEvent || 'message'; // 获取事件类型

                        // 根据提供者类型调用不同的适配器
                        switch(adapterContext.providerId) {
                            case 'openai': adaptedChunk = adaptOpenAIStreamChunk(jsonData); break;
                            case 'anthropic': adaptedChunk = adaptAnthropicStreamChunk(eventType, jsonData, adapterContext); break;
                            case 'google': adaptedChunk = adaptGeminiStreamChunk(jsonData, adapterContext); break;
                            case 'ollama': adaptedChunk = adaptOllamaStreamChunk(jsonData, adapterContext); break;
                            default:
                                logger.warn(`No specific stream adapter for provider: ${adapterContext.providerId}, event: ${eventType}. Passing through.`);
                                adaptedChunk = adaptPassThrough(jsonData);
                        }

                        if (adaptedChunk) { // 如果有适配后的数据块
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify(adaptedChunk)}\n\n`)); // 发送数据
                        }
                    } catch (e) {
                        logger.error(`Error parsing JSON or adapting stream data line: "${line}". DataString: "${dataString}", Event: ${currentEvent}`, e);
                    }

                    if (currentEvent !== 'q') { // 重置非q事件的事件上下文
                       currentEvent = null;
                    }
                }
            }
             adapterContext.currentEvent = currentEvent; // 更新上下文中的当前事件
             adapterContext.accumulatedQContent = accumulatedQContent; // 更新上下文中的累积内容
        },
         flush(controller) { // 流结束时的处理
             if (adapterContext.accumulatedQContent) { // 处理剩余的累积内容
                 const adaptedChunk = adaptQContentChunk(adapterContext.accumulatedQContent, adapterContext);
                 if (adaptedChunk) {
                     controller.enqueue(encoder.encode(`data: ${JSON.stringify(adaptedChunk)}\n\n`));
                 }
                 adapterContext.accumulatedQContent = ''; // 清空累积内容
             }

             if (!streamClosed) { // 确保发送[DONE]信号
                logger.info('Transform stream flushed, ensuring [DONE] is sent.');
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                streamClosed = true;
             }
         }
    });
}

// --- 聚合响应处理 ---
async function handleAggregatedResponse(backendStream, transformStream, adapterContext) {
    logger.info('Aggregating stream for non-streaming request.');
    const aggregatedChunks = []; // 初始化聚合数据块数组
    const decoder = new TextDecoder(); // 创建文本解码器

    const collectorStream = new WritableStream({ // 创建可写流用于收集数据
        write(chunk) {
           const decoded = decoder.decode(chunk); // 解码数据块
           if (decoded.startsWith('data: ')) { // 处理数据行
               const dataStr = decoded.substring(6).trim(); // 提取数据内容
               if (dataStr !== '[DONE]' && dataStr) { // 确保数据不为空且不是结束信号
                   try {
                       aggregatedChunks.push(JSON.parse(dataStr)); // 解析并存储数据块
                   } catch(e) {
                       logger.error("Error parsing chunk during aggregation:", `"${dataStr}"`, e);
                   }
               }
           }
        },
        close() {
            logger.info('Collector stream closed.');
        },
        abort(reason) {
            logger.error('Collector stream aborted:', reason);
        }
    });

    try {
         await backendStream.pipeThrough(transformStream).pipeTo(collectorStream); // 处理流数据
         const finalResponse = aggregateChunksToOpenAIResponse(aggregatedChunks, adapterContext); // 生成最终响应
         logger.info('Returning aggregated response.');
         return NextResponse.json(finalResponse); // 返回JSON响应
    } catch (error) {
        logger.error('Error during stream aggregation:', error);
         return NextResponse.json({ error: 'Failed to process stream for non-streaming response', details: error.message }, { status: 500 });
    }
}

// --- 流式响应处理 ---
function handleStreamingResponse(backendStream, transformStream) {
    logger.info('Returning streaming response directly from transform stream.');
    const outputStream = backendStream.pipeThrough(transformStream);

    return new NextResponse(outputStream, {
        headers: {
           'Content-Type': 'text/event-stream',
           'Cache-Control': 'no-cache',
           'Connection': 'keep-alive',
        }
    });
}

// --- Main POST Handler ---
export async function POST(request) {
    logger.info('Chat completions request received');
    try {
        // 1. Parse and Validate Request
        const { requestBody, requestedModel, isStreaming, restPayload } = await parseAndValidateRequest(request);

        // 2. Get Provider/Model Info & API Key
        const { providerConfig, actualModelId, apiKey, isInternal } = getProviderAndModelInfo(requestedModel);

        // 3. Handle Internal Provider (if applicable)
        if (isInternal) {
            return await handleRustLogicRequest(requestBody, actualModelId, providerConfig);
        }

        // 4. Prepare Backend Request Details
        const { backendUrl, headers, body } = prepareBackendRequest(providerConfig, actualModelId, apiKey, restPayload);

        // 5. Fetch and Validate Backend Response
        const backendResponse = await fetchAndValidateBackendResponse(backendUrl, headers, body, providerConfig.name);
        const backendStream = backendResponse.body;

        // 6. Prepare Adapter Context and Transform Stream
        const adapterContext = {
            requestId: `chatcmpl-${Date.now()}`,
            model: requestedModel,
            actualModel: actualModelId,
            providerId: providerConfig.id,
            finish_reason: null,
            usage: {},
            currentEvent: null,
            accumulatedQContent: null
        };
        const transformStream = createAdapterTransformStream(adapterContext);

        // 7. Process Stream (Streaming or Aggregated)
        if (!isStreaming) {
            return await handleAggregatedResponse(backendStream, transformStream, adapterContext);
        } else {
            return handleStreamingResponse(backendStream, transformStream);
        }

    } catch (error) {
        logger.error(`Error in chat completions route: ${error.message}`, error);

        // Handle specific backend errors with status code
        if (error.type === 'backend_error') {
             return NextResponse.json({
                 error: {
                     message: error.message,
                     type: error.type,
                     param: null,
                     code: String(error.statusCode)
                 }
             }, { status: error.statusCode });
        }

        // Handle validation errors (e.g., bad request)
        if (error.message.includes('Invalid request body') || error.message.includes('Missing required parameter')) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        // Handle config errors (e.g., missing config, missing key)
        if (error.message.includes('Configuration for model') || error.message.includes('API key for provider')) {
             return NextResponse.json({ error: error.message }, { status: 500 }); // Config issue is server-side
        }

        // Generic internal server error for anything else
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

// --- Request Payload Adapter Functions ---
function adaptAnthropicRequestPayload(payload) {
    logger.info("Adapting request for Anthropic...");
    const { messages, max_tokens, model, ...rest } = payload;
    let systemPrompt = null;
    const filteredMessages = messages.filter(msg => {
        if (msg.role === 'system') {
            systemPrompt = msg.content;
            return false;
        }
        return true;
    });

    return {
        model: model,
        messages: filteredMessages,
        ...(systemPrompt && { system: systemPrompt }),
        max_tokens: max_tokens || 4096,
        stream: true,
        ...rest
    };
}

function adaptGeminiRequestPayload(payload) {
    logger.warn("Gemini request adaptation not fully implemented.");
    return {
        ...payload
    };
}
function adaptOllamaRequestPayload(payload) {
    logger.info("Adapting request for Ollama...");
     const { model, ...rest } = payload;
    return {
        model: model,
        stream: true,
        messages: rest.messages,
        options: {
            temperature: rest.temperature,
            top_p: rest.top_p,
        }
    };
}

// --- Stream Chunk Adapter Helper Functions ---
function adaptQContentChunk(content, context) {
    if (!content) return null;
    // Create a standard OpenAI-like chunk from the raw string content
    logger.debug(`Adapting accumulated q content: "${content}"`);
    return {
        id: context.requestId || `chatcmpl-${Date.now()}`,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: context.actualModel || context.model || 'unknown-q-event',
        choices: [{
            index: 0,
            delta: { content: content }, // The accumulated string is the delta content
            finish_reason: null // Finish reason usually comes in a separate message/event
        }]
    };
}

function adaptPassThrough(jsonData) {
    // Basic passthrough or minimal adaptation if possible
    // This is a placeholder - Ideally, the correct adapter handles it.
    try {
        if (jsonData?.choices?.[0]?.delta?.content || jsonData?.choices?.[0]?.finish_reason) {
            return {
                id: jsonData.id || `chatcmpl-${Date.now()}`,
                object: 'chat.completion.chunk',
                created: jsonData.created || Math.floor(Date.now() / 1000),
                model: jsonData.model || 'unknown-passthrough',
                choices: [{
                    index: jsonData?.choices?.[0]?.index ?? 0,
                    delta: jsonData?.choices?.[0]?.delta ?? {},
                    finish_reason: jsonData?.choices?.[0]?.finish_reason ?? null
                }],
                usage: jsonData?.usage // Pass usage if available in chunk
            };
        }
    } catch (e) {
      logger.error("Error during pass-through adaptation:", e, jsonData);
    }
    // If we can't adapt, return null so it's skipped
    logger.warn("Could not adapt pass-through chunk:", jsonData);
    return null;
}

// --- Aggregation Function ---
function aggregateChunksToOpenAIResponse(chunks, context) {
     logger.info(`Aggregating ${chunks.length} chunks.`);
     if (!chunks || chunks.length === 0) {
         return {
             id: context.requestId || `chatcmpl-${Date.now()}`,
             object: 'chat.completion',
             created: Math.floor(Date.now() / 1000),
             model: context.actualModel || context.model || 'unknown',
             choices: [{
                 index: 0,
                 message: { role: 'assistant', content: '' },
                 finish_reason: context.finish_reason || 'error',
             }],
             usage: context.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
         };
     }

     const firstChunk = chunks[0];
     let fullContent = '';
     let finalFinishReason = context.finish_reason;
     let finalUsage = context.usage || {};

     for (const chunk of chunks) {
         if (chunk?.choices?.[0]?.delta?.content) {
             fullContent += chunk.choices[0].delta.content;
         }
         if (chunk?.choices?.[0]?.finish_reason) {
             finalFinishReason = chunk.choices[0].finish_reason;
         }
         if (chunk?.usage) {
             finalUsage = chunk.usage;
         }
     }

     if (finalFinishReason === null) {
         finalFinishReason = context.finish_reason || 'stop';
         logger.warn(`Aggregated stream ended without a finish_reason in chunks, using context/default: ${finalFinishReason}`);
     }

     return {
         id: firstChunk?.id || context.requestId || `chatcmpl-${Date.now()}`,
         object: 'chat.completion',
         created: firstChunk?.created || Math.floor(Date.now() / 1000),
         model: firstChunk?.model || context.actualModel || context.model,
         choices: [{
             index: 0,
             message: {
                 role: 'assistant',
                 content: fullContent,
             },
             finish_reason: finalFinishReason,
         }],
         usage: finalUsage
     };
}