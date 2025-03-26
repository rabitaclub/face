import { NextResponse } from 'next/server';
import { toBytes } from 'viem';
import { Buffer } from 'buffer';
import crypto from 'crypto';

// Helper function to convert hex to Buffer
const hexToBuffer = (hex: string): Buffer => {
  return Buffer.from(toBytes(hex));
};

// Helper function to format public key for ECDH
const formatPublicKey = (publicKey: Buffer): Buffer => {
  // If the key is 65 bytes (0x04 + 32 bytes x + 32 bytes y), it's already in the correct format
  if (publicKey.length === 65) {
    return publicKey;
  }
  
  // If the key is 33 bytes (0x02 or 0x03 + 32 bytes x), it's compressed
  if (publicKey.length === 33) {
    // TODO: Implement point decompression if needed
    throw new Error('Compressed public keys not supported yet');
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

// Helper function to decrypt with AES-GCM
const decryptAESGCM = (
  encrypted: Buffer,
  key: Buffer,
  iv: Buffer,
  tag: Buffer,
  aad: Buffer
): Buffer => {
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    
    // Set additional authenticated data
    decipher.setAAD(aad);
    
    // Set the authentication tag
    decipher.setAuthTag(tag);
    
    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting with AES-GCM:', error);
    throw new Error('Failed to decrypt message');
  }
};

export async function POST(request: Request) {
  try {
    const { encryptedData, privateKey } = await request.json();

    if (!encryptedData || !privateKey) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const iv = combined.slice(0, 12);
    const ephemeralPublicKey = combined.slice(12, 77); // 65 bytes for uncompressed public key
    const encrypted = combined.slice(77, -16); // All but last 16 bytes (tag)
    const tag = combined.slice(-16); // Last 16 bytes are the tag
    
    // Format the ephemeral public key
    const formattedEphemeralKey = formatPublicKey(ephemeralPublicKey);
    
    // Perform ECDH key exchange
    const sharedSecret = deriveSharedSecret(
      hexToBuffer(privateKey),
      formattedEphemeralKey
    );
    
    // Derive the symmetric key
    const symmetricKey = deriveSymmetricKey(sharedSecret);
    
    // Decrypt the message
    const decryptedMessage = decryptAESGCM(
      encrypted,
      symmetricKey,
      iv,
      tag,
      Buffer.from('Rabita')
    );
    
    return NextResponse.json({
      decryptedMessage: decryptedMessage.toString()
    });
  } catch (error) {
    console.error('Error in decryption endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to decrypt message' },
      { status: 500 }
    );
  }
} 