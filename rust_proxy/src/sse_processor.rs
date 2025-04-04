use serde::{Deserialize, Serialize};
use serde_json::Value;
use tracing::warn;
use crate::dev_client::DevRequestOptions; // Needed for model name
use anyhow::{anyhow, Result};
use futures_util::stream::{self, Stream, StreamExt};
use std::time::{SystemTime, UNIX_EPOCH};
use tracing::{debug, info, error, trace};
use bytes::Bytes;
use std::str;
use std::pin::Pin;
// use std::task::{Context as TaskContext, Poll};
// use tokio::macros::support::Pin as TokioPin; // Needed for async block
// use futures_util::pin_mut; // Add this import

// --- Dev API SSE Event Data Structures (Based on JS analysis) ---

// Represents the different types of actions Dev might send
#[derive(Debug, Clone, Serialize, Deserialize)] pub struct DevAction {
    #[serde(rename = "type")] pub action_type: u32,
    // Other fields based on actual action data...
    #[serde(flatten)] pub extra: Value, // Capture unknown fields
}

// Represents source information
#[derive(Debug, Clone, Serialize, Deserialize)] pub struct DevSource {
    pub title: Option<String>,
    pub url: Option<String>,
    // Other fields...
    #[serde(flatten)] pub extra: Value, // Capture unknown fields
}

// Represents GitHub source information
#[derive(Debug, Clone, Serialize, Deserialize)] pub struct DevGithubSource {
    pub repo: Option<String>,
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    // Other fields...
    #[serde(flatten)] pub extra: Value, // Capture unknown fields
}

// Main accumulator state, mirroring JS accumulator
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SseAccumulator {
    // _id: String, // Could store nonce if needed
    // message_type: String, // Seems always "text"
    pub text: String,
    pub actions: Vec<DevAction>,
    pub sources: Vec<DevSource>,
    pub github_sources: Vec<DevGithubSource>,
    // Related questions handling from JS:
    // JS had raw + parsed. We can just store parsed.
    pub related_questions: Vec<String>,
    related_questions_raw: String, // Keep raw temporarily for parsing

    pub thread_id: Option<String>,
    pub query_message_id: Option<String>,
    pub answer_message_id: Option<String>,
    pub thread_title: Option<String>,
    pub reasoning: Option<String>,

    pub is_finished: bool,
    pub error: Option<String>,
    // extra: Value, // Could store original ExtraPayload if needed
}

impl SseAccumulator {
    // Helper to parse related questions, similar to JS logic
    fn update_related_questions(&mut self) {
        self.related_questions = self.related_questions_raw
            .split('\n')
            .map(|q| q.trim())
            .filter(|q| !q.is_empty())
            .map(String::from)
            .collect();
    }
}

// --- OpenAI Chat Completion Chunk Structures ---

#[derive(Debug, Serialize)]
pub struct ChatCompletionChunk {
    pub id: String, // Consider using nonce or generating new IDs
    pub object: String, // Typically "chat.completion.chunk"
    pub created: u64, // Unix timestamp
    pub model: String, // Model name from request or default
    pub choices: Vec<Choice>,
    // pub system_fingerprint: Option<String>, // Optional
    // pub usage: Option<Usage>, // Typically null for chunks, present in final non-stream response
}

#[derive(Debug, Serialize)]
pub struct Choice {
    pub index: u32,
    pub delta: Delta,
    pub finish_reason: Option<String>, // e.g., "stop", "length"
    // pub logprobs: Option<LogProbs>, // Optional
}

#[derive(Debug, Serialize, Default)]
pub struct Delta {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub role: Option<String>, // e.g., "assistant"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    // pub tool_calls: Option<Vec<ToolCall>>, // Optional for tool usage
}

