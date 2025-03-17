import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../auth/[...nextauth]/route';
import { generateProfileSignature } from '@/utils/signatureUtils';
import { ethers } from 'ethers';
import { RateLimiter } from '@/utils/rateLimiter';

interface VerifyRequestBody {
  walletAddress: string;
}

// Initialize rate limiter - 5 requests per IP per minute
const rateLimiter = new RateLimiter(5, 60);

/**
 * API endpoint to generate cryptographic verification of Twitter profile linked to a wallet
 * Includes rate limiting, input validation, and CSRF protection
 */
export async function POST(request: NextRequest) {
  try {
    // Use request.headers directly instead of the headers() API
    // This avoids the async issue with headers() in Next.js App Router
    const originHeader = request.headers.get('origin');
    const refererHeader = request.headers.get('referer');
    const hostHeader = request.headers.get('host');
    
    // Determine allowed origins based on environment
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const hostOrigin = hostHeader ? `https://${hostHeader}` : undefined;
    
    const allowedOrigins = [
      nextAuthUrl,
      hostOrigin,
      appUrl
    ].filter(Boolean) as string[];
    
    // Validate origin for CSRF protection
    if (originHeader && !allowedOrigins.includes(originHeader)) {
      console.warn(`Invalid origin: ${originHeader}`);
      return NextResponse.json(
        { error: 'Unauthorized request origin' }, 
        { status: 403 }
      );
    }
    
    // Validate referer for additional security
    if (refererHeader) {
      const isAllowedReferer = allowedOrigins.some(org => org && refererHeader.startsWith(org));
      if (!isAllowedReferer) {
        console.warn(`Invalid referer: ${refererHeader}`);
        return NextResponse.json(
          { error: 'Unauthorized request referer' }, 
          { status: 403 }
        );
      }
    }
    
    // Apply rate limiting using IP address
    // Get client IP safely from headers or request
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor || realIp || 'unknown';
    
    const isRateLimited = await rateLimiter.isRateLimited(clientIp);
    
    if (isRateLimited) {
      return NextResponse.json(
        { error: 'Too many requests, please try again later' }, 
        { status: 429 }
      );
    }
    
    // Get the user's session using the auth function
    const session = await auth();
    
    // Verify the user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Check if Twitter is verified in the session
    if (!session.user.isTwitterVerified || !session.user.twitterId || !session.user.twitterUsername) {
      return NextResponse.json({ error: 'Twitter account not verified' }, { status: 400 });
    }

    // Get wallet address from request body
    const body = await request.json() as VerifyRequestBody;
    const { walletAddress } = body;

    // Validate wallet address
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }
    
    if (!ethers.utils.isAddress(walletAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
    }

    // Generate the Ethereum signature
    const signatureData = await generateProfileSignature(
      session.user.twitterId,
      session.user.twitterUsername,
      walletAddress
    );

    // Parse the JSON to get the individual components
    const parsedData = JSON.parse(signatureData);

    // Record this successful API call with the rate limiter
    await rateLimiter.incrementCounter(clientIp);

    // Return the signature data with security headers
    return NextResponse.json(parsedData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });
  } catch (error) {
    console.error('Error generating profile verification:', error);
    return NextResponse.json(
      { error: 'Failed to verify profile' }, 
      { status: 500 }
    );
  }
} 