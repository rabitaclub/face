/**
 * Storage key management utilities
 * Handles secure retrieval and validation of storage API keys and DID management
 */
import * as fs from 'fs';
import * as path from 'path';

// Define the AgentDataExport type locally
interface AgentDataExport {
  did: string;
  key?: string;
  proof?: string;
  capabilities?: string[];
}

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
 * Get stored agent data from the filesystem
 * Returns null if no data exists
 */
export const getStoredAgentData = (): AgentDataExport | null => {
  try {
    if (fs.existsSync(AGENT_DATA_PATH)) {
      const data = fs.readFileSync(AGENT_DATA_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading agent data:', error);
  }
  return null;
};

/**
 * Save agent data to the filesystem
 * In production, use a secure storage mechanism
 */
export const saveAgentData = (data: AgentDataExport): void => {
  try {
    fs.writeFileSync(AGENT_DATA_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving agent data:', error);
    throw new Error('Failed to save agent data');
  }
};

/**
 * Validate storage configuration
 * Returns true if configuration is valid
 */
export const validateStorageConfig = (): boolean => {
  try {
    const key = getWeb3StorageKey();
    return !!key && key.length > 0;
  } catch {
    return false;
  }
};

/**
 * Get storage configuration
 * Returns configuration object or throws error
 */
export const getStorageConfig = () => {
  const key = getWeb3StorageKey();
  return {
    key,
    agentData: getStoredAgentData(),
  };
};

/**
 * Obfuscate key for logging/display
 */
export const obfuscateKey = (key: string): string => {
  if (key.length <= 8) return '********';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}; 