// Helper function to safely parse JSON from SSE data
fn safe_json_parse<'a, T>(data: &'a str) -> Option<T>
where
    T: Deserialize<'a>,
{
    match serde_json::from_str::<T>(data) {
        Ok(parsed) => Some(parsed),
        Err(e) => {
            warn!("Failed to parse JSON from SSE data: {}. Data: {}", e, data);
            None
        }
    }
}

// Enum to represent parsed SSE lines
#[derive(Debug, PartialEq, Eq)]
enum SseLine {
    Event(String),
    Data(String),
    Retry(String),
    Id(String),
    Comment,
    Empty, // End of an event
}

// Parses a single line according to SSE format
fn parse_sse_line(line: &str) -> SseLine {
    if line.is_empty() {
        SseLine::Empty
    } else if line.starts_with(':') {
        SseLine::Comment
    } else {
        let (field, value) = line.split_once(':').unwrap_or((line, ""));
        // Trim leading space from value if present
        let value = value.strip_prefix(' ').unwrap_or(value);
        match field {
            "event" => SseLine::Event(value.to_string()),
            "data" => SseLine::Data(value.to_string()),
            "id" => SseLine::Id(value.to_string()),
            "retry" => SseLine::Retry(value.to_string()),
            _ => SseLine::Comment, // Treat unknown fields as comments
        }
    }
}

