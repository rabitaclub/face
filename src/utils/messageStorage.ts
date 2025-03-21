'use client';

import { NFTStorage } from 'nft.storage';

// Message types
export interface MessageContent {
  sender: string;
  recipient: string;
  content: string;
  timestamp: number;
  transactionId?: string;
  attachments?: string[]; // IPFS CIDs for attachments
  metadata?: Record<string, any>;
}

export interface StoredMessage extends MessageContent {
  cid: string; // IPFS CID for the message
}

/**
 * Class that handles storing and retrieving messages using NFT.storage
 * Provides methods for storing individual messages or batching multiple messages
 * Implements caching and optimistic updates for better performance
 */
export class MessageStorage {
  private client: NFTStorage;
  private cache: Map<string, StoredMessage> = new Map();
  private static instance: MessageStorage;
  
  /**
   * Create a new MessageStorage instance
   * @param apiKey - The NFT.storage API key
   */
  private constructor(apiKey: string) {
    this.client = new NFTStorage({ token: apiKey });
  }
  
  /**
   * Get a singleton instance of MessageStorage
   * @param apiKey - The NFT.storage API key (only needed on first call)
   */
  public static getInstance(apiKey?: string): MessageStorage {
    if (!MessageStorage.instance) {
      if (!apiKey) {
        throw new Error('API key is required when initializing MessageStorage');
      }
      MessageStorage.instance = new MessageStorage(apiKey);
    }
    return MessageStorage.instance;
  }
  
  /**
   * Store a message on IPFS via NFT.storage
   * @param message - The message to store
   * @returns The CID (Content Identifier) of the stored message
   */
  public async storeMessage(message: MessageContent): Promise<string> {
    try {
      // Add current timestamp if not provided
      const messageWithTimestamp: MessageContent = {
        ...message,
        timestamp: message.timestamp || Date.now()
      };
      
      // Create a blob of the message JSON
      const blob = new Blob([JSON.stringify(messageWithTimestamp)], { type: 'application/json' });
      
      // Store the blob on IPFS
      const cid = await this.client.storeBlob(blob);
      
      // Store in cache
      const storedMessage: StoredMessage = {
        ...messageWithTimestamp,
        cid
      };
      this.cache.set(cid, storedMessage);
      
      return cid;
    } catch (error) {
      console.error('Error storing message:', error);
      throw new Error('Failed to store message on IPFS');
    }
  }
  
  /**
   * Store multiple messages as a batch to reduce API calls
   * @param messages - Array of messages to store
   * @returns Array of CIDs for each stored message
   */
  public async storeMessageBatch(messages: MessageContent[]): Promise<string[]> {
    try {
      // Prepare all messages with timestamps
      const messagesWithTimestamps = messages.map(message => ({
        ...message,
        timestamp: message.timestamp || Date.now()
      }));
      
      // Store each message separately but in parallel
      const cidPromises = messagesWithTimestamps.map(async (message) => {
        const blob = new Blob([JSON.stringify(message)], { type: 'application/json' });
        return this.client.storeBlob(blob);
      });
      
      const cids = await Promise.all(cidPromises);
      
      // Update cache
      messagesWithTimestamps.forEach((message, index) => {
        const cid = cids[index];
        this.cache.set(cid, { ...message, cid });
      });
      
      return cids;
    } catch (error) {
      console.error('Error storing message batch:', error);
      throw new Error('Failed to store message batch on IPFS');
    }
  }
  
  /**
   * Retrieve a message by its CID
   * @param cid - The CID of the message to retrieve
   * @returns The retrieved message
   */
  public async retrieveMessage(cid: string): Promise<StoredMessage> {
    // Check cache first
    const cachedMessage = this.cache.get(cid);
    if (cachedMessage) {
      return cachedMessage;
    }
    
    try {
      // Fetch from IPFS if not in cache
      const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch message: ${response.statusText}`);
      }
      
      const messageContent: MessageContent = await response.json();
      
      // Store in cache
      const storedMessage: StoredMessage = {
        ...messageContent,
        cid
      };
      this.cache.set(cid, storedMessage);
      
      return storedMessage;
    } catch (error) {
      console.error(`Error retrieving message with CID ${cid}:`, error);
      throw new Error('Failed to retrieve message from IPFS');
    }
  }
  
  /**
   * Retrieve multiple messages by their CIDs
   * @param cids - Array of CIDs to retrieve
   * @returns Array of retrieved messages in the same order
   */
  public async retrieveMessageBatch(cids: string[]): Promise<StoredMessage[]> {
    // Check which CIDs are in cache and which need to be fetched
    const cachedMessages: (StoredMessage | undefined)[] = cids.map(cid => this.cache.get(cid));
    const missingIndices = cachedMessages
      .map((msg, idx) => msg === undefined ? idx : -1)
      .filter(idx => idx !== -1);
    
    if (missingIndices.length === 0) {
      // All messages are in cache
      return cachedMessages as StoredMessage[];
    }
    
    // Fetch missing messages
    const missingCids = missingIndices.map(idx => cids[idx]);
    const fetchPromises = missingCids.map(async (cid) => {
      try {
        const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch message: ${response.statusText}`);
        }
        
        const messageContent: MessageContent = await response.json();
        const storedMessage: StoredMessage = { ...messageContent, cid };
        
        // Update cache
        this.cache.set(cid, storedMessage);
        
        return storedMessage;
      } catch (error) {
        console.error(`Error retrieving message with CID ${cid}:`, error);
        throw new Error(`Failed to retrieve message with CID ${cid}`);
      }
    });
    
    const fetchedMessages = await Promise.all(fetchPromises);
    
    // Merge cached and fetched messages
    const result = [...cachedMessages];
    missingIndices.forEach((originalIndex, fetchedIndex) => {
      result[originalIndex] = fetchedMessages[fetchedIndex];
    });
    
    return result as StoredMessage[];
  }
  
  /**
   * Clear the message cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Convenient function to store a single message
 * @param message - The message to store
 * @returns The CID of the stored message
 */
export async function storeMessage(message: MessageContent): Promise<string> {
  const apiKey = process.env.NFT_STORAGE_TOKEN;
  
  if (!apiKey) {
    throw new Error('NFT.Storage API key is not configured');
  }
  
  const storage = MessageStorage.getInstance(apiKey);
  return storage.storeMessage(message);
}

/**
 * Convenient function to retrieve a message by its CID
 * @param cid - The CID of the message to retrieve
 * @returns The retrieved message
 */
export async function retrieveMessage(cid: string): Promise<StoredMessage> {
  const apiKey = process.env.NFT_STORAGE_TOKEN;
  
  if (!apiKey) {
    throw new Error('NFT.Storage API key is not configured');
  }
  
  const storage = MessageStorage.getInstance(apiKey);
  return storage.retrieveMessage(cid);
} 