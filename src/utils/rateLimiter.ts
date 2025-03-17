/**
 * In-memory rate limiter for API protection
 * Note: For production, consider using Redis or another distributed cache
 */
export class RateLimiter {
  private requestCounts: Map<string, { count: number; timestamp: number }>;
  private maxRequests: number;
  private windowMs: number;

  /**
   * Creates a new rate limiter
   * 
   * @param maxRequests Maximum number of requests allowed in the time window
   * @param windowSeconds Time window in seconds
   */
  constructor(maxRequests: number, windowSeconds: number) {
    this.requestCounts = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1000;

    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Checks if a client is rate limited
   * 
   * @param clientId Client identifier (IP, user ID, etc.)
   * @returns Whether the client is rate limited
   */
  async isRateLimited(clientId: string): Promise<boolean> {
    const now = Date.now();
    const clientData = this.requestCounts.get(clientId);

    // If no previous requests or window expired, not rate limited
    if (!clientData || now - clientData.timestamp > this.windowMs) {
      return false;
    }

    // Rate limited if count exceeds max requests
    return clientData.count >= this.maxRequests;
  }

  /**
   * Increments the request counter for a client
   * 
   * @param clientId Client identifier (IP, user ID, etc.)
   */
  async incrementCounter(clientId: string): Promise<void> {
    const now = Date.now();
    const clientData = this.requestCounts.get(clientId);

    if (!clientData || now - clientData.timestamp > this.windowMs) {
      // Reset counter if no previous requests or window expired
      this.requestCounts.set(clientId, { count: 1, timestamp: now });
    } else {
      // Increment counter if within window
      this.requestCounts.set(clientId, {
        count: clientData.count + 1,
        timestamp: clientData.timestamp
      });
    }
  }

  /**
   * Cleans up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [clientId, data] of this.requestCounts.entries()) {
      if (now - data.timestamp > this.windowMs) {
        this.requestCounts.delete(clientId);
      }
    }
  }
} 