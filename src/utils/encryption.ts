import { keccak256 } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import EthCrypto from 'eth-crypto';

export interface EncryptionParams {
  message: string;
  version: string;
  nonce: string;
  platform: string;
}

export interface EncryptionResult {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedMessage {
  encryptedMessage: string;
  publicKey: string;
  version: string;
  nonce: string;
  ephemeralKey: string;
}

export const encryptMessage = async (
  message: string,
  publicKey: string
): Promise<string> => {
  console.debug('Encrypting message...');
  
  try {
    const encryptedMessage = await EthCrypto.encryptWithPublicKey(publicKey.slice(2, publicKey.length), message);
    console.debug(encryptedMessage)

    return JSON.stringify(encryptedMessage, null, 2);
  } catch (error) {
    console.error('Error in encryptMessage:', error);
    throw error;
  }
};

export const decryptMessage = async (
  encryptedData: string,
  privateKey: string
): Promise<string> => {
  console.debug('Decrypting message...');
  
  try {
    const encryptedDataParsed = JSON.parse(encryptedData);
    const decryptedMessage = await EthCrypto.decryptWithPrivateKey(privateKey, encryptedDataParsed);
    console.debug(decryptedMessage)
    return decryptedMessage;
  } catch (error) {
    console.error('Error in decryptMessage:', error);
    throw error;
  }
};

export const generateAsymmetricKeys = async (signature: string): Promise<EncryptionResult> => {
  try {
    const privateKey = keccak256(signature as `0x${string}`);
    const account = privateKeyToAccount(privateKey);
    
    return {
      publicKey: account.publicKey,
      privateKey
    };
  } catch (error) {
    console.error('Error generating asymmetric keys:', error);
    throw new Error('Failed to generate encryption keys');
  }
}; 