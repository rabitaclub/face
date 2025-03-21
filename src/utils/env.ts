/**
 * Environment configuration validator
 * Ensures all required environment variables are set
 */

import { validateStorageConfig } from './storageKeys';

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = [
  'W3UP_KEY',
  'IMAGE_PROXY_SECRET',
  // Add other required env vars here
];

/**
 * Validates that all required environment variables are set
 * @returns Object with validation result
 */
export function validateEnvironment(): { 
  valid: boolean; 
  missing: string[]; 
  services: { 
    storage: boolean;
  }; 
} {
  const missing: string[] = [];

  // Check each required env var
  REQUIRED_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Validate service-specific configurations
  const storageConfigValid = validateStorageConfig();

  return {
    valid: missing.length === 0 && storageConfigValid,
    missing,
    services: {
      storage: storageConfigValid
    }
  };
}

/**
 * Gets environment value with validation
 * @param key Environment variable name
 * @param fallback Optional fallback value
 * @returns Environment value or fallback
 */
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Check if environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if environment is development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if environment is test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
} 