import { NextResponse } from 'next/server';
import crypto from 'crypto'; // For nonce
import path from 'path'; // To construct WASM file path
import { fileURLToPath } from 'url'; // To resolve module path
import logger from './logging';
import { createParser } from 'eventsource-parser';
import fs from 'fs/promises'; // Need fs to read the file buffer

// --- Import from wasm-bindgen generated JS glue --- 
import init, { sign as wasmSign } from './sign.mjs'; // Import default init and named sign

// Determine the path to the WASM file relative to this module
// Correctly handle ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const wasmPath = path.resolve(__dirname, 'sign_bg.wasm');
// const wasmPathUrl = new URL(`file://${wasmPath}`); // No longer need the URL

// --- Initialize WASM using the glue code with ArrayBuffer --- 
let wasmInitialized = false;
let initError = null;
let initPromise = null; // Keep track of the initialization promise

initPromise = (async () => { // Assign the promise
    try {
        logger.debug(`Reading WASM file from path: ${wasmPath}`);
        const wasmBuffer = await fs.readFile(wasmPath);
        logger.debug(`Initializing WASM from buffer (size: ${wasmBuffer.byteLength})...`);
        await init(wasmBuffer);
        wasmInitialized = true;
        logger.debug('WASM module initialized successfully via glue code with buffer.');
        initPromise = null; // Clear the promise once resolved successfully
    } catch (e) {
        initError = e;
        logger.error('CRITICAL: Failed to initialize WASM via glue code with buffer:', e);
        initPromise = null; // Clear the promise on error too
        // Rethrow or handle as appropriate if needed elsewhere
    }
})();

// --- Environment Variables ---
const API_ENDPOINT = process.env.INTERNAL_RUST_LOGIC_API_ENDPOINT;
const DEVICE_ID = process.env.INTERNAL_RUST_LOGIC_DEVICE_ID;
const SID = process.env.INTERNAL_RUST_LOGIC_SID;

// Hardcoded values from index.js for testing
// const HARDCODED_DEVICE_ID_FOR_TESTING = "96bab86f327fb54c3e2b9d9d4a23082d2beefd13";
// const HARDCODED_SID_FOR_TESTING = 'X6H1YFHUYfJxFAaDpL9k7SCCWSk9WwHhF1Dfeq-AkNRG-S9TVw6FYvhxVBVUQ8W24tKbN1Ypk2ehIPhbl11YxA';

/**
 * Builds the request parameters, including the signature.
 * Uses the imported sign function from the WASM glue code.
 *
 * @param {object} requestData - The original OpenAI-like request data.
 * @returns {{headers: Headers, body: string}} The headers and JSON string body for the fetch request.
 * @throws {Error} If WASM init failed, env vars missing, or signing fails.
 */
function buildRequestParamsJs(requestData) {
    if (!wasmInitialized) {
        throw new Error(`WASM module not initialized. Error: ${initError || 'Unknown initialization issue'}`);
    }
    if (!API_ENDPOINT /* No check for DEVICE_ID/SID here as we might use hardcoded ones */) {
        throw new Error('Missing required env var for internal_rust_logic: API_ENDPOINT');
    }

    const nonce = crypto.randomUUID();
    const timestamp = String(Math.floor(Date.now() / 1000));

    // --- Extract content to sign (Match index.js logic) --- START
    let contentToSign = '';
    if (requestData.messages && Array.isArray(requestData.messages) && requestData.messages.length > 0) {
        // Find the last message from the user to use as content for signing
        // Or simply concatenate all user messages? Let's use the last one for now.
        const lastUserMessage = requestData.messages.slice().reverse().find(m => m.role === 'user');
        if (lastUserMessage && typeof lastUserMessage.content === 'string') {
            contentToSign = lastUserMessage.content;
        } else {
            // Fallback or error if no user message content found?
            logger.warn('Could not find user message content for signing. Signing empty string.');
        }
    } else {
        logger.warn('requestData.messages missing or empty. Signing empty string.');
    }
    // --- Extract content to sign --- END

    // --- Construct the 'extra' payload early --- 
    // This is sent in the body but NOT signed according to index.js
    const extraPayload = {
        // Include fields expected by the backend, based on index.js
        searchMode: requestData.searchMode || 'web', // Add default? Example used web
        model: requestData.model, // Use the actual model ID for this provider
        isExpert: requestData.isExpert || false, // Add default?
        pluginFor: "vscode", // From index.js example
        pluginAction: requestData.pluginAction || null, // Allow passing through
        language: requestData.language || 'en', // Add default? Example used zh
        programmingLanguage: requestData.programmingLanguage || null, // Allow passing through
        // Add any other fields needed in 'extra' based on the backend API
    };

    // --- Use hardcoded device ID for signing --- 
    const deviceIdToUse = DEVICE_ID || HARDCODED_DEVICE_ID_FOR_TESTING; // Use hardcoded ID
    // logger.warn(`Using  deviceId for testing: ${deviceIdToUse}`);
    // const deviceIdToUse = DEVICE_ID; // Original line using env var

    let signature;
    try {
        logger.debug(`Calling imported WASM sign function with content: "${contentToSign.substring(0, 50)}..."`);
        // Ensure the correct device ID is passed for signing
        signature = wasmSign(nonce, timestamp, deviceIdToUse, contentToSign);
        logger.debug('Imported WASM sign function returned successfully.');
    } catch (error) {
        logger.error('Imported WASM sign function failed:', error);
        throw new Error(`Failed to sign request via WASM: ${error.message}`);
    }

    // --- Set Headers WITHOUT 'x-' prefix and use hardcoded values --- 
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'text/event-stream');
    headers.set('nonce', nonce);             // No prefix
    headers.set('timestamp', timestamp);     // No prefix
    headers.set('sign', signature);        // No prefix
    headers.set('device-id', deviceIdToUse); // No prefix, use potentially hardcoded value
    headers.set('os-type', '3');            // No prefix

    // --- Use hardcoded SID for testing --- 
    const sidToUse = SID || HARDCODED_SID_FOR_TESTING; // Use hardcoded SID
    // logger.warn(`Using HARDCODED sid for testing: ${sidToUse.substring(0, 5)}...`);
    // const sidToUse = SID; // Original line using env var
    if (sidToUse) { // Check if hardcoded SID is not empty
        headers.set('sid', sidToUse);         // No prefix
    }

    // Construct Body: Include original messages and the separate extra payload
    const bodyPayload = {
        content: contentToSign, // Send the signed content string as the main content? Or original messages? Check index.js
        // Looking at index.js body: { content: content, threadId: threadId, extra: extraPayload }
        // It seems to send the *signed* content as the primary 'content' field.
        // This might be wrong if the backend expects the original message structure.
        // Let's try sending the original messages structure instead, as that's more standard for chat APIs
        messages: requestData.messages, // Keep original messages
        stream: requestData.stream,
        model: requestData.model, // Send model in body too? index.js doesn't explicitly show it here but extraPayload has it.
        // Let's keep it simple and only include what index.js body shows:
        threadId: requestData.threadId || null, // Allow passing threadId
        extra: extraPayload,
        // Let's REMOVE the fields not present in index.js body example to be closer:
        // model: requestData.model, 
        // stream: requestData.stream, 
    };

    // Adjust bodyPayload based on closer reading of index.js example
    const finalBodyPayload = {
        content: contentToSign, // Use the (potentially last user message) content that was signed
        threadId: requestData.threadId || null,
        extra: extraPayload
    }

    return {
        headers,
        body: JSON.stringify(finalBodyPayload), // Send the adjusted payload
    };
}

