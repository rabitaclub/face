/**
 * Type definitions for KOL profiles and metrics
 */

import { Address } from "viem";

/**
 * Represents a registered KOL profile
 */
export interface KOLProfile {
  wallet: Address;
  platform: string;
  handle: string;
  name: string;
  fee: bigint;
  profileIpfsHash: string | null;
  verified: boolean;
  exists: boolean;
  formattedFee?: string;
  pgpKey?: {
    publicKey: string;
    pgpNonce: string;
  };
  tags?: string;
  description?: string;
  activeDays?: boolean[];
  globalStartTime?: number;
  globalEndTime?: number;
}

/**
 * Represents profile analytics metrics
 */
export interface Metrics {
  totalMessages: number;
  totalPayments: string;  // Formatted as BNB string with decimals
  totalFollowers: number;
} 