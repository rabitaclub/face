'use client';

import { useState } from 'react';
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useSignTypedData } from 'wagmi';
import { useAccount } from 'wagmi';
import { decryptMessage, encryptMessage, generateAsymmetricKeys } from '@/utils/encryption';
import { Textarea } from '@/components/ui/Textarea';
interface DebugInfo {
  timestamp: string;
  action: string;
  data: string;
}

interface EncryptedData {
  encryptedMessage: string;
  publicKey: string;
  version: string;
  nonce: string;
  ephemeralKey: string;
}

export default function EncryptionTestPage() {
  const [message, setMessage] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [encryptedMessage, setEncryptedMessage] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState('');

  const { address } = useAccount();

  const { signTypedDataAsync } = useSignTypedData()

  const createKeys = async (signature: string) => {
    const keys = await generateAsymmetricKeys(signature);

    return keys;
  }

  const handleGenerateKeys = async () => {
    const sType = await signTypedDataAsync({
      domain: {
        name: 'Rabita',
        version: '1',
      },
      types: {
        GeneratePGPKeys: [
          { name: 'app', type: 'string' },
          { name: 'message', type: 'string' },
          { name: 'publicKey', type: 'string' },
          { name: 'nonce', type: 'string' },
          { name: 'version', type: 'string' },
        ],
      },
      primaryType: 'GeneratePGPKeys',
      message: {
        app: 'Rabita',
        message: "Rabita protocol deterministic PGP keys generation",
        publicKey: address as string,
        nonce: '1',
        version: '1',
      },
    });
    console.log(sType)

    const keys = await createKeys(sType);
    console.debug(keys)
    setPublicKey(keys.publicKey);
    setPrivateKey(keys.privateKey);
  }

  const handleEncrypt = async () => {
    const encryptedMessage = await encryptMessage(message, publicKey);
    setEncryptedMessage(encryptedMessage);
  }

  const handleDecrypt = async () => {
    const decryptedMessage = await decryptMessage(encryptedMessage, privateKey);
    setDecryptedMessage(decryptedMessage);
  }

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle>Encryption Test</CardTitle>
      </CardHeader>
      <CardContent className="w-full justify-center">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Message</Label>
            <Input className="bg-transparent" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Public Key</Label>
            <Input className="bg-transparent" value={publicKey} onChange={(e) => setPublicKey(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Private Key</Label>
            <Input className="bg-transparent" value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} />
          </div>
          <Button onClick={handleGenerateKeys}>Generate Keys</Button>
          <Button onClick={handleEncrypt}>Encrypt</Button>
          <Textarea className="bg-transparent" value={encryptedMessage} onChange={(e) => setEncryptedMessage(e.target.value)} />
          <Button onClick={handleDecrypt}>Decrypt</Button>
          <Textarea className="bg-transparent" value={decryptedMessage} onChange={(e) => setDecryptedMessage(e.target.value)} />
        </div>
      </CardContent>
    </Card>
  )
} 