/**
 * Sends the request to the backend API endpoint.
 */
async function sendRequestJs(headers, body) {
    logger.debug(`Sending request to internal logic endpoint: ${API_ENDPOINT}`);
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: body,
        });
        return response;
    } catch (error) {
        logger.error(`Failed to fetch from internal logic endpoint ${API_ENDPOINT}:`, error);
        throw new Error(`Network error fetching from internal logic endpoint: ${error.message}`);
    }
}

// --- NEW: Helper functions based on processSseStream.js ---
function safeJsonParse(jsonString) {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        logger.warn("Failed to parse JSON:", jsonString, e);
        return null;
    }
}

function parseRelatedQuestions(raw) {
    if (!raw) return [];
    return raw.split('\n').filter(q => q.trim().length > 0).map((q, index) => ({ id: index.toString(), title: q.trim() }));
}

// --- NEW: SSE Accumulator based on processSseStream.js ---
function createSseAccumulatorV2() {
    return {
        content: {
            text: "",
            actions: [],
            sources: [],
            github_sources: [], // Assuming 'repoSources' maps to this
            relatedQuestionsRaw: "",
            relatedQuestions: [],
            reasoning: undefined, // Initialize as undefined, set on first 'r' event
            threadId: null,
            queryMessageId: null,
            answerMessageId: null,
            threadTitle: null,
            isFinished: false,
            error: null,
        },
        // 追踪已发送的内容长度，用于增量更新
        lastSentLength: 0,
        // 跟踪最后一次更新的时间戳
        lastUpdateTime: Date.now(),
        // 跟踪累积的变更数量
        pendingUpdates: 0,
        // 新增: 记录是否已记录内容
        contentLogged: false,
        // 最大批处理间隔（毫秒）
        maxBatchInterval: 100,
        // 批处理阈值
        batchThreshold: 5
    };
}

// --- NEW: SSE Event Processor based on processSseStream.js ---
/**
 * Processes a single Server-Sent Event based on the logic from processSseStream.js.
 * Mutates the accumulator object directly.
 *
 * @param {ParsedEvent} parsedEvent - The parsed SSE event from eventsource-parser.
 * @param {object} accumulator - The accumulator object (created by createSseAccumulatorV2).
 * @returns {{ updated: boolean, terminate: boolean, error?: string }} - Indicates if state was updated and if stream should terminate.
 */
