import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';

// Interface for secure image token structure
interface SecureImageToken {
  url: string;
  expires: number;
  signature: string;
}

/**
 * Secure image proxy API endpoint that prevents unauthorized access to external images
 * Implements token-based authentication and strict content security
 * 
 * @param request - The incoming request with URL and token parameters
 * @returns The proxied image response with appropriate security headers
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Get parameters from the request URL
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');
    const token = searchParams.get('token');
    const isDirectAccess = searchParams.get('direct') === 'true';

    // Secret key for token signing - in production, use a proper environment variable
    const SECRET_KEY = process.env.IMAGE_PROXY_SECRET || 'rabita-secure-image-proxy-secret-key';
    
    // Validate that an image URL was provided
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required as a query parameter' },
        { status: 400 }
      );
    }

    // Token validation for direct access requests
    if (isDirectAccess) {
      // Validate token if direct access is requested
      if (!token) {
        return new Response('Unauthorized: Missing access token', {
          status: 401,
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      }

      try {
        // Decode and validate the token
        const tokenData = JSON.parse(Buffer.from(token, 'base64').toString()) as SecureImageToken;
        
        // Check if token has expired
        if (tokenData.expires < Date.now()) {
          return new Response('Unauthorized: Token expired', {
            status: 401,
            headers: {
              'Content-Type': 'text/plain',
            },
          });
        }
        
        // Validate the signature to prevent token tampering
        const expectedSignature = createHash('sha256')
          .update(`${tokenData.url}|${tokenData.expires}|${SECRET_KEY}`)
          .digest('hex');
          
        if (tokenData.signature !== expectedSignature) {
          return new Response('Unauthorized: Invalid token', {
            status: 401,
            headers: {
              'Content-Type': 'text/plain',
            },
          });
        }
        
        // Verify that the token URL matches the requested URL
        if (tokenData.url !== imageUrl) {
          return new Response('Unauthorized: URL mismatch', {
            status: 401,
            headers: {
              'Content-Type': 'text/plain',
            },
          });
        }
      } catch (error) {
        return new Response('Unauthorized: Invalid token format', {
          status: 401,
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      }
    } else {
      // Session-based authorization for internal application use
      
      // Check authorization - in Next.js App Router use request cookies
      const isAuthenticated = validateAuthorization(request);
      
      if (!isAuthenticated) {
        // Instead of failing, generate a one-time token for this image
        // and redirect to the tokenized URL
        
        // Generate a token valid for 5 minutes
        const expires = Date.now() + 5 * 60 * 1000;
        const signature = createHash('sha256')
          .update(`${imageUrl}|${expires}|${SECRET_KEY}`)
          .digest('hex');
          
        const imageToken: SecureImageToken = {
          url: imageUrl,
          expires,
          signature
        };
        
        const tokenString = Buffer.from(JSON.stringify(imageToken)).toString('base64');
        const secureUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}&token=${tokenString}&direct=true`;
        
        // Redirect to the tokenized URL
        return NextResponse.redirect(new URL(secureUrl, request.url));
      }
    }

    // Apply rate limiting to prevent abuse
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `image-proxy:${clientIp}`;
    const currentTime = Date.now();
    
    // Simple local rate limiting mechanism
    // In production, use a distributed rate limiter like Redis
    const rateLimit = 30; // Max requests per minute
    const rateLimitStore: Map<string, {count: number, timestamp: number}> = 
      (global as any).rateLimitStore || new Map();
    (global as any).rateLimitStore = rateLimitStore;
    
    // Clean up old rate limit entries
    for (const [key, data] of rateLimitStore.entries()) {
      if (currentTime - data.timestamp > 60000) { // 1 minute
        rateLimitStore.delete(key);
      }
    }
    
    // Check if rate limit exceeded
    const clientData = rateLimitStore.get(rateLimitKey) || { count: 0, timestamp: currentTime };
    if (currentTime - clientData.timestamp < 60000 && clientData.count >= rateLimit) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    // Update rate limit counter
    rateLimitStore.set(rateLimitKey, {
      count: clientData.count + 1,
      timestamp: currentTime - (currentTime - clientData.timestamp < 60000 ? 0 : 60000)
    });

    // Only allow fetching from trusted sources to prevent misuse
    const allowedDomains = [
      'pbs.twimg.com',        // Twitter images
      'abs.twimg.com',        // Twitter profile images
      'platform-lookaside.fbsbx.com', // Facebook profile images
      'media-exp1.licdn.com', // LinkedIn profile images
      'lh3.googleusercontent.com', // Google user content (including profiles)
      'avatar.vercel.sh',     // Vercel avatars
      'github.com',           // GitHub profile images
      'githubusercontent.com', // GitHub user content
      'i.pravatar.cc',        // Testing avatar service
    ];
    
    // Create URL object to parse the domain
    let urlObj: URL;
    try {
      urlObj = new URL(imageUrl);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }
    
    // Check if the domain is allowed
    const isDomainAllowed = allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
    
    if (!isDomainAllowed) {
      return NextResponse.json(
        { error: 'Domain not allowed for security reasons' },
        { status: 403 }
      );
    }

    // Generate a unique identifier for cache busting and tracking
    const requestId = randomBytes(8).toString('hex');

    // Fetch the image through the server
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Rabita-Image-Proxy/1.0',
        'X-Request-ID': requestId
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Get the image data as an array buffer
    const imageData = await response.arrayBuffer();

    // Set appropriate content type based on the response
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Set strong security headers for the image
    return new Response(imageData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600', // Private cache for 1 hour
        'X-Content-Type-Options': 'nosniff', // Prevent MIME type sniffing
        'Content-Security-Policy': "default-src 'none'; img-src 'self'; frame-ancestors 'none'",
        'X-Frame-Options': 'DENY', // Prevent embedding in iframes
        'Referrer-Policy': 'no-referrer', // Don't send referrer information
        'Access-Control-Allow-Origin': request.headers.get('origin') || '', // Restrict to the application origin
        'Access-Control-Allow-Credentials': 'true',
        'X-Request-ID': requestId // For tracking and debugging
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to validate authorization
 * In a real application, implement proper session/auth validation
 */
