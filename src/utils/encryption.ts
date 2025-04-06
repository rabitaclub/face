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
  console.debug('Encrypting message...', publicKey, message);
  console.debug(EthCrypto.encryptWithPublicKey("e5c4dc6f0bf0e7f0dd808974a708cdad67d032da041139c4cd9f7d5db9013fdecaae3c7a5258968558d656f2d36d09d5809dc86f099c0a03087d20dbebf95180", message))

  try {
    const encryptedMessage = await EthCrypto.encryptWithPublicKey(publicKey, message);
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

    const identity = EthCrypto.createIdentity();
    console.debug(identity)
    
    return {
      publicKey: account.publicKey,
      privateKey
    };
  } catch (error) {
    console.error('Error generating asymmetric keys:', error);
    throw new Error('Failed to generate encryption keys');
  }
}; 