function processSseEvent(parsedEvent, accumulator) {
    let updated = false;
    let terminate = false;
    let errorMsg = undefined;

    // Check if it's a valid event with data and a name (event field in ParsedEvent)
    if (parsedEvent.type !== 'event' || !parsedEvent.event || !parsedEvent.data) {
        // Ignore empty events, comments, etc.
        if (parsedEvent.type === 'reconnect-interval') {
            logger.debug(`Received reconnect-interval: ${parsedEvent.value}`);
        }
        return { updated: false, terminate: false };
    }

    const eventName = parsedEvent.event; // Use the 'event' field as the name
    const eventData = parsedEvent.data;
    
    // 添加详细日志跟踪每个事件
    logger.debug(`开始处理SSE事件: ${eventName}, 数据长度: ${eventData.length}, 数据预览: ${eventData.substring(0, Math.min(50, eventData.length))}`);

    try {
        switch (eventName) {
            case 'action':
                const actionData = safeJsonParse(eventData);
                if (actionData) {
                    const existingActionIndex = accumulator.content.actions.findIndex(a => a.type === actionData.type);
                    if (existingActionIndex !== -1) {
                        accumulator.content.actions[existingActionIndex] = actionData;
                    } else {
                        accumulator.content.actions.push(actionData);
                    }
                    updated = true;
                }
                break;
            case 'content':
            case 'c': // Content
                logger.debug(`处理内容事件 'c'/'content', 数据: "${eventData}"`);
                
                // 添加到text，同时记录当前text的状态
                const beforeTextLength = accumulator.content.text ? accumulator.content.text.length : 0;
                accumulator.content.text += eventData;
                const afterTextLength = accumulator.content.text ? accumulator.content.text.length : 0;
                
                logger.debug(`内容事件后文本长度变化: ${beforeTextLength} -> ${afterTextLength}`);
                if (afterTextLength > beforeTextLength) {
                    updated = true;
                } else {
                    logger.warn(`内容事件处理后文本长度未增加: ${beforeTextLength} -> ${afterTextLength}`);
                }
                break;
            case 'threadId':
                accumulator.content.threadId = eventData;
                updated = true;
                break;
            case 'queryMessageId':
                accumulator.content.queryMessageId = eventData;
                updated = true;
                break;
            case 'answerMessageId':
                accumulator.content.answerMessageId = eventData;
                updated = true;
                break;
            case 'sources':
                accumulator.content.sources = safeJsonParse(eventData) ?? [];
                updated = true;
                break;
            case 'repoSources': // Map repoSources to github_sources
                accumulator.content.github_sources = safeJsonParse(eventData) ?? [];
                updated = true;
                break;
            case 'rlq':
            case 'q': // Allow short alias 'q'
                accumulator.content.relatedQuestionsRaw += (accumulator.content.relatedQuestionsRaw ? '\n' : '') + eventData;
                accumulator.content.relatedQuestions = parseRelatedQuestions(accumulator.content.relatedQuestionsRaw);
                updated = true;
                break;
            case 'r': // Reasoning
                logger.debug(`处理推理事件 'r', 数据: "${eventData}"`);
                
                // 初始化reasoning字段如果不存在
                if (typeof accumulator.content.reasoning === 'undefined') {
                    accumulator.content.reasoning = '';
                }
                
                // 添加到reasoning，同时记录当前reasoning的状态
                const beforeReasoningLength = accumulator.content.reasoning ? accumulator.content.reasoning.length : 0;
                accumulator.content.reasoning += eventData;
                const afterReasoningLength = accumulator.content.reasoning ? accumulator.content.reasoning.length : 0;
                logger.debug(`推理事件后reasoning长度变化: ${beforeReasoningLength} -> ${afterReasoningLength}`);
                
                // 关键修改：直接确保r事件内容同时也添加到text
                const beforeTextLen = accumulator.content.text ? accumulator.content.text.length : 0;
                accumulator.content.text += eventData; // 也添加到text
                const afterTextLen = accumulator.content.text ? accumulator.content.text.length : 0;
                logger.debug(`推理事件后text长度变化: ${beforeTextLen} -> ${afterTextLen}`);
                
                if (afterReasoningLength > beforeReasoningLength || afterTextLen > beforeTextLen) {
                    updated = true;
                } else {
                    logger.warn(`推理事件处理后文本长度未增加: reasoning ${beforeReasoningLength} -> ${afterReasoningLength}, text ${beforeTextLen} -> ${afterTextLen}`);
                }
                break;
            case 'threadTitle':
                accumulator.content.threadTitle = eventData;
                updated = true;
                break;
            case 'error':
                logger.error("SSE error event from backend:", eventData);
                accumulator.content.isFinished = true;
                errorMsg = eventData || "API reported stream error";
                accumulator.content.error = errorMsg;
                accumulator.content.text += `\n\n--- API Error: ${errorMsg} ---`;
                updated = true;
                terminate = true; // Signal termination
                break;
            case 'ping':
                // Ignore ping events
                break;
            case 'close': // Handle explicit close event?
            case 'done':  // Or done event?
                logger.debug(`Received explicit stream closing event: ${eventName}`);
                accumulator.content.isFinished = true;
                updated = true; // State changed (isFinished)
                terminate = true; // Signal termination
                break;
            default:
                logger.warn(`未处理的SSE事件类型: ${eventName}`);
                // 尝试以通用方式处理，将未知事件也添加到文本中
                if (eventData && typeof eventData === 'string' && eventData.trim().length > 0) {
                    logger.debug(`将未知事件类型 ${eventName} 的内容添加到文本: "${eventData.substring(0, 50)}..."`);
                    accumulator.content.text += eventData;
                    updated = true;
                }
                break;
        }
    } catch (error) {
        logger.error(`处理SSE事件出错, 事件类型: ${eventName}, 数据: ${eventData}`, error);
        accumulator.content.error = `Proxy processing error: ${error.message}`;
        accumulator.content.isFinished = true;
        errorMsg = accumulator.content.error;
        updated = true;
        terminate = true;
    }

    // 检查文本是否成功更新
    if (updated && eventName !== 'ping') {
        accumulator.pendingUpdates++;
        accumulator.lastUpdateTime = Date.now();
        
        // 记录文本内容状态
        if (eventName === 'r' || eventName === 'c' || eventName === 'content') {
            logger.debug(`事件 ${eventName} 处理后，文本内容长度: ${accumulator.content.text?.length || 0}`);
        }
    }

    return { updated, terminate, error: errorMsg };
}

