/**
 * Type definitions for KOL profiles and metrics
 */

import { Address } from "viem";

/**
 * Represents a registered KOL profile
 */
export interface KOLProfile {
  wallet: Address;
  socialPlatform: string;
  socialHandle: string;
  name: string;
  fee: bigint;
  profileIpfsHash: string | null;
  verified: boolean;
  exists: boolean; // Added for easier checking if profile exists
  formattedFee?: string;  // Formatted as BNB string with decimals
}

/**
 * Represents profile analytics metrics
 */
export interface Metrics {
  totalMessages: number;
  totalPayments: string;  // Formatted as BNB string with decimals
  totalFollowers: number;
} 