'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useMessaging } from '@/hooks/useMessaging';
import { Textarea } from '@/components/ui/Textarea';

export default function EncryptionTestPage() {
  const [message, setMessage] = useState('');
  const [recipientPublicKey, setRecipientPublicKey] = useState('');
  const [encryptedMessage, setEncryptedMessage] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [isCheckingKeys, setIsCheckingKeys] = useState(true);

  const {
    publicKey,
    isInitialized,
    isLoading,
    error,
    generateKeys,
    encryptMessage,
    decryptMessage,
    clearKeys,
    checkExistingKeys
  } = useMessaging();
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsCheckingKeys(true)
        await checkExistingKeys();
      } catch (err) {
        console.error('Error checking keys:', err);
      } finally {
        setIsCheckingKeys(false);
      }
    };
    initialize();
  }, [checkExistingKeys]);

  const handleEncrypt = async () => {
    try {
      const encrypted = await encryptMessage(message, recipientPublicKey);
      setEncryptedMessage(encrypted);
    } catch (err) {
      console.error('Encryption error:', err);
    }
  }

  const handleDecrypt = async () => {
    try {
      const decrypted = await decryptMessage(encryptedMessage);
      setDecryptedMessage(decrypted);
    } catch (err) {
      console.error('Decryption error:', err);
    }
  }

  if (isCheckingKeys) {
    return (
      <Card className="w-full bg-white">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle>Encryption Test</CardTitle>
      </CardHeader>
      <CardContent className="w-full justify-center">
        <div className="flex flex-col gap-4">
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          
          {!isInitialized ? (
            <div className="flex flex-col gap-4">
              <div className="text-sm text-gray-600">
                To start using encrypted messaging, you need to generate your encryption keys.
                This will create a secure key pair that will be used to encrypt and decrypt messages.
              </div>
              <Button 
                onClick={generateKeys} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Generating Keys...' : 'Generate Encryption Keys'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label>Your Public Key</Label>
              <Input 
                className="bg-transparent" 
                value={publicKey || ''} 
                readOnly 
              />
              <Button 
                onClick={clearKeys} 
                variant="destructive"
                className="w-full"
              >
                Clear Keys
              </Button>
            </div>
          )}

          {isInitialized && (
            <>
              <div className="flex flex-col gap-2">
                <Label>Message</Label>
                <Input 
                  className="bg-transparent" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Recipient Public Key</Label>
                <Input 
                  className="bg-transparent" 
                  value={recipientPublicKey} 
                  onChange={(e) => setRecipientPublicKey(e.target.value)}
                  placeholder="Enter recipient's public key..."
                />
              </div>

              <Button 
                onClick={handleEncrypt} 
                disabled={!message || !recipientPublicKey}
                className="w-full"
              >
                Encrypt Message
              </Button>

              <div className="flex flex-col gap-2">
                <Label>Encrypted Message</Label>
                <Textarea 
                  className="bg-transparent" 
                  value={encryptedMessage} 
                  onChange={(e) => setEncryptedMessage(e.target.value)}
                  placeholder="Encrypted message will appear here..."
                />
              </div>

              <Button 
                onClick={handleDecrypt} 
                disabled={!encryptedMessage}
                className="w-full"
              >
                Decrypt Message
              </Button>

              <div className="flex flex-col gap-2">
                <Label>Decrypted Message</Label>
                <Textarea 
                  className="bg-transparent" 
                  value={decryptedMessage} 
                  onChange={(e) => setDecryptedMessage(e.target.value)}
                  placeholder="Decrypted message will appear here..."
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 