/**
 * Helper function to ensure WASM module is initialized.
 * @returns {Promise<NextResponse | null>} A NextResponse with error if not initialized, null otherwise.
 */
async function _ensureWasmInitialized() {
    if (initPromise) {
        logger.debug('WASM initialization in progress, awaiting...');
        try {
            await initPromise;
            logger.debug('WASM initialization promise resolved.');
        } catch (e) {
            logger.error('Error awaiting WASM initialization promise:', e);
            // Fall through to the main check which will handle initError
        }
    }

    if (!wasmInitialized) {
        logger.error(`WASM not initialized or initialization failed. Error: ${initError}`);
        return NextResponse.json(
            { error: 'Internal Server Error: WASM module failed to initialize.', details: initError?.message || 'Unknown initialization error' },
            { status: 500 }
        );
    }
    return null; // Indicates success
}

/**
 * Helper function to build parameters and send the request to the backend.
 * @param {object} requestData - The original request data.
 * @param {string} modelId - The model ID.
 * @returns {Promise<Response>} The backend response object.
 * @throws {Error} If backend request fails or returns invalid response.
 */
async function _sendBackendRequest(requestData, modelId) {
    const { headers, body } = buildRequestParamsJs({ ...requestData, model: modelId });
    const backendResponse = await sendRequestJs(headers, body);

    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        logger.error(`Internal logic backend error (${backendResponse.status}): ${errorText}`);
        // Throw an error to be caught by the main handler
        throw new Error(`Internal logic backend error (${backendResponse.status}): ${errorText}`);
    }

    if (!backendResponse.body) {
        logger.error('Internal logic backend response body is null');
        // Throw an error
        throw new Error('Internal logic backend returned empty response');
    }

    return backendResponse;
}

// --- OpenAI Chunk Formatting Helpers --- START