/// Processes a stream of Dev Bytes and transforms it into a 
/// stream of OpenAI-compatible ChatCompletionChunks using stream::unfold.
pub fn process_dev_bytes_stream_unfold(
    byte_stream: impl Stream<Item = Result<Bytes, reqwest::Error>> + Send + 'static,
    options: DevRequestOptions, 
    request_id: String, 
) -> impl Stream<Item = Result<ChatCompletionChunk>> {
    let model_name = options.model.unwrap_or_else(|| "unknown-dev-model".to_string());

    // State for unfold
    struct State {
        byte_stream: Pin<Box<dyn Stream<Item = Result<Bytes, reqwest::Error>> + Send + 'static>>,
        decoder_buffer: String,
        accumulator: SseAccumulator,
        current_event_name: String,
        current_data_buffer: Vec<String>,
        model_name: String,
        request_id: String,
        // finished_normally: bool, // Not strictly needed if we check accumulator.is_finished
        final_chunk_sent: bool, // Flag to ensure unfold terminates correctly
    }

    let initial_state = State {
        byte_stream: Box::pin(byte_stream),
        decoder_buffer: String::new(),
        accumulator: SseAccumulator::default(),
        current_event_name: "message".to_string(),
        current_data_buffer: Vec::new(),
        model_name,
        request_id,
        // finished_normally: false, 
        final_chunk_sent: false, // Initialize the flag
    };

    stream::unfold(initial_state, |mut state| async move {
        // Check if the final chunk was already sent in the previous iteration
        if state.final_chunk_sent {
            return None; // Terminate the unfold stream
        }

        // Loop to read bytes and process lines until an event is dispatched or stream ends
        loop {
            let mut event_chunk: Option<Result<ChatCompletionChunk>> = None;

            // --- Process buffered lines first ---
            // Process complete lines ending with '\n'
            while let Some(newline_pos) = state.decoder_buffer.find('\n') {
                let line = state.decoder_buffer.drain(..=newline_pos).collect::<String>();
                let trimmed_line = line.trim_end_matches(|c| c == '\n' || c == '\r');
                trace!(line = trimmed_line, "Processing buffered SSE line");

                match parse_sse_line(trimmed_line) {
                    SseLine::Empty => {
                        if !state.current_data_buffer.is_empty() {
                            let data = state.current_data_buffer.join("\n");
                            debug!(event_type = %state.current_event_name, event_data = %data, "Dispatching buffered Dev event");
                            state.current_data_buffer.clear();
                            let event_name = std::mem::replace(&mut state.current_event_name, "message".to_string());

                            if let Some(chunk) = process_single_dev_event(
                                &mut state.accumulator,
                                event_name,
                                data,
                                &state.request_id,
                                &state.model_name
                            ) {
                                event_chunk = Some(Ok(chunk));
                                break; // Break inner while loop to yield the chunk
                            }
                        }
                        // Reset event name after processing an event block
                        state.current_event_name = "message".to_string(); 
                    }
                    SseLine::Event(name) => state.current_event_name = name,
                    SseLine::Data(data) => state.current_data_buffer.push(data),
                    SseLine::Id(_) | SseLine::Retry(_) | SseLine::Comment => { /* Ignore */ },
                }
            }

            // If we processed an event from the buffer and have a chunk, yield it
            if event_chunk.is_some() {
                return Some((event_chunk.unwrap(), state));
            }

            // --- If no chunk generated from buffer, read more bytes ---
            match state.byte_stream.next().await {
                Some(Ok(bytes)) => {
                    match str::from_utf8(&bytes) {
                        Ok(chunk_str) => state.decoder_buffer.push_str(chunk_str),
                        Err(e) => {
                            warn!("Invalid UTF-8 sequence: {}, using lossy", e);
                            state.decoder_buffer.push_str(&String::from_utf8_lossy(&bytes));
                        }
                    }
                    // Loop again to process the newly added buffer content
                }
                Some(Err(e)) => {
                    error!("Error reading from byte stream: {}", e);
                    state.final_chunk_sent = true; // Ensure termination on error too
                    return Some((Err(anyhow!(e)), state)); // Yield error and stop
                }
                None => {
                    // End of byte stream
                    info!("Dev byte stream finished.");
                    trace!(buffer = %state.decoder_buffer, "Processing end of stream. Residual buffer content.");


                    // --- Process any remaining data in the buffer ---
                    if !state.decoder_buffer.is_empty() {
                        warn!("Processing residual buffer content after stream end: '{}'", state.decoder_buffer);
                        // Treat the remaining buffer as potentially incomplete lines or data fragments.
                        // Attempt to parse lines, but handle potential lack of final newline/empty line.
                        let lines: Vec<&str> = state.decoder_buffer.split('\n').collect();
                        for (i, line) in lines.iter().enumerate() {
                             let trimmed_line = line.trim_end_matches('\r');
                             if trimmed_line.is_empty() && i == lines.len() -1 {
                                // Ignore trailing empty string after split if it was the last char
                                continue;
                             }
                             trace!(line = trimmed_line, "Processing residual SSE line");
                             match parse_sse_line(trimmed_line) {
                                 // Don't dispatch on Empty here, wait till the end
                                 SseLine::Empty => {},
                                 SseLine::Event(name) => state.current_event_name = name,
                                 SseLine::Data(data) => state.current_data_buffer.push(data),
                                 _ => { /* Ignore */ }
                             }
                         }
                         // Dispatch any remaining data collected from the residual buffer
                         if !state.current_data_buffer.is_empty() {
                            let data = state.current_data_buffer.join("\n");
                            debug!(event_type = %state.current_event_name, event_data = %data, "Dispatching residual Dev event from buffer");
                            // Don't clear buffers here, just process
                            let event_name = state.current_event_name.clone(); // Use last known event name

                            // Update accumulator but DON'T yield a chunk here,
                            // accumulate everything before the final chunk.
                            // This ensures the last piece of text is in the accumulator,
                            // even if it doesn't generate its own content chunk immediately.
                            process_single_dev_event(
                                &mut state.accumulator,
                                event_name,
                                data,
                                &state.request_id,
                                &state.model_name
                            );
                        }
                        trace!("Finished processing residual buffer.");
                        state.decoder_buffer.clear(); // Clear buffer after processing
                    } else {
                       trace!("Residual buffer is empty. No residual processing needed.");
                    }


                    // --- Send final chunk or terminate ---
                    // Mark that we are attempting to send the final chunk or terminate.
                    // This prevents re-entering this final block in the next unfold iteration.
                    state.final_chunk_sent = true;
                    trace!(is_finished = state.accumulator.is_finished, "Determining final action based on accumulator state.");

                    if !state.accumulator.is_finished {
                        // Stream ended normally (no prior 'error' event marked it as finished)
                        state.accumulator.is_finished = true; // Mark as finished now
                        trace!("Accumulator not finished, updating related questions.");
                        state.accumulator.update_related_questions(); // Final update for related questions
                        let final_chunk = create_final_chunk(
                            state.request_id.clone(),
                            state.model_name.clone(),
                            "stop".to_string() // OpenAI standard reason for normal completion
                        );
                        debug!(request_id = %state.request_id, "Yielding final 'stop' chunk for normally finished stream.");
                        return Some((Ok(final_chunk), state)); // Yield final chunk with finish_reason: "stop"
                    } else {
                         // Stream ended, but an error was already processed and is_finished is true.
                         // The error chunk (which includes finish_reason: "stop") should have already
                         // been sent by process_single_dev_event when the 'error' event occurred.
                         debug!(request_id = %state.request_id, "Accumulator already marked as finished (likely due to prior error event). Terminating stream without final chunk.");
                         // Just terminate the unfold stream.
                         return None; // End the unfold stream
                    }
                }
            }
        }
    })
}

