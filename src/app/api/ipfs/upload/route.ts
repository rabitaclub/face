import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import appConfig from '@/config/app.config.json';
import { client } from '@/config/greenfield';
import { Client, DelegatedPubObjectRequest, Long, VisibilityType } from '@bnb-chain/greenfield-js-sdk';
import { createHelia, HeliaLibp2p } from 'helia';
import * as Signer from '@ucanto/principal/ed25519' // Agents on Node should use Ed25519 keys
import { importDAG } from '@ucanto/core/delegation'
import { CarReader } from '@ipld/car'
import * as W3Client from '@web3-storage/w3up-client'
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory'
import { unixfs } from '@helia/unixfs';
import { AnyLink } from '@web3-storage/w3up-client/types';
import { signToEncryptMessage } from '@/utils/signatureUtils';
import { auth } from '@/auth';

export interface UploadResult {
  gatewayUrl: string;
  filename?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

class GreenfieldAdapter {
  private client: Client;
  private sp: {
    operatorAddress: string;
    endpoint: string;
  };
  private bucketName: string;
  private privateKey: string;
  private address: string;

  constructor(client: Client) {
    this.client = client;
    this.bucketName = appConfig.slug + '-bucket';
    this.sp = {
      operatorAddress: '',
      endpoint: ''
    };
    
    const privateKey = process.env.GF_KEY;
    const address = process.env.GF_ADDRESS;
    
    if (!privateKey || !address) {
      throw new Error('Required environment variables GF_KEY and GF_ADDRESS are not set');
    }
    
    this.privateKey = privateKey;
    this.address = address;
  }

  async findAndSetSP() {
    const spList = await client.sp.getStorageProviders();
    const sp = {
      operatorAddress: spList[0].operatorAddress,
      endpoint: spList[0].endpoint,
    };

    this.sp = sp;
  }

  async createIfNotExists() {
    try {
      await client.bucket.headBucket(this.bucketName);
    } catch (error) {
      const createBucketTx = await client.bucket.createBucket(
        {
          bucketName: this.bucketName,
          visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
          primarySpAddress: this.sp.operatorAddress,
          paymentAddress: this.address,
          creator: this.address,
          chargedReadQuota: Long.fromString('0')
        }
      );
      const simulateTxInfo = await createBucketTx.simulate({
        denom: 'BNB',
      });

      const res = await createBucketTx.broadcast({
        denom: 'BNB',
        gasLimit: Number(simulateTxInfo?.gasLimit),
        gasPrice: simulateTxInfo?.gasPrice || '5000000000',
        payer: this.address,
        granter: '',
        privateKey: this.privateKey,
      });
    }
  }

  async uploadFile(file: File, onUpload?: any) {
    const fileBytes = await file.arrayBuffer();

    let createObjectInfo: DelegatedPubObjectRequest = {
      bucketName: this.bucketName,
      objectName: file.name,
      delegatedOpts: {
        visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
      },
      body: {
        name: file.name,
        type: file.type,
        size: file.size,
        content: Buffer.from(fileBytes),
      },
      onProgress: onUpload
    };

    try {
      await client.object.headObject(this.bucketName, file.name);
      const deleteObjectResTx = await client.object.deleteObject(
        {
          bucketName: this.bucketName,
          objectName: file.name,
          operator: this.address,
        }
      );
      const simulateTxInfo = await deleteObjectResTx.simulate({
        denom: 'BNB',
      });
      await deleteObjectResTx.broadcast({
        denom: 'BNB',
        gasLimit: Number(simulateTxInfo?.gasLimit),
        gasPrice: simulateTxInfo?.gasPrice || '5000000000',
        payer: this.address,
        granter: '',
        privateKey: this.privateKey,
      });

    } catch (error) {
    }

    const delegateObjectTx = await client.object.delegateUploadObject(
      createObjectInfo,
      {
        type: 'ECDSA',
        privateKey: this.privateKey,
      }
    );

    return delegateObjectTx;
  }

  async uploadDirectory(files: File[]) {

  }
}

class HeliaAdapter {
  private helia: HeliaLibp2p | null;
  private gatewayUrl: string;

  constructor() {
    this.helia = null;
    this.gatewayUrl = 'https://ipfs.io/ipfs';
  }