function _createOpenAiInitialChunk(modelId, requestId) {
    return {
        id: `chatcmpl-${requestId}-${Date.now()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: modelId,
        choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }]
    };
}

function _createOpenAiDeltaChunk(modelId, requestId, content) {
    return {
        id: `chatcmpl-${requestId}-${Date.now()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: modelId,
        choices: [{ index: 0, delta: { content: content }, finish_reason: null }]
    };
}

function _createOpenAiFunctionCallChunk(modelId, requestId, name, args, isError = false) {
    return {
        id: `chatcmpl-${requestId}-${Date.now()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: modelId,
        choices: [{
            index: 0,
            delta: { function_call: { name: name, arguments: JSON.stringify(args) } },
            finish_reason: isError ? "error" : null
        }]
    };
}

function _createOpenAiErrorDetailsChunk(modelId, requestId, errorMessage, errorType = "server_error", errorCode = "internal_error") {
     return {
        id: `chatcmpl-${requestId}-${Date.now()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: modelId,
        choices: [{ index: 0, delta: {}, finish_reason: "error" }],
        error: { message: errorMessage, type: errorType, code: errorCode }
    };
}

function _createOpenAiFinishChunk(modelId, requestId, reason = "stop") {
    return {
        id: `chatcmpl-${requestId}-${Date.now()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: modelId,
        choices: [{ index: 0, delta: {}, finish_reason: reason }]
    };
}

const SSE_DONE_CHUNK = 'data: [DONE]\n\n';

// --- OpenAI Chunk Formatting Helpers --- END

// --- SSE Parser Helper --- START

const TEXT_CHUNK_THRESHOLD = 10; // Send text updates if delta is larger than this or stream finished

/**
 * Creates and configures the SSE parser.
 * @param {object} accumulator - The SSE accumulator object.
 * @param {object} state - Shared state object { eventCount, rEventBuffer, lastREventTime }
 * @returns {import('eventsource-parser').EventSourceParser}
 */
function _createSseParser(accumulator, state) {
    return createParser({
        onEvent: (event) => {
            state.eventCount++;
            // Handle special cases: Try to parse untyped events as content
            if (event.type === 'event' && event.data && (!event.event || event.event === 'message')) {
                try {
                    const dataObj = JSON.parse(event.data);
                    if (dataObj.result || dataObj.answer || dataObj.text || dataObj.content) {
                        const content = dataObj.result || dataObj.answer || dataObj.text || dataObj.content || '';
                        // logger.debug(`SSE Parser: Detected custom backend format, extracting content: "${content.substring(0, 50)}..."`);
                        const contentEvent = { type: 'event', event: 'content', data: content };
                        processSseEvent(contentEvent, accumulator); // Process the extracted content
                        return; // Don't process the original 'message' event further
                    }
                } catch (e) { /* Ignore JSON parse error, proceed to normal handling */ }
            }

            // Handle event remapping and buffering ('r' events)
            if (event.type === 'event' && event.event) {
                const eventType = event.event.trim();
                
                // Special handling for 'c' events - process immediately to ensure text updates
                if ((eventType === 'c' || eventType === 'content') && event.data) {
                    // Process 'c' events immediately for faster text updates
                    processSseEvent(event, accumulator);
                    return;
                }
                
                // Buffer 'r' events, but with more aggressive processing
                if (eventType === 'r' && event.data) {
                    state.rEventBuffer += event.data;
                    const now = Date.now();
                    
                    // More aggressive buffer processing:
                    // 1. Smaller buffer size (50 instead of 100)
                    // 2. Shorter timeout (100ms instead of 200ms)
                    // 3. Also trigger on newlines which often indicate logical breaks
                    const hasNewline = state.rEventBuffer.includes('\n');
                    const bufferSizeReached = state.rEventBuffer.length > 50;  // Reduced from 100
                    const timeoutReached = (now - state.lastREventTime) > 100; // Reduced from 200ms
                    
                    if (bufferSizeReached || timeoutReached || hasNewline) {
                        logger.debug(`Processing 'r' buffer: length=${state.rEventBuffer.length}, timeout=${now - state.lastREventTime}ms, hasNewline=${hasNewline}`);
                        
                        const batchedEvent = { type: 'event', event: 'r', data: state.rEventBuffer };
                        processSseEvent(batchedEvent, accumulator); // Process the buffered 'r' event

                        // Also process as content if not prefixed (common pattern)
                        // Check if the buffer looks like raw text rather than a data: line
                        if (!/^data\s*:/i.test(state.rEventBuffer.trim())) {
                            const contentEvent = { type: 'event', event: 'content', data: state.rEventBuffer };
                            processSseEvent(contentEvent, accumulator); // Process as 'content' too
                        }
                        
                        state.rEventBuffer = ""; // Reset buffer
                        state.lastREventTime = now; // Reset timer
                    }
                    
                    // Before returning, check if we've accumulated text
                    if (accumulator.content.text && accumulator.content.text.length > 0 && !accumulator.contentLogged) {
                        logger.debug(`Accumulated text content (length: ${accumulator.content.text.length}): "${accumulator.content.text.substring(0, 50)}..."`);
                        accumulator.contentLogged = true;
                    }
                    
                    return; // Skip further processing for 'r' events
                }
            }

            // Normal event processing (for non-'r' events, or 'r' events before buffer flush)
            processSseEvent(event, accumulator);
            
            // Check accumulated content after processing any event
            if (accumulator.content.text && accumulator.content.text.length > 0 && !accumulator.contentLogged) {
                logger.debug(`Accumulated text content (length: ${accumulator.content.text.length}): "${accumulator.content.text.substring(0, 50)}..."`);
                accumulator.contentLogged = true;
            }
        }
    });
}

// --- SSE Parser Helper --- END

// --- TransformStream Helpers --- START

/**
 * Sends updates using OpenAI format.
 * Now accepts either rawChunk (directly from decode) or an accumulator for end-of-stream processing.
 */
function _sendUpdates(controller, input, modelId, requestId, encoder, streamContext) {
    // 判断是否是直接传入的原始数据块
    const isRawChunk = typeof input === 'string';
    
    try {
        if (isRawChunk) {
            // 处理原始数据：将SSE事件转换为OpenAI格式
            const rawChunk = input;
            
            // 提取并处理"event:r\ndata:xxx"和"event:c\ndata:xxx"格式
            const rMatches = rawChunk.match(/event:r\s*\r?\ndata:(.*?)(?=\r?\n\r?\nevent|\r?\n\r?\n$|$)/gs);
            const cMatches = rawChunk.match(/event:c\s*\r?\ndata:(.*?)(?=\r?\n\r?\nevent|\r?\n\r?\n$|$)/gs);
            
            // 处理r事件（推理内容）
            if (rMatches && rMatches.length > 0) {
                rMatches.forEach(match => {
                    // 提取data部分并清理
                    let content = match.replace(/event:r\s*\r?\ndata:/g, '').trim();
                    
                    // 进一步清理，去除data:前缀和转义字符
                    content = content.replace(/\r?\ndata:/g, '\n').trim();
                    content = content.replace(/\\n/g, '\n');
                    
                    if (content && content.length > 0) {
                        // 创建OpenAI格式的块并发送
                        const openAiChunk = _createOpenAiDeltaChunk(modelId, requestId, content);
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAiChunk)}\n\n`));
                    }
                });
            }
            
            // 处理c事件（内容事件）
            if (cMatches && cMatches.length > 0) {
                cMatches.forEach(match => {
                    // 提取data部分并清理
                    let content = match.replace(/event:c\s*\r?\ndata:/g, '').trim();
                    
                    // 进一步清理，去除data:前缀和转义字符
                    content = content.replace(/\r?\ndata:/g, '\n').trim();
                    content = content.replace(/\\n/g, '\n');
                    
                    if (content && content.length > 0) {
                        // 创建OpenAI格式的块并发送
                        const openAiChunk = _createOpenAiDeltaChunk(modelId, requestId, content);
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAiChunk)}\n\n`));
                    }
                });
            }
            
            // 检查sources事件
            const sourcesMatch = rawChunk.match(/event:sources\s*\r?\ndata:(.*?)(?=\r?\n\r?\nevent|\r?\n\r?\n$|$)/s);
            if (sourcesMatch && sourcesMatch[1]) {
                try {
                    const sourcesData = JSON.parse(sourcesMatch[1].trim());
                    if (Array.isArray(sourcesData) && sourcesData.length > 0) {
                        const sourcesUpdate = _createOpenAiFunctionCallChunk(modelId, requestId, "sources", { sources: sourcesData });
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(sourcesUpdate)}\n\n`));
                    }
                } catch (e) {
                    logger.warn('解析sources事件出错:', e);
                }
            }
            
            // 检查error事件
            const errorMatch = rawChunk.match(/event:error\s*\r?\ndata:(.*?)(?=\r?\n\r?\nevent|\r?\n\r?\n$|$)/s);
            if (errorMatch && errorMatch[1]) {
                const errorData = errorMatch[1].trim();
                const errorUpdate = _createOpenAiFunctionCallChunk(modelId, requestId, "error", { error: errorData }, true);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorUpdate)}\n\n`));
            }
            
            // 检查done/close事件，不发送结束信号（由flush处理）
            if (rawChunk.includes('event:done') || rawChunk.includes('event:close')) {
                // 这里不直接发送结束信号，由flush处理
                streamContext.receivedEndSignal = true;
            }
        } else {
            // 处理流结束时传入的完整accumulator
            const accumulator = input;
            
            // 只在结束时调用，所以一次性发送所有剩余文本
            if (accumulator.content && accumulator.content.text && accumulator.content.text.length > 0) {
                const textContent = accumulator.content.text;
                logger.debug(`流结束，发送剩余文本内容，长度: ${textContent.length}`);
                
                // 在流结束时使用较小的文本块（60字符）分片发送
                const chunkSize = 60;
                for (let i = 0; i < textContent.length; i += chunkSize) {
                    const chunk = textContent.substring(i, Math.min(i + chunkSize, textContent.length));
                    if (chunk && chunk.length > 0) {
                        const openAiChunk = _createOpenAiDeltaChunk(modelId, requestId, chunk);
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAiChunk)}\n\n`));
                    }
                }
            }
            
            // 发送sources（如果有且未发送过）
            if (accumulator.content && accumulator.content.sources && 
                accumulator.content.sources.length > 0 && !streamContext.sentSources) {
                const sourcesUpdate = _createOpenAiFunctionCallChunk(modelId, requestId, "sources", { sources: accumulator.content.sources });
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(sourcesUpdate)}\n\n`));
                streamContext.sentSources = true;
            }
            
            // 发送error（如果有且未发送过）
            if (accumulator.content && accumulator.content.error && !streamContext.sentError) {
                const errorUpdate = _createOpenAiFunctionCallChunk(modelId, requestId, "error", { error: accumulator.content.error }, true);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorUpdate)}\n\n`));
                streamContext.sentError = true;
            }
        }
    } catch (error) {
        logger.error('_sendUpdates执行出错:', error);
        try {
            const errorPayload = _createOpenAiErrorDetailsChunk(modelId, requestId, `处理数据出错: ${error.message}`);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorPayload)}\n\n`));
        } catch (e) {
            logger.error('发送错误通知时出错:', e);
        }
    }
}

/**
 * Handles the start logic for the TransformStream.
 */
function _transformStreamStart(controller, modelId, requestId, encoder) {
    const initChunk = _createOpenAiInitialChunk(modelId, requestId);
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(initChunk)}\n\n`));
    logger.debug('Transform stream started and initialization message sent');
    // No timer started here anymore
}

