/**
 * Storage key management utilities
 * Handles secure retrieval and validation of storage API keys and DID management
 */
import * as fs from 'fs';
import * as path from 'path';
import { AgentDataExport } from '@web3-storage/w3up-client';

// Path to store agent data - in production, use a secure storage mechanism
const AGENT_DATA_PATH = process.env.AGENT_DATA_PATH || path.join(process.cwd(), '.w3up-agent.json');

/**
 * Get the W3Up DID key or private key from environment
 * The key can be either a direct private key or a serialized agent export
 */
export const getWeb3StorageKey = (): string => {
  const key = process.env.W3UP_KEY;
  
  if (!key) {
    throw new Error('W3UP_KEY environment variable is not set');
  }
  
  return key;
};

/**
 * Get the stored agent data if it exists
 * @returns Agent data object or null if not found
 */
export const getStoredAgentData = (): AgentDataExport | null => {
  try {
    if (fs.existsSync(AGENT_DATA_PATH)) {
      const data = fs.readFileSync(AGENT_DATA_PATH, 'utf-8');
      return JSON.parse(data) as AgentDataExport;
    }
  } catch (error) {
    console.error('Failed to read stored agent data:', error);
  }
  return null;
};

/**
 * Save agent data to disk for persistence
 * @param data Agent data to save
 */
export const saveAgentData = (data: AgentDataExport): void => {
  try {
    fs.writeFileSync(AGENT_DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log('Agent data saved successfully');
  } catch (error) {
    console.error('Failed to save agent data:', error);
  }
};

/**
 * Validates that all required storage keys are configured
 * @returns True if all required keys are present
 */
export const validateStorageConfig = (): boolean => {
  try {
    getWeb3StorageKey();
    return true;
  } catch (error) {
    console.error('Storage configuration validation failed:', error);
    return false;
  }
};

/**
 * Get all storage configuration values
 * @returns Object with all storage configuration values
 */
export const getStorageConfig = () => {
  return {
    web3Storage: getWeb3StorageKey()
  };
};

/**
 * Obfuscate a key for logging (show only first and last few chars)
 * @param key API key to obfuscate
 * @returns Obfuscated key string
 */
export const obfuscateKey = (key: string): string => {
  if (key.length <= 8) return '****';
  return `${key.substring(0, 3)}...${key.substring(key.length - 3)}`;
}; 