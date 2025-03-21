import { ethers } from 'ethers';

// Define types for structured signature data
export interface SignaturePayload {
  walletAddress: string;
  twitterUsername: string;
  salt: string;
  platform: string;
  nonce: string;
  timestamp: number;
  domain: string;
  expiresAt: number;
}

// Separate interface for public-facing response data
export interface SignatureResponseData {
  // Public details shown to user
  signature: string;
  walletAddress: string;
  twitterUsername: string;
  platform: string;
  expiresAt: number;
  // Technical details needed for verification
  // These are included but not displayed prominently to users
  _cryptoMetadata: {
    salt: string;
    nonce: string;
    timestamp: number;
    domain: string;
  };
}

/**
 * Generates an Ethereum signature linking a Twitter/X account to a wallet address
 * This signature can be verified by smart contracts using ECDSA
 * Enhanced with nonce, timestamp, and domain binding for additional security
 * 
 * @param twitterId - The Twitter user ID
 * @param twitterUsername - The Twitter username
 * @param walletAddress - The user's connected wallet address
 * @returns The generated signature and metadata
 */
export async function generateProfileSignature(
  twitterId: string,
  twitterUsername: string,
  walletAddress: string
): Promise<string> {
  try {
    // Get the private key from environment variables
    const privateKey = process.env.SIGNATURE_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('Signature private key is not configured');
    }

    // Validate inputs
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address format');
    }
    
    if (!twitterId || !twitterUsername) {
      throw new Error('Twitter credentials are required');
    }

    // Create a wallet instance from the private key
    const wallet = new ethers.Wallet(privateKey);
    
    // Security enhancements
    const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const nonce = ethers.utils.hexlify(ethers.utils.randomBytes(16));
    const timestamp = Math.floor(Date.now() / 1000);
    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'rabita.club';
    
    // Set expiration (24 hours from now)
    const expiresAt = timestamp + 86400;

    // Create structured data for signing
    const payload: SignaturePayload = {
      walletAddress: walletAddress.toLowerCase(),
      twitterUsername,
      salt,
      platform: "twitter",
      nonce,
      timestamp,
      domain,
      expiresAt
    };
    
    // Generate a hash of the structured data
    // This uses EIP-712 inspired approach but simplified for readability
    const messageHash = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['address', 'string', 'bytes32', 'string', 'bytes16', 'uint256', 'string', 'uint256'],
        [
          payload.walletAddress,
          payload.twitterUsername,
          payload.salt,
          payload.platform,
          payload.nonce,
          payload.timestamp,
          payload.domain,
          payload.expiresAt
        ]
      )
    );

    console.debug(
      [
        payload.walletAddress,
        payload.twitterUsername,
        payload.salt,
        payload.platform,
        payload.nonce,
        payload.timestamp,
        payload.domain,
        payload.expiresAt
      ]
    );
    console.debug(messageHash);
    
    // Sign the hash using the private key
    const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));
    console.debug(signature);
    
    // Return the signature with a structured format
    // Separate public data from cryptographic metadata
    const responseData: SignatureResponseData = {
      // Public information
      signature,
      walletAddress: payload.walletAddress,
      twitterUsername: payload.twitterUsername,
      platform: payload.platform,
      expiresAt: payload.expiresAt,
      
      // Technical details in a separate object
      _cryptoMetadata: {
        salt: payload.salt,
        nonce: payload.nonce,
        timestamp: payload.timestamp,
        domain: payload.domain
      }
    };
    
    return JSON.stringify(responseData);
  } catch (error) {
    console.error('Error generating signature:', error);
    throw new Error('Failed to generate profile verification signature');
  }
}

/**
 * Verifies an Ethereum signature against the provided data
 * Includes checks for timestamp validity and domain binding
 * 
 * @param signatureData - The signature data JSON string
 * @returns Whether the signature is valid
 */
export function verifyProfileSignature(signatureData: string): boolean {
  try {
    const data = JSON.parse(signatureData) as SignatureResponseData;
    
    // Extract data
    const { 
      signature, 
      walletAddress, 
      twitterUsername,
      platform,
      expiresAt 
    } = data;
    
    // Extract cryptographic metadata
    const { 
      salt, 
      nonce, 
      timestamp, 
      domain 
    } = data._cryptoMetadata;
    
    // Validate signature hasn't expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > expiresAt) {
      console.error('Signature has expired');
      return false;
    }
    
    // Validate domain to prevent cross-site signature reuse
    const expectedDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'rabita.club';
    if (domain !== expectedDomain) {
      console.error('Signature domain mismatch');
      return false;
    }
    
    // Verify that wallet address is properly formed
    if (!ethers.utils.isAddress(walletAddress)) {
      console.error('Invalid wallet address in signature data');
      return false;
    }
    
    // Recreate the message hash
    const messageHash = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['address', 'string', 'bytes32', 'string', 'bytes16', 'uint256', 'string', 'uint256'],
        [
          walletAddress.toLowerCase(),
          twitterUsername,
          salt,
          platform,
          nonce,
          timestamp,
          domain, 
          expiresAt
        ]
      )
    );
    
    // Recover the signer's address from the signature
    const recoveredAddress = ethers.utils.verifyMessage(
      ethers.utils.arrayify(messageHash),
      signature
    );
    
    // Verify if the recovered address matches our verifier address
    const verifierAddress = process.env.SIGNATURE_VERIFICATION_ADDRESS || 
      ethers.utils.computeAddress(process.env.SIGNATURE_PRIVATE_KEY || '');
    
    return recoveredAddress.toLowerCase() === verifierAddress.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
} 