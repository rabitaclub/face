'use client';

import { MessageContent, MessageStorage, StoredMessage } from './messageStorage';
import { generateSecureImageToken } from '@/app/api/proxy-image/route';

// Encryption key derivation (Web Crypto API)
async function deriveEncryptionKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Import the password as a key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derive a key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts message content for secure storage
 * @param message - The message to encrypt
 * @param encryptionKey - Key derived from sender and recipient identities
 * @returns Encrypted message as a string
 */
async function encryptMessage(message: MessageContent, encryptionKey: string): Promise<string> {
  try {
    // Generate a random salt for key derivation
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Generate a random IV for AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Derive the actual encryption key
    const key = await deriveEncryptionKey(encryptionKey, salt);
    
    // Encrypt the message content
    const encoder = new TextEncoder();
    const messageData = encoder.encode(JSON.stringify(message));
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      messageData
    );
    
    // Combine salt, IV, and encrypted data
    const encryptedBuffer = new Uint8Array(
      salt.byteLength + iv.byteLength + encryptedData.byteLength
    );
    
    encryptedBuffer.set(salt, 0);
    encryptedBuffer.set(iv, salt.byteLength);
    encryptedBuffer.set(
      new Uint8Array(encryptedData),
      salt.byteLength + iv.byteLength
    );
    
    // Convert to base64 for storage
    return btoa(
      Array.from(encryptedBuffer)
        .map(byte => String.fromCharCode(byte))
        .join('')
    );
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypts encrypted message content
 * @param encryptedData - The encrypted message data
 * @param encryptionKey - Key derived from sender and recipient identities
 * @returns Decrypted message content
 */
async function decryptMessage(encryptedData: string, encryptionKey: string): Promise<MessageContent> {
  try {
    // Convert from base64
    const encryptedBuffer = Uint8Array.from(
      atob(encryptedData)
        .split('')
        .map(char => char.charCodeAt(0))
    );
    
    // Extract salt, IV, and encrypted data
    const salt = encryptedBuffer.slice(0, 16);
    const iv = encryptedBuffer.slice(16, 28);
    const data = encryptedBuffer.slice(28);
    
    // Derive the decryption key
    const key = await deriveEncryptionKey(encryptionKey, salt);
    
    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      data
    );
    
    // Decode and parse the message
    const decoder = new TextDecoder();
    const messageJson = decoder.decode(decryptedData);
    return JSON.parse(messageJson) as MessageContent;
  } catch (error) {
    console.error('Error decrypting message:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Secure image processing for message attachments 
 * Ensures images are proxied and access-controlled
 * @param imageUrl Original image URL
 * @returns Secured image URL
 */
function secureImageUrl(imageUrl: string): string {
  // For external images, use our secure proxy
  if (imageUrl.startsWith('http') && !imageUrl.includes('/api/proxy-image')) {
    // Create a token for this URL to limit access to authorized users
    const token = generateSecureImageToken(imageUrl, 1440); // 24-hour token
    return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}&token=${token}&direct=true`;
  }
  
  // IPFS URLs are already secure and persistent
  if (imageUrl.startsWith('ipfs://')) {
    return imageUrl;
  }
  
  // Proxy URLs are already secured
  if (imageUrl.includes('/api/proxy-image')) {
    return imageUrl;
  }
  
  // Default to returning the original URL
  return imageUrl;
}

/**
 * Configuration for secure message storage
 * Ensures messages are properly encrypted and images are secured
 */
export class SecureMessageStorageConfig {
  private apiKey: string;
  private storage: MessageStorage | null = null;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Get the storage instance
   */
  private getStorage(): MessageStorage {
    if (!this.storage) {
      this.storage = MessageStorage.getInstance(this.apiKey);
    }
    return this.storage;
  }
  
  /**
   * Generate an encryption key from sender and recipient
   * @param senderId - Sender's identifier
   * @param recipientId - Recipient's identifier
   * @returns Encryption key as a string
   */
  private generateEncryptionKey(senderId: string, recipientId: string): string {
    // Sort IDs for consistent key generation regardless of sender/recipient order
    const sortedIds = [senderId, recipientId].sort();
    return `${sortedIds[0]}:${sortedIds[1]}:rabita-message-key`;
  }
  
  /**
   * Securely store a message with encryption
   * @param message - The message to store
   * @param isPrivate - Whether the message should be encrypted
   * @returns CID of the stored message
   */
  async storeMessage(message: MessageContent, isPrivate: boolean = true): Promise<string> {
    // Process any image attachments for security
    if (message.attachments && message.attachments.length > 0) {
      message.attachments = message.attachments.map(url => secureImageUrl(url));
    }
    
    // For private messages, encrypt before storage
    if (isPrivate) {
      try {
        const encryptionKey = this.generateEncryptionKey(
          message.sender,
          message.recipient
        );
        
        // Create a wrapping message that contains encrypted data
        const wrappedMessage: MessageContent = {
          sender: message.sender,
          recipient: message.recipient,
          content: await encryptMessage(message, encryptionKey),
          timestamp: message.timestamp || Date.now(),
          metadata: {
            isEncrypted: true,
            encryptionVersion: 1,
            // Include non-sensitive metadata if needed
            ...(message.metadata || {})
          }
        };
        
        return this.getStorage().storeMessage(wrappedMessage);
      } catch (error) {
        console.error('Error storing encrypted message:', error);
        throw new Error('Failed to store encrypted message');
      }
    } else {
      // For public messages, store directly
      return this.getStorage().storeMessage(message);
    }
  }
  
  /**
   * Retrieve and decrypt a message if necessary
   * @param cid - The CID of the message to retrieve
   * @param senderId - Sender's identifier for decryption
   * @param recipientId - Recipient's identifier for decryption
   * @returns The retrieved message
   */
  async retrieveMessage(
    cid: string,
    senderId?: string,
    recipientId?: string
  ): Promise<StoredMessage> {
    const message = await this.getStorage().retrieveMessage(cid);
    
    // Check if message is encrypted
    if (
      message.metadata?.isEncrypted &&
      typeof message.content === 'string' &&
      senderId &&
      recipientId
    ) {
      try {
        // Decrypt the message content
        const encryptionKey = this.generateEncryptionKey(senderId, recipientId);
        const decryptedMessage = await decryptMessage(message.content, encryptionKey);
        
        // Process any secured image attachments
        if (decryptedMessage.attachments) {
          // Keep the secure URLs for attachments
        }
        
        // Return a message that combines the encrypted wrapper with decrypted content
        return {
          ...message,
          ...decryptedMessage,
          metadata: {
            ...message.metadata,
            wasDecrypted: true
          }
        };
      } catch (error) {
        console.error('Error decrypting message:', error);
        throw new Error('Failed to decrypt message');
      }
    }
    
    return message;
  }
  
  /**
   * Store multiple messages securely
   * @param messages - Array of messages to store
   * @param isPrivate - Whether the messages should be encrypted
   * @returns Array of CIDs for stored messages
   */
  async storeMessageBatch(
    messages: MessageContent[],
    isPrivate: boolean = true
  ): Promise<string[]> {
    // For private messages, encrypt each before storage
    if (isPrivate) {
      const encryptionPromises = messages.map(async message => {
        // Process image attachments
        if (message.attachments && message.attachments.length > 0) {
          message.attachments = message.attachments.map(url => secureImageUrl(url));
        }
        
        const encryptionKey = this.generateEncryptionKey(
          message.sender,
          message.recipient
        );
        
        // Create a wrapper message
        return {
          sender: message.sender,
          recipient: message.recipient,
          content: await encryptMessage(message, encryptionKey),
          timestamp: message.timestamp || Date.now(),
          metadata: {
            isEncrypted: true,
            encryptionVersion: 1,
            ...(message.metadata || {})
          }
        } as MessageContent;
      });
      
      const encryptedMessages = await Promise.all(encryptionPromises);
      return this.getStorage().storeMessageBatch(encryptedMessages);
    } else {
      // For public messages, just process image attachments
      const processedMessages = messages.map(message => {
        if (message.attachments && message.attachments.length > 0) {
          return {
            ...message,
            attachments: message.attachments.map(url => secureImageUrl(url))
          };
        }
        return message;
      });
      
      return this.getStorage().storeMessageBatch(processedMessages);
    }
  }
} 