  async initialize() {
    this.helia = await createHelia();
  }

  async uploadFile(file: File): Promise<{ cid: string; size: number; type: string }> {
    try {
      if (!this.helia) {
        await this.initialize();
      }

      const fs = unixfs(this.helia!);
      const fileBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(fileBuffer);
      const cid = await fs.addBytes(bytes);

      return {
        cid: cid.toString(),
        size: file.size,
        type: file.type,
      };
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  async getFile(cid: string): Promise<Uint8Array> {
    try {
      if (!this.helia) {
        await this.initialize();
      }

      return new Uint8Array();
    } catch (error) {
      console.error('Error retrieving file from IPFS:', error);
      throw new Error('Failed to retrieve file from IPFS');
    }
  }

  getGatewayUrl(cid: string): string {
    return `${this.gatewayUrl}/${cid}`;
  }
}

class Web3StorageAdapter {
  private client: W3Client.Client;

  constructor(_client: W3Client.Client) {
    this.client = _client;
  }

  async initialize() {
    const proof = await this.parseProof(process.env.W3_PROOF!)
    const space = await this.client.addSpace(proof)
    await this.client.setCurrentSpace(space.did())
  }

  async parseProof (data: string) {
    const blocks = []
    const reader = await CarReader.fromBytes(Buffer.from(data, 'base64'))
    for await (const block of reader.blocks()) {
      blocks.push(block)
    }
    return importDAG(blocks as any)
  }

  async uploadFile(file: File) {
    const cid = await this.client.uploadFile(file)
    return cid
  }

  getGatewayUrl(cid: AnyLink) {
    return `https://${cid}.ipfs.w3s.link`
  }
  
}

async function encryptImageData(url: string): Promise<string> {
  const encryptedData = await signToEncryptMessage(url);
  return encryptedData;
}

async function saveFile(file: File) {
  const fileBytes = await file.arrayBuffer();
  const filePath = `./public/temp/${file.name}`;
  const fs = require('fs');
  if (!fs.existsSync('./public/temp')) {
    fs.mkdirSync('./public/temp', { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, Buffer.from(fileBytes));
  }

  return filePath;
}

export async function POST(request: NextRequest): Promise<Response> {
  const uploadId = uuidv4();
  
  try {
    // Check if user is authenticated
    const session = await auth();
    
    // If no valid session exists, return unauthorized response
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'You must be logged in to upload files',
          uploadId 
        },
        { status: 401 }
      );
    }
    
    if (!session.user.isTwitterVerified) {
      return NextResponse.json(
        { 
          error: 'Permission denied', 
          message: 'X verification required to upload files',
          uploadId 
        },
        { status: 403 }
      );
    }
    
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = validateRateLimit(clientIp, session);
    
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { 
          error: 'Too many upload requests. Please try again later.',
          uploadId,
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetAt: new Date(rateLimitResult.resetAt).toISOString(),
            total: rateLimitResult.total
          }
        },
        { status: 429 }
      );
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', rateLimitResult.total.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetAt.toString());
      