// Helper function to process a single parsed Dev event and potentially create a chunk
fn process_single_dev_event(
    accumulator: &mut SseAccumulator,
    event_name: String,
    data: String,
    request_id: &str,
    model_name: &str,
) -> Option<ChatCompletionChunk> {
    trace!(event = %event_name, data = %data, request_id = request_id, "Processing single Dev event");
    match event_name.as_str() {
        "message" | "content" | "c" => {
            if data.is_empty() { // Avoid creating empty content chunks
                trace!("Skipping empty content/message event.");
                None
            } else {
                let delta_content = data; // Already have the data string
                accumulator.text += &delta_content;
                Some(create_content_chunk(
                    request_id.to_string(),
                    model_name.to_string(),
                    delta_content,
                ))
            }
        }
         "action" => {
            match safe_json_parse::<DevAction>(&data) {
                Some(a) => {
                    trace!(action = ?a, "Parsed action event");
                    accumulator.actions.push(a);
                }
                None => warn!(data = %data, "Failed to parse action event data"),
            }
            None // Actions don't generate OpenAI chunks directly
         }
         "sources" => {
             match safe_json_parse::<Vec<DevSource>>(&data) {
                 Some(s) => {
                    trace!(sources = ?s, "Parsed sources event");
                    accumulator.sources = s; // Overwrite sources with the latest list
                 }
                 None => warn!(data = %data, "Failed to parse sources event data"),
             }
             None
         }
         "repoSources" => {
             match safe_json_parse::<Vec<DevGithubSource>>(&data) {
                 Some(gs) => {
                    trace!(github_sources = ?gs, "Parsed repoSources event");
                    accumulator.github_sources = gs; // Overwrite repo sources
                 }
                 None => warn!(data = %data, "Failed to parse repoSources event data"),
            }
            None
         }
         "rlq" | "q" => {
            if !data.is_empty() { // Append only if data is not empty
                accumulator.related_questions_raw += &format!("\n{}", data.trim()); // Trim whitespace
                trace!(raw_related = %accumulator.related_questions_raw, "Appended related question data");
            }
            None
         }
         "r" => {
            accumulator.reasoning.get_or_insert_with(String::new).push_str(&data);
            trace!(reasoning = ?accumulator.reasoning, "Appended reasoning data");
            None
         }
         "threadId" => { accumulator.thread_id = Some(data); trace!(thread_id = ?accumulator.thread_id, "Set thread ID"); None }
         "queryMessageId" => { accumulator.query_message_id = Some(data); trace!(query_message_id = ?accumulator.query_message_id, "Set query message ID"); None }
         "answerMessageId" => { accumulator.answer_message_id = Some(data); trace!(answer_message_id = ?accumulator.answer_message_id, "Set answer message ID"); None }
         "threadTitle" => { accumulator.thread_title = Some(data); trace!(thread_title = ?accumulator.thread_title, "Set thread title"); None }
         "error" => {
            error!(error_message = %data, request_id = request_id, "Received error event from Dev stream");
            accumulator.error = Some(data.clone());
            accumulator.is_finished = true; // Mark as finished due to error
            // Create and return the error chunk, which includes finish_reason: "stop"
            Some(create_error_chunk(
                request_id.to_string(),
                model_name.to_string(),
                data
            ))
        }
        // Handle potential "finish" event from Dev if it exists (though not seen in JS)
        // "finish" might signal normal completion without specific data.
        "finish" => {
             info!(request_id = request_id, "Received explicit 'finish' event from Dev stream.");
             // We don't mark is_finished=true here based *only* on this event.
             // The stream ending naturally (None from byte_stream) is the primary
             // signal for normal completion. This event itself doesn't carry data
             // needed for the final chunk, but good to log if it appears.
             None
        }
        _ => {
            trace!(event_name = event_name, "Ignoring unknown or unhandled Dev event type.");
            None /* Ignore unknown event types */
        }
    }
}

