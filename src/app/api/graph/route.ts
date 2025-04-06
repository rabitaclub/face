/**
 * /api/graph API endpoint
 * 
 * Provides a secure server-side interface for querying The Graph subgraphs.
 * This endpoint acts as a proxy, protecting API keys and applying rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchGraphData } from '@/lib/fetchGraphData';
import { z } from 'zod';

// Schema for validating incoming requests
const requestSchema = z.object({
  query: z.string().min(1, "GraphQL query is required"),
  variables: z.record(z.unknown()).optional(),
});

// Track recent requests for basic rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3600; // 360 requests per minute

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitTracker = new Map<string, RateLimitEntry>();

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimitTracker() {
  const now = Date.now();
  for (const [ip, entry] of rateLimitTracker.entries()) {
    if (entry.resetAt < now) {
      rateLimitTracker.delete(ip);
    }
  }
}

/**
 * Check if request is rate limited
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  cleanupRateLimitTracker();

  let entry = rateLimitTracker.get(ip);
  
  if (!entry) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    rateLimitTracker.set(ip, entry);
  } else if (entry.resetAt < now) {
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  entry.count++;
  return false;
}

/**
 * Extract client IP from request
 */
function getClientIp(req: NextRequest): string {
  // Try to get IP from standard headers
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // Only use the first IP if multiple are provided
    return forwarded.split(',')[0].trim();
  }

  // Fallback to other headers
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Use remote address as last resort
  const ip = req.headers.get('remote-addr');
  return ip || 'unknown';
}

/**
 * Verify request authorization
 * You can implement more robust auth validation here
 */
function isAuthorizedRequest(req: NextRequest): boolean {
  // Check for valid session cookie or token
  // For example: const session = await getServerSession(authOptions);
  
  // For now, implement basic API key check in header
  const apiKey = req.headers.get('x-api-key');
  
  // In development, we might skip auth
  if (process.env.NODE_ENV === 'development' && !process.env.REQUIRE_API_AUTH) {
    return true;
  }
  
  // Check against configured API keys (in a real app, use a more secure comparison)
  const validApiKeys = process.env.ALLOWED_API_KEYS?.split(',') || [];
  return apiKey ? validApiKeys.includes(apiKey) : false;
}

/**
 * POST handler for /api/graph
 */
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' }, 
        { status: 429 }
      );
    }

    // Verify authorization
    // if (!isAuthorizedRequest(req)) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized request' }, 
    //     { status: 401 }
    //   );
    // }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.format() }, 
        { status: 400 }
      );
    }

    const { query, variables } = validationResult.data;

    // Use the configured server-side endpoint - never expose this to client
    const targetEndpoint = process.env.REGISTRY_GRAPH_URL;

    if (!targetEndpoint) {
      return NextResponse.json(
        { error: 'Graph endpoint not configured on server' }, 
        { status: 500 }
      );
    }

    // Execute the Graph query with server-side subgraph URL
    const result = await fetchGraphData(
      targetEndpoint,
      query,
      variables,
      {
        // Set appropriate timeout for server-side requests
        timeout: 10000, // 10 seconds
        // Use server-side API key if available
        authToken: process.env.GRAPH_API_KEY,
      }
    );

    // Return the result
    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('[API] Graph query error:', error);
    
    return NextResponse.json(
      { error: 'Failed to execute graph query', message: error.message }, 
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
} 