      return response;
    }
    
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { 
          error: 'Invalid request format. Expected multipart/form-data.',
          uploadId 
        },
        { status: 400 }
      );
    }
    
    const formData = await request.formData();
    
    const imageFile = formData.get('image') as File;
    const name = formData.get('name') as string || 'Untitled';
    const description = formData.get('description') as string || '';
    
    if (!imageFile) {
      return NextResponse.json(
        { 
          error: 'No image file provided',
          uploadId 
        },
        { status: 400 }
      );
    }
    
    if (!ACCEPTED_TYPES.includes(imageFile.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type. Supported formats: JPEG, PNG, WebP, GIF',
          uploadId 
        },
        { status: 400 }
      );
    }
    
    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          uploadId 
        },
        { status: 413 }
      );
    }
    
    try {
      const metadataObj = {
        name,
        description,
        image: imageFile.name,
        type: imageFile.type,
        size: imageFile.size,
        created: new Date().toISOString(),
        source: 'Rabita App',
        application: appConfig.name,
        version: appConfig.version,
        // Add user metadata (non-sensitive info only)
        creator: {
          id: session.user.twitterId || 'anonymous',
          username: session.user.twitterUsername || 'anonymous',
          verified: !!session.user.isTwitterVerified
        }
      };

      // Audit log for security tracking (server-side only)
      console.log(`[UPLOAD_AUDIT] User ${session.user.twitterId || 'unknown'} (${session.user.twitterUsername || 'unknown'}) uploaded file: ${imageFile.name}, size: ${imageFile.size}, type: ${imageFile.type}, timestamp: ${new Date().toISOString()}`);

      const metadataJson = JSON.stringify(metadataObj, null, 2);
      const adapter = new GreenfieldAdapter(client);
      
      const result = await adapter.uploadFile(imageFile);
      let gatewayUrl;
      
      if (result.statusCode === 404) {
        const principal = Signer.parse(process.env.W3_KEY!)
        const store = new StoreMemory()
        const client = await W3Client.create({ principal, store })
        const w3Adapter = new Web3StorageAdapter(client);
        await w3Adapter.initialize();

        const result = await w3Adapter.uploadFile(imageFile);
        gatewayUrl = w3Adapter.getGatewayUrl(result);
      } else {
        if (!result.body) {
          throw new Error('Upload failed: No response body');
        }
        gatewayUrl = `${appConfig.url}/api/proxy-image?url=${encodeURIComponent(imageFile.name)}`;
      }

      const encryptedData = await encryptImageData(gatewayUrl);

      const uploadResult: UploadResult = {
        gatewayUrl: encryptedData,
        filename: imageFile.name
      };

      const response = NextResponse.json({
        success: true,
        uploadId,
        ...uploadResult
      });
      
      // Add rate limit headers to successful response
      response.headers.set('X-RateLimit-Limit', rateLimitResult.total.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetAt.toString());
      
      return response;
    } catch (error: any) {
      console.error('Error uploading file:', error);

      return NextResponse.json(
        {
          error: 'Failed to upload file',
          uploadId
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in upload handler:', error);

    return NextResponse.json(
      {
        error: 'Failed to process upload request',
        message: error instanceof Error ? error.message : 'Unknown error',
        uploadId
      },
      { status: 500 }
    );
  }
}

// Rate limiting constants
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const AUTHENTICATED_RATE_LIMIT = 15; // Higher limit for authenticated users
const AUTHENTICATED_RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const rateLimitStore: Map<string, { count: number, timestamp: number }> = new Map();

/**
 * Enhanced rate limiting function that uses user ID for authenticated users
 * and IP address for unauthenticated users
 * @returns Object containing whether the request is rate limited and rate limit information
 */
function validateRateLimit(clientIp: string, session?: any): { 
  allowed: boolean; 
  remaining: number; 
  resetAt: number;
  total: number;
} {
  const now = Date.now();
  
  // Use user ID if authenticated, otherwise use IP address
  const limitKey = session?.user?.twitterId 
    ? `user:${session.user.twitterId}` 
    : `ip:${clientIp}`;
    
  const clientData = rateLimitStore.get(limitKey) || { count: 0, timestamp: now };
  
  // Different rate limits for authenticated vs unauthenticated users
  const rateLimit = session?.user ? AUTHENTICATED_RATE_LIMIT : RATE_LIMIT;
  const rateLimitWindow = session?.user ? AUTHENTICATED_RATE_LIMIT_WINDOW : RATE_LIMIT_WINDOW;

  // Reset counter if outside window
  if (now - clientData.timestamp > rateLimitWindow) {
    rateLimitStore.set(limitKey, { count: 1, timestamp: now });
    return { 
      allowed: true, 
      remaining: rateLimit - 1,
      resetAt: now + rateLimitWindow,
      total: rateLimit
    };
  }

  // Check if rate limit exceeded
  if (clientData.count >= rateLimit) {
    return { 
      allowed: false, 
      remaining: 0,
      resetAt: clientData.timestamp + rateLimitWindow,
      total: rateLimit
    };
  }

  // Increment counter
  const newCount = clientData.count + 1;
  rateLimitStore.set(limitKey, {
    count: newCount,
    timestamp: clientData.timestamp
  });

  return { 
    allowed: true, 
    remaining: rateLimit - newCount,
    resetAt: clientData.timestamp + rateLimitWindow,
    total: rateLimit
  };
} 