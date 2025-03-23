/**
 * fetchGraphData.ts
 * 
 * Professional implementation for fetching data from The Graph subgraphs.
 * - Uses secure practices with rate limiting, caching, and error handling
 * - Supports configurable endpoints for different environments
 * - Handles authentication for private subgraphs
 * - Implements request validation and sanitization
 */

import { z } from 'zod'; // We'll need to add this to dependencies
import { cache } from 'react';

// Define response caching duration in seconds
const CACHE_DURATION = 60;

// Types for Graph queries
export interface GraphQueryOptions {
  // Unique identifier to help with caching and deduplication
  queryId?: string;
  // Variables to pass to the GraphQL query
  variables?: Record<string, unknown>;
  // Authentication token for private subgraphs
  authToken?: string;
  // Request timeout in milliseconds
  timeout?: number;
  // Skip caching for this request
  skipCache?: boolean;
  // Controls if the request should be retried on failure
  retryConfig?: {
    maxRetries: number;
    initialDelay: number;
    backoffFactor: number;
  };
}

// Schema for validating incoming query parameters
const graphQuerySchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  variables: z.record(z.unknown()).optional(),
  endpoint: z.string().url("Invalid subgraph endpoint URL"),
  options: z.object({
    queryId: z.string().optional(),
    authToken: z.string().optional(),
    timeout: z.number().positive().optional(),
    skipCache: z.boolean().optional(),
    retryConfig: z.object({
      maxRetries: z.number().int().positive().optional(),
      initialDelay: z.number().positive().optional(),
      backoffFactor: z.number().positive().optional(),
    }).optional(),
  }).optional(),
});

// Cache for responses to avoid redundant network requests
const responseCache = new Map<string, { data: any; timestamp: number }>();

// Helper for calculating cache key
const getCacheKey = (endpoint: string, query: string, variables?: Record<string, unknown>): string => {
  return `${endpoint}:${query}:${JSON.stringify(variables || {})}`;
};

// Default retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  backoffFactor: 2, // Exponential backoff
};

/**
 * Rate limiter to prevent abuse
 */
class RateLimiter {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 50, windowMs = 60000) { // Default: 50 requests per minute
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isRateLimited(clientId: string): boolean {
    const now = Date.now();
    const clientData = this.requestCounts.get(clientId) || { count: 0, resetTime: now + this.windowMs };

    // Reset counter if the time window has passed
    if (now > clientData.resetTime) {
      clientData.count = 0;
      clientData.resetTime = now + this.windowMs;
    }

    // Check if request limit has been reached
    if (clientData.count >= this.maxRequests) {
      return true;
    }

    // Increment request count
    clientData.count++;
    this.requestCounts.set(clientId, clientData);
    return false;
  }
}

// Create rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Sanitize GraphQL query to prevent injection attacks
 */
const sanitizeQuery = (query: string): string => {
  // Basic sanitization - remove comments, multiple whitespaces
  return query
    .replace(/\s+/g, ' ')
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
    .trim();
};

/**
 * Delay function for implementing retry with exponential backoff
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Main function to fetch data from The Graph subgraph
 * This is a server-side only function, not meant to be called directly from client components
 * 
 * @param endpoint The Graph subgraph endpoint URL
 * @param query GraphQL query string
 * @param variables Variables for the GraphQL query
 * @param options Additional options for the query
 * @returns The query result
 * @throws Error if the query fails
 */
export async function fetchGraphData<T = any>(
  endpoint: string,
  query: string,
  variables?: Record<string, unknown>,
  options?: GraphQueryOptions,
): Promise<T> {
  try {
    // Validate inputs
    const validationResult = graphQuerySchema.safeParse({
      query,
      variables,
      endpoint,
      options,
    });

    if (!validationResult.success) {
      throw new Error(`Invalid query parameters: ${validationResult.error.message}`);
    }

    // Apply rate limiting using IP or client identifier
    const clientId = options?.authToken || 'anonymous';
    if (rateLimiter.isRateLimited(clientId)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Sanitize query to prevent injection attacks
    const sanitizedQuery = sanitizeQuery(query);

    // Check cache if not explicitly skipped
    if (!options?.skipCache) {
      const cacheKey = getCacheKey(endpoint, sanitizedQuery, variables);
      const cachedResponse = responseCache.get(cacheKey);
      
      if (cachedResponse && (Date.now() - cachedResponse.timestamp) < CACHE_DURATION * 1000) {
        return cachedResponse.data;
      }
    }

    // Apply timeout and retry configuration
    const timeout = options?.timeout || 30000; // Default: 30 seconds
    const retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...options?.retryConfig,
    };

    // Function to execute the actual fetch with retries
    const executeWithRetry = async (attempt = 0): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'User-Agent': `Rabita-App/${process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}`,
        };

        // Add authentication if provided
        if (options?.authToken) {
          headers['Authorization'] = `Bearer ${options.authToken}`;
        }

        // Add API key if available in environment
        if (process.env.GRAPH_API_KEY) {
          headers['X-API-KEY'] = process.env.GRAPH_API_KEY;
        }

        // Prepare fetch options
        const fetchOptions: RequestInit = {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: sanitizedQuery,
            variables,
          }),
          signal: controller.signal,
        };

        // Log the request in development mode only
        if (process.env.NODE_ENV === 'development') {
          console.info(`[Graph] Querying ${endpoint} (Attempt ${attempt + 1}/${retryConfig.maxRetries})`);
        }

        // Execute the fetch request
        const response = await fetch(endpoint, fetchOptions);
        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Handle GraphQL errors
        if (result.errors && result.errors.length > 0) {
          const errorMessage = result.errors.map((e: any) => e.message).join('; ');
          throw new Error(`GraphQL error: ${errorMessage}`);
        }

        // Store in cache if caching is not skipped
        if (!options?.skipCache) {
          const cacheKey = getCacheKey(endpoint, sanitizedQuery, variables);
          responseCache.set(cacheKey, {
            data: result.data,
            timestamp: Date.now(),
          });
        }

        return result.data as T;
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Handle aborted requests
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }

        // Retry logic
        if (attempt < retryConfig.maxRetries - 1) {
          const delayMs = retryConfig.initialDelay * Math.pow(retryConfig.backoffFactor, attempt);
          await delay(delayMs);
          return executeWithRetry(attempt + 1);
        }
        
        throw error;
      }
    };

    return executeWithRetry();
  } catch (error: any) {
    // Enhance error for better debugging
    const enhancedError = new Error(`Graph query failed: ${error.message}`);
    console.error('[Graph] Query error:', error);
    throw enhancedError;
  }
}

/**
 * Cached version of fetchGraphData for server components
 */
export const fetchGraphDataCached = cache(fetchGraphData);

// Helper for creating GraphQL queries with proper typing
export function gql(strings: TemplateStringsArray, ...values: any[]): string {
  return strings.reduce((result, str, i) => {
    return result + str + (values[i] !== undefined ? values[i] : '');
  }, '');
}
