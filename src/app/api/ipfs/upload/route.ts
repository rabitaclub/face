import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import appConfig from '@/config/app.config.json';
import { client } from '@/config/greenfield';
import { bytesFromBase64, Client, DelegatedPubObjectRequest, Long, RedundancyType, VisibilityType } from '@bnb-chain/greenfield-js-sdk';

import { ReedSolomon } from '@bnb-chain/reed-solomon';

// Define local UploadResult interface
export interface UploadResult {
  result: any;
  ipfsHash: string;
  gatewayUrl?: string;
  filename?: string;
}

const rs = new ReedSolomon();

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
    this.privateKey = process.env.GF_KEY || '';
    this.address = process.env.GF_ADDRESS || '';
    console.log('Initialized Greenfield adapter with client properties:', Object.keys(this.client));
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

      console.log(res)
    }
  }

  async uploadFile(file: File, onUpload?: any) {
    const fileBytes = await file.arrayBuffer();
    const expectCheckSums = rs.encode(new Uint8Array(fileBytes));

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

    // let isObjectExists = false;

    try {
      const res = await client.object.headObject(this.bucketName, file.name);
      console.log("res", res)

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
      const deleteObjectRes = await deleteObjectResTx.broadcast({
        denom: 'BNB',
        gasLimit: Number(simulateTxInfo?.gasLimit),
        gasPrice: simulateTxInfo?.gasPrice || '5000000000',
        payer: this.address,
        granter: '',
        privateKey: this.privateKey,
      });
      console.log("deleteObjectRes", deleteObjectRes)

      // isObjectExists = true;
    } catch (error) {
      // isObjectExists = false;

    }

    // if (!isObjectExists) {

    // const uploadTx = await client.object.createObject(
    //   createObjectInfo
    // )

    // const simulateTxInfo = await uploadTx.simulate({
    //   denom: 'BNB',
    // });

    // createObjectRes = await uploadTx.broadcast({
    //   denom: 'BNB',
    //   gasLimit: Number(simulateTxInfo?.gasLimit),
    //   gasPrice: simulateTxInfo?.gasPrice || '5000000000',
    //   payer: this.address,
    //   granter: '',
    //   privateKey: this.privateKey,
    // });
    const delegateObjectTx = await client.object.delegateUploadObject(
      createObjectInfo,
      {
        type: 'ECDSA',
        privateKey: this.privateKey,
      }
    )
    // } else {
    //   createObjectRes = await client.object.headObject(this.bucketName, file.name);
    // }

    // const uploadRes = await client.object.uploadObject(
    //   {
    //       bucketName: createObjectInfo.bucketName,
    //       objectName: createObjectInfo.objectName,
    //       body: file,
    //       txnHash: createObjectRes.transactionHash,
    //   },
    //   {
    //     type: 'ECDSA',
    //     privateKey: this.privateKey,
    //   },
    // );

    return delegateObjectTx;
  }

  async uploadDirectory(files: File[]) {

  }
}

// async function initClient() {
//   try {
//     const adapter = new GreenfieldAdapter(client);
//     await adapter.findAndSetSP();
//     await adapter.createIfNotExists();

//     return {
//       adapter
//     }
//   } catch (error) {
//     console.error('Failed to initialize W3Up client:', error);
//     throw error;
//   }
// }

// async function getClient(): Promise<{ adapter: GreenfieldAdapter }> {

//   // Create a new client instance 
//   const client = await initClient();
//   return client;
// }

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  // Generate a unique ID for this upload
  const uploadId = uuidv4();
  
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!validateRateLimit(clientIp)) {
      return NextResponse.json(
        { 
          error: 'Too many upload requests. Please try again later.',
          uploadId 
        },
        { status: 429 }
      );
    }
    
    // Validate request
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
    
    // Parse the multipart form data
    const formData = await request.formData();
    
    // Get the image file
    const imageFile = formData.get('image') as File;
    const name = formData.get('name') as string || 'Untitled';
    const description = formData.get('description') as string || '';
    
    // Validate image
    if (!imageFile) {
      return NextResponse.json(
        { 
          error: 'No image file provided',
          uploadId 
        },
        { status: 400 }
      );
    }
    
    // Check file type
    if (!ACCEPTED_TYPES.includes(imageFile.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type. Supported formats: JPEG, PNG, WebP, GIF',
          uploadId 
        },
        { status: 400 }
      );
    }
    
    // Check file size
    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          uploadId 
        },
        { status: 413 }
      );
    }
    
    // Initialize the W3Up client
    try {
      // Create metadata for the file with additional fields
      const metadataObj = {
        name,
        description,
        image: imageFile.name,
        type: imageFile.type,
        size: imageFile.size,
        created: new Date().toISOString(),
        source: 'Rabita App',
        application: appConfig.name,
        version: appConfig.version
      };

      // Convert to JSON string
      const metadataJson = JSON.stringify(metadataObj, null, 2);

      // Create metadata blob
      const metadataBlob = new Blob([metadataJson], { type: 'application/json' });

      // Prepare a directory structure for the files
      const files = [
        new File([imageFile], imageFile.name, { type: imageFile.type }),
        new File([metadataBlob], 'metadata.json', { type: 'application/json' })
      ];

      // Create result object with enhanced metadata
      const filePath = await saveFile(imageFile);
      const result: UploadResult = {
        result: filePath,
        ipfsHash: imageFile.name,
        gatewayUrl: `${appConfig.url}${filePath.replace('./public', '')}`,
        filename: imageFile.name
      };

      // Return the result with upload ID
      return NextResponse.json({
        success: true,
        uploadId,
        ...result
      });
    } catch (error: any) {
      console.log(JSON.stringify(error, null, 2))
      console.error('Error initializing client:', error);

      return NextResponse.json(
        {
          error: 'Failed to initialize storage client',
          uploadId
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error uploading to IPFS:', error);

    return NextResponse.json(
      {
        error: 'Failed to upload image to IPFS',
        message: error instanceof Error ? error.message : 'Unknown error',
        uploadId
      },
      { status: 500 }
    );
  }
}

/**
 * Simple rate limiting implementation
 * In production, use a Redis-based solution
 */
const RATE_LIMIT = 5; // 5 uploads per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const rateLimitStore: Map<string, { count: number, timestamp: number }> = new Map();

function validateRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientIp) || { count: 0, timestamp: now };

  // Reset counter if window has passed
  if (now - clientData.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(clientIp, { count: 1, timestamp: now });
    return true;
  }

  // Increment counter
  if (clientData.count >= RATE_LIMIT) {
    return false;
  }

  rateLimitStore.set(clientIp, {
    count: clientData.count + 1,
    timestamp: clientData.timestamp
  });

  return true;
} 