mod wasm_signer;
mod utils;
mod dev_client;
mod sse_processor;
mod models;

use axum::{routing::{get, post}, Router, Json};
use axum::response::{IntoResponse, Response};
use axum::response::sse::{Event as SseEvent, Sse};
use futures_util::stream::StreamExt;
use http::StatusCode;
use std::convert::Infallible;
use std::net::SocketAddr;
use std::time::Duration;
use tower_http::trace::TraceLayer;
use tracing::{info, warn, error, debug, instrument};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

// --- Add dotenvy import ---
use dotenvy;

// Import necessary items from our modules
use dev_client::{DevApiClient, DevRequestOptions};
use sse_processor::process_dev_bytes_stream_unfold;
use models::OpenAiChatRequest; // Moved struct definition

#[tokio::main]
async fn main() {
    // --- Load .env and .env.local files FIRST ---
    // Load .env file first, ignore errors if it doesn't exist
    if let Err(e) = dotenvy::dotenv() {
        // Use println! here as tracing isn't initialized yet
        if e.not_found() {
            println!("INFO: .env file not found, skipping.");
        } else {
            println!("WARN: Failed to load .env file: {}", e);
        }
    }

    // --- Initialize tracing (logging) AFTER loading env vars ---
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            // Now std::env::var will see variables loaded from .env files
            std::env::var("RUST_LOG").unwrap_or_else(|_| "bootstrap=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();
        
    // Now we can use tracing macros like info!, debug!, etc.
    info!("Tracing initialized.");

    // Ensure WASM is loaded early (optional but good for catching init errors)
    if let Err(e) = wasm_signer::WasmSigner::get_instance() {
        tracing::error!("Fatal: Failed to initialize WASM Signer: {}", e);
        // In a real app, you might panic or exit here
        // return;
    } else {
        tracing::info!("WASM Signer initialized successfully (or already initialized).");
    }

    // Initialize the Dev API client (panics on failure for simplicity here)
    let dev_client = DevApiClient::new().expect("Failed to create DevApiClient");

    // Build our application with routes
    let app = Router::new()
        .route("/api/ping", get(ping_handler))
        .route("/v1/chat/completions", post(chat_completions_handler))
        // Add state for the client
        .with_state(dev_client)
        // Add tracing layer
        .layer(TraceLayer::new_for_http());

    // Vercel runs on a specific port internally
    let port = std::env::var("PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(3000); // Default to 3000 if PORT not set

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!("listening on {}", addr);

    // Run the Axum server
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn ping_handler() -> &'static str {
    info!("Ping handler called");
    "pong"
}

#[axum::debug_handler]
#[instrument(skip(client, req))]
async fn chat_completions_handler(
    axum::extract::State(client): axum::extract::State<DevApiClient>,
    Json(req): Json<OpenAiChatRequest>,
) -> Response {
    info!(?req, "Received chat completions request");

    // Extract content and options from the request
    // For simplicity, concatenate messages or take the last user message
    let content = req.messages.last().map(|m| m.content.clone()).unwrap_or_default();
    if content.is_empty() {
        warn!("Request content is empty");
        return (StatusCode::BAD_REQUEST, "Request messages are empty or missing content").into_response();
    }

    // Create Dev options from OpenAI request
    // TODO: Map more fields if necessary (temperature, top_p etc. are not used by Dev?)
    let dev_options = DevRequestOptions {
        model: req.model, // Pass model name through
        // Default language? Or extract from request?
        language: Some("All".to_string()), // Example default
        ..Default::default()
    };

    // Use a unique ID for the request stream (e.g., UUID)
    let request_id = utils::generate_uuidv4();

    // Call the Dev API client to get the Response
    let dev_response = match client.send_request(&content, dev_options.clone()).await {
        Ok(resp) => resp,
        Err(e) => {
            error!("Failed to send request to Dev API: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to contact backend service: {}", e)).into_response();
        }
    };

    debug!("Dev response: {:?}", dev_response);

    // Check status *after* getting the response object
    if !dev_response.status().is_success() {
        let status = dev_response.status();
        // Try to get body text without consuming response if possible (might not be easy with stream)
        // For simplicity, we might just return a generic error here or try to read body once
        error!("Dev API returned non-success status: {}", status);
        return (StatusCode::INTERNAL_SERVER_ERROR, format!("Backend service returned status: {}", status)).into_response();
    }

    // Get the byte stream from the response
    let byte_stream = dev_response.bytes_stream();

    // Process the Dev byte stream into an OpenAI chunk stream
    let openai_chunk_stream = process_dev_bytes_stream_unfold(byte_stream, dev_options, request_id.clone());

    // Create the SSE response
    let sse_stream = openai_chunk_stream.map(move |chunk_result| {
        match chunk_result {
            Ok(chunk) => {
                // Serialize the chunk to JSON and create an SSE event
                match serde_json::to_string(&chunk) {
                    Ok(json_data) => SseEvent::default().data(json_data),
                    Err(e) => {
                        warn!("Failed to serialize OpenAI chunk: {}", e);
                        // Send an error event (or just close the stream?)
                        SseEvent::default().event("error").data(format!("{{\"error\": \"Serialization failed: {}\"}}", e))
                    }
                }
            }
            Err(e) => {
                error!("Error processing Dev stream chunk: {}", e);
                // Send an error event
                 SseEvent::default().event("error").data(format!("{{\"error\": \"{}\"}}", e))
            }
        }
    });

    // Add a final [DONE] message as per OpenAI spec for streams
    let done_stream = futures_util::stream::once(async { 
         SseEvent::default().data("[DONE]")
     });
    
    // Combine the main stream and the [DONE] message
    // Convert SseEvent into Result<_, Infallible> for Sse::new
    let combined_stream = sse_stream.map(Ok::<_, Infallible>).chain(done_stream.map(Ok::<_, Infallible>));

    info!("Starting SSE stream response...");
    Sse::new(combined_stream)
        .keep_alive(axum::response::sse::KeepAlive::new().interval(Duration::from_secs(15)))
        .into_response()
}