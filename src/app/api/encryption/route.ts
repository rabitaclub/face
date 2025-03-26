import { NextResponse } from 'next/server';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { toBytes, toHex } from 'viem';
import { Buffer } from 'buffer';
import crypto from 'crypto';

// Helper function to convert hex to Buffer
const hexToBuffer = (hex: string): Buffer => {
  return Buffer.from(toBytes(hex));
};

// Helper function to format public key for ECDH
const formatPublicKey = (publicKey: string): Buffer => {
  // Remove '0x' prefix if present
  const cleanKey = publicKey.replace('0x', '');
  
  // If the key is 66 characters (0x + 64 hex chars), it's uncompressed
  if (cleanKey.length === 66) {
    return hexToBuffer(cleanKey);
  }
  
  // If the key is 130 characters (0x + 128 hex chars), it's compressed
  if (cleanKey.length === 130) {
    // Extract the x and y coordinates
    const x = cleanKey.slice(2, 66);
    const y = cleanKey.slice(66);
    
    // Create uncompressed format (0x04 + x + y)
    return hexToBuffer('04' + x + y);
  }
  
  throw new Error('Invalid public key format');
};

// Helper function to derive shared secret using ECDH
const deriveSharedSecret = (
  privateKey: Buffer,
  publicKey: Buffer
): Buffer => {
  try {
    const ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(privateKey);
    return ecdh.computeSecret(publicKey);
  } catch (error) {
    console.error('Error deriving shared secret:', error);
    throw new Error('Failed to derive shared secret');
  }
};

// Helper function to derive symmetric key from shared secret
const deriveSymmetricKey = (sharedSecret: Buffer): Buffer => {
  try {
    const hkdf = crypto.createHmac('sha256', sharedSecret);
    hkdf.update('AES-GCM');
    return hkdf.digest();
  } catch (error) {
    console.error('Error deriving symmetric key:', error);
    throw new Error('Failed to derive symmetric key');
  }
};

// Helper function to encrypt with AES-GCM
const encryptAESGCM = (
  data: Buffer,
  key: Buffer,
  iv: Buffer
): { encrypted: Buffer; tag: Buffer } => {
  try {
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    // Set additional authenticated data
    const aad = Buffer.from('Rabita');
    cipher.setAAD(aad);
    
    // Encrypt the data
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    return { encrypted, tag };
  } catch (error) {
    console.error('Error encrypting with AES-GCM:', error);
    throw new Error('Failed to encrypt message');
  }
};

export async function POST(request: Request) {
  try {
    const { message, publicKey } = await request.json();

    if (!message || !publicKey) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Convert message to buffer
    const messageBuffer = Buffer.from(message);
    
    // Generate an ephemeral key pair for ECDH
    const ephemeralPrivateKey = generatePrivateKey();
    const ephemeralAccount = privateKeyToAccount(ephemeralPrivateKey);
    
    // Format the recipient's public key
    const formattedPublicKey = formatPublicKey(publicKey);
    
    // Perform ECDH key exchange
    const sharedSecret = deriveSharedSecret(
      hexToBuffer(ephemeralPrivateKey),
      formattedPublicKey
    );
    
    // Use the shared secret to derive a symmetric key
    const symmetricKey = deriveSymmetricKey(sharedSecret);
    
    // Generate a random IV
    const iv = crypto.randomBytes(12);
    
    // Encrypt the message using AES-GCM
    const { encrypted, tag } = encryptAESGCM(
      messageBuffer,
      symmetricKey,
      iv
    );
    
    // Combine all components
    const combined = Buffer.concat([
      iv,
      hexToBuffer(ephemeralAccount.publicKey),
      encrypted,
      tag
    ]);
    
    return NextResponse.json({
      encryptedMessage: combined.toString('base64'),
      ephemeralKey: ephemeralAccount.publicKey
    });
  } catch (error) {
    console.error('Error in encryption endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to encrypt message' },
      { status: 500 }
    );
  }
} 