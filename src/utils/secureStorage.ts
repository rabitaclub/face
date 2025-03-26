import { Buffer } from 'buffer';

export const PRIVATE_KEY_STORAGE_KEY = 'rabita_private_key';
const ENCRYPTION_KEY_DERIVATION_ITERATIONS = 100000;

interface EncryptedPrivateKey {
  encryptedData: string;
  salt: string;
  iv: string;
  version: number;
}

/**
 * Derives an encryption key from the user's wallet signature
 */
async function deriveEncryptionKey(signature: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const signatureBuffer = encoder.encode(signature);
  
  // Import the signature as a key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    signatureBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derive a key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ENCRYPTION_KEY_DERIVATION_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Securely stores the private key using the user's wallet signature for encryption
 */
export async function storePrivateKey(privateKey: string, signature: string): Promise<void> {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveEncryptionKey(signature, salt);
    const encoder = new TextEncoder();
    const privateKeyData = encoder.encode(privateKey);
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      privateKeyData
    );
    
    const encryptedPackage: EncryptedPrivateKey = {
      encryptedData: Buffer.from(encryptedData).toString('base64'),
      salt: Buffer.from(salt).toString('base64'),
      iv: Buffer.from(iv).toString('base64'),
      version: 1
    };
    
    localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, JSON.stringify(encryptedPackage));
  } catch (error) {
    console.error('Error storing private key:', error);
    throw new Error('Failed to store private key securely');
  }
}

/**
 * Retrieves and decrypts the private key using the user's wallet signature
 */
export async function retrievePrivateKey(signature: string): Promise<string | null> {
  try {
    const encryptedPackageStr = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
    if (!encryptedPackageStr) return null;
    
    const encryptedPackage: EncryptedPrivateKey = JSON.parse(encryptedPackageStr);
    
    // Convert stored base64 strings back to Uint8Arrays
    const salt = Uint8Array.from(Buffer.from(encryptedPackage.salt, 'base64'));
    const iv = Uint8Array.from(Buffer.from(encryptedPackage.iv, 'base64'));
    const encryptedData = Uint8Array.from(Buffer.from(encryptedPackage.encryptedData, 'base64'));
    
    // Derive the decryption key
    const key = await deriveEncryptionKey(signature, salt);
    
    // Decrypt the private key
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encryptedData
    );
    
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Error retrieving private key:', error);
    return null;
  }
}

/**
 * Removes the stored private key
 */
export function removePrivateKey(): void {
  localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
} 