// Helper to create a content chunk
fn create_content_chunk(id: String, model: String, content: String) -> ChatCompletionChunk {
    ChatCompletionChunk {
        id,
        object: "chat.completion.chunk".to_string(),
        created: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        model,
        choices: vec![Choice {
            index: 0,
            delta: Delta {
                role: Some("assistant".to_string()), // Assume assistant role
                content: Some(content),
            },
            finish_reason: None,
        }],
    }
}

// Helper to create the final chunk for normal stream completion
fn create_final_chunk(id: String, model: String, finish_reason: String) -> ChatCompletionChunk {
     debug!(request_id = %id, finish_reason = %finish_reason, "Creating final chunk");
     ChatCompletionChunk {
        id,
        object: "chat.completion.chunk".to_string(),
        created: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        model,
        choices: vec![Choice {
            index: 0,
            delta: Delta::default(), // Final chunk has an empty delta
            finish_reason: Some(finish_reason),
        }],
    }
}

// Helper to create a chunk representing an error received from the Dev stream
// This chunk includes content indicating the error and a "stop" finish_reason.
fn create_error_chunk(id: String, model: String, error_message: String) -> ChatCompletionChunk {
    warn!(request_id = %id, error = %error_message, "Creating error chunk");
    ChatCompletionChunk {
        id,
        object: "chat.completion.chunk".to_string(),
        created: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        model,
        choices: vec![Choice {
            index: 0,
            delta: Delta {
                role: Some("assistant".to_string()), // Maintain assistant role
                // Include error message in content for visibility, though consumers might handle errors differently
                content: Some(format!("[STREAM_ERROR]: {}", error_message)),
            },
            // Crucially, set finish_reason to "stop" so the consumer knows the stream ended here.
            finish_reason: Some("stop".to_string()),
        }],
    }
}

// Placeholder for the stream processing function
// pub fn process_devstream(/* ... */) -> impl Stream<Item = Result<ChatCompletionChunk>> {
//     // ...
// } 

#[cfg(test)]
mod tests {
    use super::*; // Import items from the parent module (sse_processor)

    #[test]
    fn test_parse_sse_line_empty() {
        assert_eq!(parse_sse_line(""), SseLine::Empty);
    }

    #[test]
    fn test_parse_sse_line_comment() {
        assert_eq!(parse_sse_line(": this is a comment"), SseLine::Comment);
        assert_eq!(parse_sse_line(":"), SseLine::Comment); // Empty comment
    }

    #[test]
    fn test_parse_sse_line_event() {
        assert_eq!(parse_sse_line("event: message"), SseLine::Event("message".to_string()));
        assert_eq!(parse_sse_line("event:finish"), SseLine::Event("finish".to_string()));
        assert_eq!(parse_sse_line("event:"), SseLine::Event("".to_string())); // Empty event name
        assert_eq!(parse_sse_line("event: event with space"), SseLine::Event("event with space".to_string()));
    }

