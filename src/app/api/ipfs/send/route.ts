import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import appConfig from '@/config/app.config.json';
import { client } from '@/config/greenfield';
import { Client, DelegatedPubObjectRequest, Long, VisibilityType } from '@bnb-chain/greenfield-js-sdk';
import * as Signer from '@ucanto/principal/ed25519'
import { importDAG } from '@ucanto/core/delegation'
import { CarReader } from '@ipld/car'
import * as W3Client from '@web3-storage/w3up-client'
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory'
import { signToEncryptMessage } from '@/utils/signatureUtils';
import { encryptMessage } from '@/utils/encryption';
import fs from 'fs';
import { getDownloadUrl, head, put } from "@vercel/blob";
export interface MessagePayload {
  content: string;
  userContent: string;
  timestamp: string;
  messageId: string;
  metadata?: {
    sender?: string;
    tags?: string[];
    [key: string]: any;
  };
}

export interface SendResult {
  messageId: string;
  gatewayUrl: string | undefined;
  timestamp: string;
}

const MAX_MESSAGE_SIZE = 4330; // 2000 characters in encrypted form
const RATE_LIMIT = 10; // messages per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const rateLimitStore: Map<string, { count: number; timestamp: number }> = new Map();
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
    this.bucketName = appConfig.slug + '-messages';
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
    const spList = await this.client.sp.getStorageProviders();
    const sp = {
      operatorAddress: spList[0].operatorAddress,
      endpoint: spList[0].endpoint,
    };

    this.sp = sp;
  }

  async createIfNotExists() {
    try {
      await this.client.bucket.headBucket(this.bucketName);
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

  async uploadMessage(message: MessagePayload): Promise<SendResult> {
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const messageData = {
      ...message,
      messageId,
      timestamp,
    };

    const messageBuffer = Buffer.from(JSON.stringify(messageData));
    const messageBlob = new Blob([messageBuffer], { type: 'application/json' });
    const messageFile = new File([messageBlob], `${messageId}.json`, { type: 'application/json' });

    let createObjectInfo: DelegatedPubObjectRequest = {
      bucketName: this.bucketName,
      objectName: `${messageId}.json`,
      delegatedOpts: {
        visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
      },
      body: {
        name: `${messageId}.json`,
        type: 'application/json',
        size: messageFile.size,
        content: messageBuffer,
      },
    };

    try {
      const delegateObjectTx = await this.client.object.delegateUploadObject(
        createObjectInfo,
        {
          type: 'ECDSA',
          privateKey: this.privateKey,
        }
      );

      return {
        messageId,
        gatewayUrl: `${appConfig.url}/api/proxy-message?url=${encodeURIComponent(`${messageId}.json`)}`,
        timestamp,
      };
    } catch (error) {
      console.error('Error uploading message to Greenfield:', error);
      throw error;
    }
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

  async parseProof(data: string) {
    const blocks = []
    const reader = await CarReader.fromBytes(Buffer.from(data, 'base64'))
    for await (const block of reader.blocks()) {
      blocks.push(block)
    }
    return importDAG(blocks as any)
  }

  async uploadMessage(message: MessagePayload): Promise<SendResult> {
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const messageData = {
      ...message,
      messageId,
      timestamp,
    };

    const messageBuffer = Buffer.from(JSON.stringify(messageData));
    const messageBlob = new Blob([messageBuffer], { type: 'application/json' });
    const messageFile = new File([messageBlob], `${messageId}.json`, { type: 'application/json' });

    const cid = await this.client.uploadFile(messageFile);
    
    return {
      messageId,
      gatewayUrl: `https://${cid}.ipfs.w3s.link`,
      timestamp,
    };
  }
}

class LocalStorageAdapter {
  async storeAndSave(messageId: string, message: MessagePayload) {
    const timestamp = new Date().toISOString();

    const messageData = {
      ...message,
      messageId,
      timestamp,
    };

    let gatewayUrl: string | undefined;
    try {
      let date = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
      let { url } = await put(`messages/${date}/${messageId}.json`, JSON.stringify(messageData), {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN!,
        contentType: 'application/json'
      });
      gatewayUrl = url;
    } catch (error) {
      let downloadUrl = await head(`messages/${messageId}.json`);
      gatewayUrl = downloadUrl.url;
    }

    // console.log(gatewayUrl)

    return {
      messageId,
      gatewayUrl: gatewayUrl,
      timestamp,
    };
  }
}

function validateRateLimit(clientIp: string): { 
  allowed: boolean; 
  remaining: number; 
  resetAt: number;
  total: number;
} {
  const now = Date.now();
  const limitKey = `ip:${clientIp}`;
  const clientData = rateLimitStore.get(limitKey) || { count: 0, timestamp: now };

  if (now - clientData.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(limitKey, { count: 1, timestamp: now });
    return { 
      allowed: true, 
      remaining: RATE_LIMIT - 1,
      resetAt: now + RATE_LIMIT_WINDOW,
      total: RATE_LIMIT
    };
  }

  if (clientData.count >= RATE_LIMIT) {
    return { 
      allowed: false, 
      remaining: 0,
      resetAt: clientData.timestamp + RATE_LIMIT_WINDOW,
      total: RATE_LIMIT
    };
  }

  const newCount = clientData.count + 1;
  rateLimitStore.set(limitKey, {
    count: newCount,
    timestamp: clientData.timestamp
  });

  return { 
    allowed: true, 
    remaining: RATE_LIMIT - newCount,
    resetAt: clientData.timestamp + RATE_LIMIT_WINDOW,
    total: RATE_LIMIT
  };
}

export async function POST(request: NextRequest): Promise<Response> {
  // Initialize with a random UUID, will be replaced with a deterministic one if we have a message hash
  let messageId: string = uuidv4();
  
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = validateRateLimit(clientIp);
    
    if (!rateLimitResult.allowed) {
      // For rate limit errors, we'll keep the random messageId
      const response = NextResponse.json(
        { 
          error: 'Too many message requests. Please try again later.',
          messageId,
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetAt: new Date(rateLimitResult.resetAt).toISOString(),
            total: rateLimitResult.total
          }
        },
        { status: 429 }
      );
      
      response.headers.set('X-RateLimit-Limit', rateLimitResult.total.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetAt.toString());
      
      return response;
    }

    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // For invalid content type, we'll keep the random messageId
      return NextResponse.json(
        { 
          error: 'Invalid request format. Expected application/json.',
          messageId 
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    if (!body.content || typeof body.content !== 'string') {
      // For invalid content, we'll keep the random messageId
      return NextResponse.json(
        { 
          error: 'Message content is required and must be a string',
          messageId 
        },
        { status: 400 }
      );
    }
    
    const messageSize = new TextEncoder().encode(body.content).length;
    if (messageSize > MAX_MESSAGE_SIZE) {
      // For oversized messages, we'll keep the random messageId
      return NextResponse.json(
        { 
          error: `Message size must not exceed 2000 characters!`,
          messageId 
        },
        { status: 413 }
      );
    }
    
    messageId = body.messageHash;

    const messagePayload: MessagePayload = {
      userContent: body.userContent,
      content: body.content,
      timestamp: new Date().toISOString(),
      messageId: body.messageHash,
      metadata: body.metadata || {}
    };

    try {
      // const adapter = new GreenfieldAdapter(client);
      // await adapter.findAndSetSP();
      // await adapter.createIfNotExists();
      
      let result: SendResult;
      
      // try {
      //   result = await adapter.uploadMessage(messagePayload);
      // } catch (error) {
      //   console.warn('Greenfield upload failed, falling back to Web3.Storage:', error);
        
      // const principal = Signer.parse(process.env.W3_KEY!)
      // const store = new StoreMemory()
      // const client = await W3Client.create({ principal, store })
      // const w3Adapter = new Web3StorageAdapter(client);
      // await w3Adapter.initialize();
      
      // result = await w3Adapter.uploadMessage(messagePayload);
      // }

      const adapter = new LocalStorageAdapter();
      result = await adapter.storeAndSave(messageId, messagePayload);

      const encryptedData = result.gatewayUrl;

      const response = NextResponse.json({
        success: true,
        messageId: result.messageId,
        gatewayUrl: encryptedData,
        timestamp: result.timestamp
      });
      
      response.headers.set('X-RateLimit-Limit', rateLimitResult.total.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetAt.toString());
      
      return response;
    } catch (error: any) {
      console.error('Error sending message:', error);

      return NextResponse.json(
        {
          error: 'Failed to send message',
          messageId
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in message handler:', error);

    return NextResponse.json(
      {
        error: 'Failed to process message request',
        message: error instanceof Error ? error.message : 'Unknown error',
        messageId
      },
      { status: 500 }
    );
  }
} 