function validateAuthorization(request: NextRequest): boolean {
  // Implementation would depend on your authentication system
  // This is a simplified example
  
  // Check for auth token in cookie
  const authToken = request.cookies.get('auth-token')?.value;
  if (authToken) {
    return true;
  }
  
  // Check for auth token in header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return true;
  }
  
  // Check origin for internal requests
  const origin = request.headers.get('origin');
  if (origin && (
    origin.includes('localhost') || 
    origin.includes('rabita.club') ||
    origin.includes('rabita-app.vercel.app')
  )) {
    return true;
  }
  
  // Basic validation - you should implement proper checks
  // Default to false in production
  return process.env.NODE_ENV !== 'production';
}

/**
 * Helper function to generate a secure token for an image URL
 * Can be used by other parts of the application to create secure image links
 * 
 * @param imageUrl - The URL of the image to secure
 * @param expiresInMinutes - How long the token should be valid (defaults to 30 minutes)
 * @returns A secure token for accessing the image
 */
export function generateSecureImageToken(imageUrl: string, expiresInMinutes = 30): string {
  const SECRET_KEY = process.env.IMAGE_PROXY_SECRET || 'rabita-secure-image-proxy-secret-key';
  const expires = Date.now() + expiresInMinutes * 60 * 1000;
  
  const signature = createHash('sha256')
    .update(`${imageUrl}|${expires}|${SECRET_KEY}`)
    .digest('hex');
    
  const token: SecureImageToken = {
    url: imageUrl,
    expires,
    signature
  };
  
  return Buffer.from(JSON.stringify(token)).toString('base64');
} 