    #[test]
    fn test_parse_sse_line_data() {
        assert_eq!(parse_sse_line("data: {\"key\": \"value\"}"), SseLine::Data("{\"key\": \"value\"}".to_string()));
        assert_eq!(parse_sse_line("data: simple string"), SseLine::Data("simple string".to_string()));
        assert_eq!(parse_sse_line("data:"), SseLine::Data("".to_string())); // Empty data
        assert_eq!(parse_sse_line("data: data with : colon"), SseLine::Data("data with : colon".to_string()));
        // Test stripping leading space
        assert_eq!(parse_sse_line("data:  leading space"), SseLine::Data(" leading space".to_string()));
    }
     #[test]
    fn test_parse_sse_line_data_strips_leading_space() {
        // Should strip only the first leading space after the colon
        assert_eq!(parse_sse_line("data: {\"key\": \"value\"}"), SseLine::Data("{\"key\": \"value\"}".to_string()));
        assert_eq!(parse_sse_line("data:  two leading spaces"), SseLine::Data(" two leading spaces".to_string()));
        assert_eq!(parse_sse_line("data:"), SseLine::Data("".to_string()));
    }

    #[test]
    fn test_parse_sse_line_id() {
        assert_eq!(parse_sse_line("id: 12345"), SseLine::Id("12345".to_string()));
        assert_eq!(parse_sse_line("id:"), SseLine::Id("".to_string())); // Empty id
    }

    #[test]
    fn test_parse_sse_line_retry() {
        assert_eq!(parse_sse_line("retry: 5000"), SseLine::Retry("5000".to_string()));
        assert_eq!(parse_sse_line("retry:"), SseLine::Retry("".to_string())); // Empty retry
    }

     #[test]
    fn test_parse_sse_line_unknown_field() {
        // Unknown fields should be treated as comments
        assert_eq!(parse_sse_line("unknown: some value"), SseLine::Comment);
        assert_eq!(parse_sse_line("field without colon"), SseLine::Comment); // Treat line without colon as comment (or decide specific behavior)
    }

    // --- Tests for process_single_dev_event ---

    // Helper to create a default accumulator for testing
    fn default_accumulator() -> SseAccumulator {
        SseAccumulator::default()
    }

    const TEST_REQ_ID: &str = "test-req-123";
    const TEST_MODEL_NAME: &str = "test-model";

    #[test]
    fn test_process_event_content() {
        let mut acc = default_accumulator();
        let event = "content".to_string();
        let data = "Hello".to_string();

        let chunk = process_single_dev_event(&mut acc, event, data, TEST_REQ_ID, TEST_MODEL_NAME);

        assert!(chunk.is_some());
        let chunk = chunk.unwrap();
        assert_eq!(chunk.id, TEST_REQ_ID);
        assert_eq!(chunk.model, TEST_MODEL_NAME);
        assert_eq!(chunk.choices.len(), 1);
        assert_eq!(chunk.choices[0].delta.content, Some("Hello".to_string()));
        assert_eq!(chunk.choices[0].delta.role, Some("assistant".to_string()));
        assert_eq!(chunk.choices[0].finish_reason, None);
        assert_eq!(acc.text, "Hello");
    }
    
    #[test]
    fn test_process_event_message() {
         let mut acc = default_accumulator();
        let event = "message".to_string();
        let data = " World".to_string();
        acc.text = "Hello".to_string(); // Pre-existing text

        let chunk = process_single_dev_event(&mut acc, event, data, TEST_REQ_ID, TEST_MODEL_NAME);

        assert!(chunk.is_some());
        let chunk = chunk.unwrap();
        assert_eq!(chunk.choices[0].delta.content, Some(" World".to_string()));
        assert_eq!(acc.text, "Hello World"); // Check concatenation
    }

