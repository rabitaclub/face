/**
 * Environment variables configuration with validation
 */

import { z } from 'zod';

// Schema for environment variables validation
const envSchema = z.object({
  // Graph subgraph settings - server-side only (no NEXT_PUBLIC prefix)
  DEFAULT_SUBGRAPH_URL: z.string().url().optional(),
  
  // Other environment variables can be added here
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_VERSION: z.string().optional().default('1.0.0'),
  RABITA_REGISTRY_ADDRESS: z.string().optional(),
  RABITA_MESSAGING_ADDRESS: z.string().optional(),
});

// Process environment with fallbacks
const processEnv = {
  DEFAULT_SUBGRAPH_URL: process.env.DEFAULT_SUBGRAPH_URL,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  RABITA_REGISTRY_ADDRESS: process.env.NEXT_PUBLIC_RABITA_REGISTRY_ADDRESS,
  RABITA_MESSAGING_ADDRESS: process.env.NEXT_PUBLIC_RABITA_MESSAGING_ADDRESS,
};

// Validate and export the environment variables
export const env = envSchema.parse(processEnv); 