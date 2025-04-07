import { NextResponse } from 'next/server';
// import { Ratelimit } from '@upstash/ratelimit';
// import { Redis } from '@upstash/redis';

// --- Configuration ---
// Read allowed tokens from environment variable (comma-separated)
const ALLOWED_BEARER_TOKENS = new Set(
    (process.env.ALLOWED_API_KEYS || '').split(',').filter(Boolean)
);
// const RATE_LIMIT_WINDOW = '60 s'; // Rate limit window (e.g., 60 seconds)
// const RATE_LIMIT_MAX_REQUESTS = 30; // Max requests per window per identifier

// --- Initialize Upstash Redis and Ratelimit ---
// let redis = null;
let ratelimit = null;
// let redisInitializationError = null; // Original variable

// --- TEMPORARY BYPASS FOR TESTING --- START
const bypassRateLimitForTesting = true; // Set to false to re-enable
let redisInitializationError = bypassRateLimitForTesting
    ? new Error('Rate limiting intentionally bypassed for testing.')
    : null;
if (bypassRateLimitForTesting) {
    console.warn('Middleware: Upstash Redis/Ratelimit initialization skipped for testing.');
} else {
    // Original initialization logic (keep commented out or enable by setting bypassRateLimitForTesting to false)
    /*
  try {
      // Ensure environment variables are present
      if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
          throw new Error('Upstash Redis URL or Token is not configured in environment variables.');
      }
      redis = Redis.fromEnv();
      ratelimit = new Ratelimit({
          redis: redis,
          limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW),
          analytics: true, // Optional: enable Upstash analytics
          prefix: 'dev_proxy_ratelimit', // Namespace in Redis
      });
       console.info('Upstash Redis Ratelimiter initialized successfully.');
  } catch (e) {
      redisInitializationError = e;
      console.error("CRITICAL: Failed to initialize Upstash Redis/Ratelimit:", e);
      // Depending on policy, middleware might block all requests or bypass rate limiting
  }
    */
}
// --- TEMPORARY BYPASS FOR TESTING --- END

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // --- Path Filtering --- Apply middleware only to relevant API paths
    // Adjust this matcher as needed
    if (!pathname.startsWith('/api/openai/') && !pathname.startsWith('/api/models')) {
        return NextResponse.next(); // Skip middleware for other paths
    }
    console.info(`Middleware triggered for path: ${pathname}`);

    // --- Authentication --- Check for Bearer token
    const authHeader = request.headers.get('authorization');
    let authToken = null;

    if (authHeader?.startsWith('Bearer ')) {
        authToken = authHeader.substring(7);
    }

    if (!authToken || authToken.length === 0) {
        console.warn('Middleware: Missing Bearer token.');
        return new NextResponse(JSON.stringify({ error: 'Missing authorization token' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!ALLOWED_BEARER_TOKENS.has(authToken)) {
        // Obfuscate the token in logs for security
        const obfuscatedToken = authToken.length > 6 ? `${authToken.substring(0, 3)}...${authToken.substring(authToken.length - 3)}` : '***';
        console.warn(`Middleware: Invalid Bearer token provided: ${obfuscatedToken}`);
        return new NextResponse(JSON.stringify({ error: 'Invalid authorization token' }), {
            status: 403, // Use 403 Forbidden for invalid credentials
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.info(`Middleware: Authentication successful for token starting with ${authToken.substring(0, 3)}...`);

    // --- Rate Limiting --- Use Upstash Ratelimit
    if (redisInitializationError) {
        // console.error("Rate limiting bypassed due to Redis initialization failure.");
        console.warn(`Rate limiting bypassed: ${redisInitializationError.message}`); // Updated log message
        // FAIL OPEN: Allow request but log the error/reason.
        return NextResponse.next();
        // FAIL CLOSED Example:
        // return new NextResponse(JSON.stringify({ error: 'Internal Server Error: Rate limiter unavailable' }), {
        //     status: 500,
        //     headers: { 'Content-Type': 'application/json' }
        // });
    }

    if (!ratelimit) {
        // This case should ideally not happen if initialization logic is correct
        console.error("CRITICAL: Ratelimiter object is null after initialization attempt.");
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error: Rate limiter configuration issue' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Use the authenticated token as the unique identifier for rate limiting
    const identifier = authToken;
    try {
        const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

        // Add rate limit headers to the response regardless of success/failure
        const responseHeaders = {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset) // Timestamp in ms when the limit resets
        };

        if (!success) {
            const obfuscatedToken = identifier.length > 6 ? `${identifier.substring(0, 3)}...${identifier.substring(identifier.length - 3)}` : '***';
            console.warn(`Middleware: Rate limit exceeded for token: ${obfuscatedToken}`);
            const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
            responseHeaders['Retry-After'] = String(retryAfterSeconds > 0 ? retryAfterSeconds : 1); // Ensure positive value
            responseHeaders['Content-Type'] = 'application/json';

            return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
                status: 429,
                headers: responseHeaders
            });
        }

        // If successful, pass the request to the next handler and add rate limit headers
        console.info(`Middleware: Rate limit check passed for token ${identifier.substring(0, 3)}... (${remaining}/${limit} remaining)`);
        const response = NextResponse.next();
        // Add headers to the outgoing response
        Object.entries(responseHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;

    } catch (error) {
        console.error("Error during Upstash rate limiting check:", error);
        // FAIL OPEN on unexpected errors during rate limit check
        // Consider failing closed depending on security requirements.
        return NextResponse.next();
    }
}

// Configure which paths the middleware runs on
export const config = {
    // Matcher applies to API routes under /api/openai/ and /api/models/
    matcher: ['/api/openai/:path*', '/api/v1/chat/completions/:path*'],
    // Note: Middleware currently runs for *all* requests matching the path,
    // including OPTIONS preflight requests. Add checks for request.method if needed.
}; 