     #[test]
    fn test_process_event_c_alias() {
         let mut acc = default_accumulator();
        let event = "c".to_string(); // Alias for content
        let data = "TestC".to_string();

        let chunk = process_single_dev_event(&mut acc, event, data, TEST_REQ_ID, TEST_MODEL_NAME);

        assert!(chunk.is_some());
        let chunk = chunk.unwrap();
        assert_eq!(chunk.choices[0].delta.content, Some("TestC".to_string()));
        assert_eq!(acc.text, "TestC");
    }

    #[test]
    fn test_process_event_action() {
        let mut acc = default_accumulator();
        let event = "action".to_string();
        // Simple valid JSON for DevAction
        let data = r#"{"type": "search", "query": "rust sse"}"#.to_string();

        let chunk = process_single_dev_event(&mut acc, event, data, TEST_REQ_ID, TEST_MODEL_NAME);

        assert!(chunk.is_none()); // Actions don't produce chunks
        assert_eq!(acc.actions.len(), 1);
        assert_eq!(acc.actions[0].action_type, 1);
        // Check if extra field was captured (optional, depends on exact needs)
        assert!(acc.actions[0].extra.get("query").is_some());
        assert_eq!(acc.actions[0].extra["query"], serde_json::json!("rust sse"));
    }
     #[test]
    fn test_process_event_action_invalid_json() {
        let mut acc = default_accumulator();
        let event = "action".to_string();
        let data = r#"{"type": "search", query: "rust sse"}"#.to_string(); // Invalid JSON (missing quotes)

        // Suppress warning logs during this test if possible, or just check state
        let chunk = process_single_dev_event(&mut acc, event, data, TEST_REQ_ID, TEST_MODEL_NAME);

        assert!(chunk.is_none());
        assert!(acc.actions.is_empty()); // Parse failed, nothing added
    }

    #[test]
    fn test_process_event_sources() {
        let mut acc = default_accumulator();
        let event = "sources".to_string();
        let data = r#"[{"title": "Rust Docs", "url": "https://doc.rust-lang.org"}]"#.to_string();

        let chunk = process_single_dev_event(&mut acc, event, data, TEST_REQ_ID, TEST_MODEL_NAME);

        assert!(chunk.is_none());
        assert_eq!(acc.sources.len(), 1);
        assert_eq!(acc.sources[0].title, Some("Rust Docs".to_string()));
        assert_eq!(acc.sources[0].url, Some("https://doc.rust-lang.org".to_string()));
    }

     #[test]
    fn test_process_event_repo_sources() {
        let mut acc = default_accumulator();
        let event = "repoSources".to_string();
        let data = r#"[{"repo": "axum", "filePath": "src/main.rs"}]"#.to_string();

        let chunk = process_single_dev_event(&mut acc, event, data, TEST_REQ_ID, TEST_MODEL_NAME);

        assert!(chunk.is_none());
        assert_eq!(acc.github_sources.len(), 1);
        assert_eq!(acc.github_sources[0].repo, Some("axum".to_string()));
        assert_eq!(acc.github_sources[0].file_path, Some("src/main.rs".to_string()));
    }

     #[test]
    fn test_process_event_rlq_and_q() {
        let mut acc = default_accumulator();
        
        // Test 'rlq'
        let chunk1 = process_single_dev_event(&mut acc, "rlq".to_string(), "Related 1".to_string(), TEST_REQ_ID, TEST_MODEL_NAME);
        assert!(chunk1.is_none());
        assert_eq!(acc.related_questions_raw, "\nRelated 1");

        // Test 'q'
        let chunk2 = process_single_dev_event(&mut acc, "q".to_string(), "Related 2".to_string(), TEST_REQ_ID, TEST_MODEL_NAME);
        assert!(chunk2.is_none());
        assert_eq!(acc.related_questions_raw, "\nRelated 1\nRelated 2");

        // Check parsing (usually done at the end, but testable here)
        acc.update_related_questions();
        assert_eq!(acc.related_questions, vec!["Related 1".to_string(), "Related 2".to_string()]);
    }