/**
 * Handles the transform logic for the TransformStream.
 * 直接处理SSE事件并转换为OpenAI格式，不依赖accumulator
 */
function _transformStreamTransform(chunk, controller, decoder, modelId, requestId, encoder, streamContext) {
    try {
        const decodedChunk = decoder.decode(chunk, { stream: true });
        // logger.debug(`Raw chunk received: <<<${decodedChunk}>>>`);
        
        if (!streamContext.firstChunkReceived) {
            streamContext.firstChunkReceived = true;
            logger.debug(`First data chunk received at: ${new Date().toISOString()}`);
        }
        
        // 保存原始数据供flush阶段使用
        streamContext.rawDataLog.push(decodedChunk);
        
        // 提取并处理"event:r\ndata:xxx"和"event:c\ndata:xxx"格式
        const rMatches = decodedChunk.match(/event:r\s*\r?\ndata:(.*?)(?=\r?\n\r?\nevent|\r?\n\r?\n$|$)/gs);
        const cMatches = decodedChunk.match(/event:c\s*\r?\ndata:(.*?)(?=\r?\n\r?\nevent|\r?\n\r?\n$|$)/gs);
        
        // 处理r事件（推理内容）
        if (rMatches && rMatches.length > 0) {
            rMatches.forEach(match => {
                // 提取data部分并清理
                let content = match.replace(/event:r\s*\r?\ndata:/g, '').trim();
                
                // 进一步清理，去除data:前缀和转义字符
                content = content.replace(/\r?\ndata:/g, '\n').trim();
                content = content.replace(/\\n/g, '\n');
                
                if (content && content.length > 0) {
                    // 创建OpenAI格式的块并发送
                    const openAiChunk = _createOpenAiDeltaChunk(modelId, requestId, content);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAiChunk)}\n\n`));
                }
            });
        }
        
        // 处理c事件（内容事件）
        if (cMatches && cMatches.length > 0) {
            cMatches.forEach(match => {
                // 提取data部分并清理
                let content = match.replace(/event:c\s*\r?\ndata:/g, '').trim();
                
                // 进一步清理，去除data:前缀和转义字符
                content = content.replace(/\r?\ndata:/g, '\n').trim();
                content = content.replace(/\\n/g, '\n');
                
                if (content && content.length > 0) {
                    // 创建OpenAI格式的块并发送
                    const openAiChunk = _createOpenAiDeltaChunk(modelId, requestId, content);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAiChunk)}\n\n`));
                }
            });
        }
        
        // 检查sources事件
        const sourcesMatch = decodedChunk.match(/event:sources\s*\r?\ndata:(.*?)(?=\r?\n\r?\nevent|\r?\n\r?\n$|$)/s);
        if (sourcesMatch && sourcesMatch[1]) {
            try {
                const sourcesData = JSON.parse(sourcesMatch[1].trim());
                if (Array.isArray(sourcesData) && sourcesData.length > 0) {
                    const sourcesUpdate = _createOpenAiFunctionCallChunk(modelId, requestId, "sources", { sources: sourcesData });
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(sourcesUpdate)}\n\n`));
                    streamContext.sentSources = true;
                }
            } catch (e) {
                logger.warn('解析sources事件出错:', e);
            }
        }
        
        // 检查error事件
        const errorMatch = decodedChunk.match(/event:error\s*\r?\ndata:(.*?)(?=\r?\n\r?\nevent|\r?\n\r?\n$|$)/s);
        if (errorMatch && errorMatch[1]) {
            const errorData = errorMatch[1].trim();
            const errorUpdate = _createOpenAiFunctionCallChunk(modelId, requestId, "error", { error: errorData }, true);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorUpdate)}\n\n`));
            streamContext.sentError = true;
        }
        
        // 检查done/close事件，不发送结束信号（由flush处理）
        if (decodedChunk.includes('event:done') || decodedChunk.includes('event:close')) {
            streamContext.receivedEndSignal = true;
            logger.debug('接收到结束信号，等待flush处理');
        }
    } catch (error) {
        logger.error('Error in stream transform:', error);
        try {
            // 发送错误信息
            const errorPayload = _createOpenAiErrorDetailsChunk(modelId, requestId, `Stream processing error: ${error.message}`);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorPayload)}\n\n`));
        } catch (e) {
            logger.error('Failed to send error notification in transform catch block:', e);
        }
    }
}

/**
 * Handles the flush logic for the TransformStream.
 * 处理流结束时的逻辑，确保所有内容都被发送
 */
function _transformStreamFlush(controller, modelId, requestId, encoder, streamContext) {
    logger.debug('Transform stream flushing...');
    
    // 检查是否有未处理的原始数据
    if (streamContext.rawDataLog && streamContext.rawDataLog.length > 0) {
        // 提取任何可能未被处理的内容
        const fullRawData = streamContext.rawDataLog.join('');
        
        // 再次检查是否有未处理的事件
        const rMatches = fullRawData.match(/event:r\s*\r?\ndata:(.*?)(?=\r?\n\r?\nevent|\r?\n\r?\n$|$)/gs);
        const cMatches = fullRawData.match(/event:c\s*\r?\ndata:(.*?)(?=\r?\n\r?\nevent|\r?\n\r?\n$|$)/gs);
        
        let extractedContent = "";
        
        // 处理r事件
        if (rMatches && rMatches.length > 0) {
            rMatches.forEach(match => {
                let dataContent = match.replace(/event:r\s*\r?\ndata:/g, '').trim();
                dataContent = dataContent.replace(/\r?\ndata:/g, '\n').trim();
                dataContent = dataContent.replace(/\\n/g, '\n');
                
                if (dataContent) extractedContent += dataContent;
            });
        }
        
        // 处理c事件
        if (cMatches && cMatches.length > 0) {
            cMatches.forEach(match => {
                let dataContent = match.replace(/event:c\s*\r?\ndata:/g, '').trim();
                dataContent = dataContent.replace(/\r?\ndata:/g, '\n').trim();
                dataContent = dataContent.replace(/\\n/g, '\n');
                
                if (dataContent) extractedContent += dataContent;
            });
        }
        
        // 如果有提取到的内容但之前可能没有发送，分块发送它
        if (extractedContent && extractedContent.length > 0) {
            logger.debug(`在flush阶段提取到未发送的内容，长度: ${extractedContent.length}`);
            
            // 用60字符的块分片发送
            const chunkSize = 60;
            for (let i = 0; i < extractedContent.length; i += chunkSize) {
                const chunk = extractedContent.substring(i, Math.min(i + chunkSize, extractedContent.length));
                if (chunk && chunk.length > 0) {
                    const openAiChunk = _createOpenAiDeltaChunk(modelId, requestId, chunk);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAiChunk)}\n\n`));
                }
            }
        }
        
        // 处理sources事件（如果之前未发送）
        if (!streamContext.sentSources) {
            const sourcesMatch = fullRawData.match(/event:sources\s*\r?\ndata:(.*?)(?=\r?\n\r?\nevent|\r?\n\r?\n$|$)/s);
            if (sourcesMatch && sourcesMatch[1]) {
                try {
                    const sourcesData = JSON.parse(sourcesMatch[1].trim());
                    if (Array.isArray(sourcesData) && sourcesData.length > 0) {
                        const sourcesUpdate = _createOpenAiFunctionCallChunk(modelId, requestId, "sources", { sources: sourcesData });
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(sourcesUpdate)}\n\n`));
                    }
                } catch (e) {
                    logger.warn('flush阶段解析sources事件出错:', e);
                }
            }
        }
        
        // 处理error事件（如果之前未发送）
        if (!streamContext.sentError) {
            const errorMatch = fullRawData.match(/event:error\s*\r?\ndata:(.*?)(?=\r?\n\r?\nevent|\r?\n\r?\n$|$)/s);
            if (errorMatch && errorMatch[1]) {
                const errorData = errorMatch[1].trim();
                const errorUpdate = _createOpenAiFunctionCallChunk(modelId, requestId, "error", { error: errorData }, true);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorUpdate)}\n\n`));
                streamContext.sentError = true;
            }
        }
    }
    
    // 发送最终完成信号
    logger.debug('发送最终完成信号');
    const finishReason = streamContext.sentError ? "error" : "stop";
    const finishChunk = _createOpenAiFinishChunk(modelId, requestId, finishReason);
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(finishChunk)}\n\n`));
    controller.enqueue(encoder.encode(SSE_DONE_CHUNK));
    
    logger.debug('内部逻辑流处理完成');
}

// --- TransformStream Helpers --- END

/**
 * Helper function to process streaming responses from the backend.
 * 简化版，移除accumulator依赖
 */
function _processStreamingResponse(backendResponse, modelId, requestId, encoder, decoder) {
    logger.debug('处理来自后端的流式响应 (简化版，不使用accumulator)');
    
    // 共享流上下文
    const streamContext = {
        rawDataLog: [],
        firstChunkReceived: false,
        receivedEndSignal: false,
        sentSources: false,
        sentError: false
    };

    const transformStream = new TransformStream({
        start(controller) {
            logger.debug('Transform stream started.');
            _transformStreamStart(controller, modelId, requestId, encoder);
        },

        transform(chunk, controller) {
            _transformStreamTransform(chunk, controller, decoder, modelId, requestId, encoder, streamContext);
        },

        flush(controller) {
            logger.debug('Transform stream flushing.');
            _transformStreamFlush(controller, modelId, requestId, encoder, streamContext);
        }
    });

    // 将后端响应通过transform stream管道传输
    const outputStream = backendResponse.body.pipeThrough(transformStream);

    // 返回流式响应
    return new NextResponse(outputStream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    });
}

/**
 * Helper function to process non-streaming responses from the backend.
 * @param {Response} backendResponse - The response from the backend.
 * @param {TextDecoder} decoder - Text decoder instance.
 * @returns {Promise<NextResponse>} A NextResponse object with the aggregated JSON body.
 */
async function _processNonStreamingResponse(backendResponse, decoder) {
    logger.debug('Processing non-streaming response from internal logic backend (NEW logic).');
    let accumulator = createSseAccumulatorV2();
    let streamClosed = false;
    const reader = backendResponse.body.getReader();

    const parser = createParser({
        onEvent: (event) => {
            const result = processSseEvent(event, accumulator);
            if (result.terminate) {
                logger.debug(`Termination signal during non-streaming aggregation (Error: ${!!result.error}).`);
                streamClosed = true;
            }
        }
    });

    try {
        while (!streamClosed) {
            const { value, done } = await reader.read();
            if (done) {
                streamClosed = true;
                break;
            }
            const decodedChunk = decoder.decode(value, { stream: true });
            parser.feed(decodedChunk);
        }
    } catch (error) {
        logger.error('Error reading stream for non-streaming aggregation (NEW logic):', error);
        // Return error response
        return NextResponse.json(
            { error: 'Failed to read backend stream for aggregation.', details: error.message, partial_content: accumulator.content },
            { status: 500 }
        );
    }

    if (!accumulator.content.isFinished) {
        accumulator.content.isFinished = true;
    }

    logger.debug('Returning aggregated non-streaming response (NEW logic).');
    return NextResponse.json(accumulator.content);
}

/**
 * Main handler using the initialized WASM via glue code.
 * ADAPTED to use the new SSE processing logic and helper functions.
 */
export async function handleRustLogicRequest(requestData, modelId, providerConfig) {
    logger.debug(`Handling request for internal_rust_logic with model: ${modelId}`);

    // Step 1: Ensure WASM is initialized
    const wasmErrorResponse = await _ensureWasmInitialized();
    if (wasmErrorResponse) {
        return wasmErrorResponse;
    }

    const isStreaming = requestData.stream === true;
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const requestId = `chatcmpl-${crypto.randomBytes(16).toString('hex')}`;

    try {
        // Step 2: Send request to backend
        const backendResponse = await _sendBackendRequest(requestData, modelId);

        // Step 3: Process backend response (Streaming or Non-streaming)
        if (isStreaming) {
            return _processStreamingResponse(backendResponse, modelId, requestId, encoder, decoder);
        } else {
            return await _processNonStreamingResponse(backendResponse, decoder);
        }

    } catch (error) {
        // Handle errors from _sendBackendRequest or other unexpected errors
        logger.error(`Error in handleRustLogicRequest: ${error.message}`, error.stack);
        // Determine appropriate status code based on error type if possible
        const status = error.message.includes('backend error') ? 502 : 500;
        return NextResponse.json(
            { error: 'Failed to process internal rust logic request.', details: error.message },
            { status: status }
        );
    }
}
