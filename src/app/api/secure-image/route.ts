import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/utils/rateLimiter';
import { signToDecryptMessage } from '@/utils/signatureUtils';

const rateLimiter = new RateLimiter(100, 60);

async function decryptImageData(encryptedData: string): Promise<string> {
  const decryptedData = await signToDecryptMessage(encryptedData);
  return decryptedData;
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
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

    const searchParams = request.nextUrl.searchParams;
    const encryptedData = searchParams.get('data');

    if (!encryptedData) {
      return NextResponse.json(
        { error: 'Missing encrypted data parameter' },
        { status: 400 }
      );
    }

    const imageUrl = await decryptImageData(encryptedData);
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Invalid or expired image data' },
        { status: 400 }
      );
    }

    try {
      const imageResponse = await fetch(imageUrl);
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      await rateLimiter.incrementCounter(clientIp);
      
      return new Response(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': "default-src 'self'",
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      });
    } catch (fetchError) {
      console.error('Error fetching image:', fetchError);
      return NextResponse.json(
        { error: 'Failed to retrieve image' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error processing secure image request:', error);
    return NextResponse.json(
      { error: 'Failed to process secure image request' },
      { status: 500 }
    );
  }
}