     #[test]
    fn test_process_event_reasoning() {
        let mut acc = default_accumulator();
        let chunk1 = process_single_dev_event(&mut acc, "r".to_string(), "Reasoning part 1. ".to_string(), TEST_REQ_ID, TEST_MODEL_NAME);
        assert!(chunk1.is_none());
        assert_eq!(acc.reasoning, Some("Reasoning part 1. ".to_string()));

        let chunk2 = process_single_dev_event(&mut acc, "r".to_string(), "Reasoning part 2.".to_string(), TEST_REQ_ID, TEST_MODEL_NAME);
         assert!(chunk2.is_none());
        assert_eq!(acc.reasoning, Some("Reasoning part 1. Reasoning part 2.".to_string()));
    }
    
    #[test]
    fn test_process_event_metadata() {
        let mut acc = default_accumulator();
        let events = vec![
            ("threadId", "th_123"),
            ("queryMessageId", "qm_456"),
            ("answerMessageId", "am_789"),
            ("threadTitle", "Rust Test Thread"),
        ];

        for (event_name, event_data) in events {
            let chunk = process_single_dev_event(&mut acc, event_name.to_string(), event_data.to_string(), TEST_REQ_ID, TEST_MODEL_NAME);
            assert!(chunk.is_none());
        }

        assert_eq!(acc.thread_id, Some("th_123".to_string()));
        assert_eq!(acc.query_message_id, Some("qm_456".to_string()));
        assert_eq!(acc.answer_message_id, Some("am_789".to_string()));
        assert_eq!(acc.thread_title, Some("Rust Test Thread".to_string()));
    }

    #[test]
    fn test_process_event_error() {
        let mut acc = default_accumulator();
        let event = "error".to_string();
        let data = "Something went wrong".to_string();

        let chunk = process_single_dev_event(&mut acc, event, data, TEST_REQ_ID, TEST_MODEL_NAME);

        assert!(chunk.is_some());
        let chunk = chunk.unwrap();
        assert_eq!(chunk.id, TEST_REQ_ID);
        assert_eq!(chunk.model, TEST_MODEL_NAME);
        assert_eq!(chunk.choices.len(), 1);
        assert!(chunk.choices[0].delta.content.as_ref().unwrap().contains("ERROR")); // Check if error indicated in content
        assert_eq!(chunk.choices[0].finish_reason, Some("stop".to_string())); // Should stop on error

        assert_eq!(acc.error, Some("Something went wrong".to_string()));
        assert!(acc.is_finished);
    }

    #[test]
    fn test_process_event_unknown() {
        let mut acc = default_accumulator();
        let event = "unknown_event".to_string();
        let data = "some data".to_string();
        let initial_acc = acc.clone(); // Clone for comparison

        let chunk = process_single_dev_event(&mut acc, event, data, TEST_REQ_ID, TEST_MODEL_NAME);

        assert!(chunk.is_none());
        // Compare relevant fields to ensure no changes
        // For Vecs containing Value, compare lengths instead of direct equality
        assert_eq!(acc.text, initial_acc.text);
        assert_eq!(acc.actions.len(), initial_acc.actions.len()); // Check length
        assert_eq!(acc.sources.len(), initial_acc.sources.len()); // Check length
        assert_eq!(acc.github_sources.len(), initial_acc.github_sources.len()); // Check length
        assert_eq!(acc.related_questions_raw, initial_acc.related_questions_raw);
        assert_eq!(acc.reasoning, initial_acc.reasoning);
        assert_eq!(acc.error, initial_acc.error);
        assert_eq!(acc.is_finished, initial_acc.is_finished);
    }

    // TODO: Add tests for safe_json_parse (optional, low priority)
} 