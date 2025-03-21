# IPFS Upload API

This API provides a secure server-side mechanism for uploading files to IPFS using the latest W3Up client from Web3.Storage.

## Overview

The implementation follows enterprise-grade architecture patterns with the latest W3Up client:

1. **DID-based authentication**: Uses decentralized identifiers for secure authentication
2. **Agent persistence**: Maintains client state across server restarts
3. **Real-time progress tracking**: Upload progress is monitored via a dedicated status endpoint
4. **Filecoin storage integration**: Automatically triggers Filecoin storage deals for long-term persistence
5. **Rate limiting**: Prevents abuse of the upload endpoint
6. **Comprehensive validation**: File type and size validation before uploading
7. **Universal API compatibility**: Custom adapter handles all W3Up client API variations
8. **Persistent upload status**: Uses Vercel KV (Redis) for persistent storage of upload statuses across server restarts and serverless functions

## Advanced W3Up Adapter

The implementation includes a sophisticated `W3UpAdapter` class that provides universal compatibility across different versions of the W3Up client:

```typescript
class W3UpAdapter {
  constructor(client) {
    // Initialize with any W3Up client version
  }
  
  async getAgentInfo() { /* ... */ }
  async createSpace(name) { /* ... */ }
  async setCurrentSpace(spaceDid) { /* ... */ }
  async uploadFile(file, options) { /* ... */ }
  async uploadDirectory(files, options) { /* ... */ }
}
```

Key advantages:
- **Multiple API path support**: Tries all possible property paths for each operation
- **Method fallbacks**: Falls back gracefully when methods are unavailable
- **Comprehensive error handling**: Detailed logging and recovery from API mismatches
- **Progressive enhancement**: Uses the most advanced methods when available
- **Defensive programming**: Guards against undefined properties and methods

## Endpoints

### `POST /api/ipfs/upload`

Uploads a file to IPFS and returns an IPFS content ID (CID).

**Request Format:**
- Content-Type: `multipart/form-data`
- Body:
  - `image`: The file to upload (required)
  - `name`: Name for the metadata (optional)
  - `description`: Description for the metadata (optional)

**Response:**
```json
{
  "success": true,
  "uploadId": "unique-upload-identifier",
  "ipfsHash": "ipfs-content-identifier",
  "url": "ipfs://ipfs-content-identifier/image.jpg",
  "gatewayUrl": "https://w3s.link/ipfs/ipfs-content-identifier/image.jpg",
  "filename": "image.jpg"
}
```

**Error Responses:**
- 400: Bad Request (invalid input)
- 413: Payload Too Large (file too big)
- 429: Too Many Requests (rate limit exceeded)
- 500: Server Error

### `GET /api/ipfs/upload-status?id={uploadId}`

Get the status of an ongoing or completed upload.

**Request Format:**
- Query Parameter: `id` - The unique upload identifier

**Response:**
```json
{
  "progress": 75,
  "status": "uploading",
  "message": "Uploading 240KB / 320KB",
  "lastUpdated": 1628765432123
}
```

**Status Values:**
- `pending`: Upload has been initialized but not started
- `uploading`: Upload is in progress
- `processing`: Upload completed, processing metadata
- `completed`: Upload successfully completed
- `failed`: Upload failed

**Persistence:**
Upload status data is stored in Vercel KV (Redis) with the following benefits:
- Persists across server restarts and deployments
- Works across multiple serverless function instances
- Automatic cleanup via TTL (Time To Live) expiration
- Consistent performance at scale

## W3Up Client

The latest [W3Up client](https://github.com/web3-storage/w3up) is a modern, capability-based API for decentralized storage. It offers significant advantages over the older web3.storage client:

Key features:
- **Capability-based security model**: Uses UCAN (User Controlled Authorization Networks) for secure, delegatable authorization
- **DID (Decentralized Identifier) authentication**: More secure than simple API keys
- **Spaces**: Organizational units for content with their own access control
- **Filecoin integration**: Automated storage deals for long-term persistence
- **Progress tracking**: Real-time upload progress monitoring
- **Advanced client architecture**: Better error handling and reliability

## Client Integration

The recommended way to use these endpoints is through the provided `useIpfsUpload` hook:

```tsx
import { useIpfsUpload } from '@/hooks/useIpfsUpload';

function MyComponent() {
  const { 
    uploadFile, 
    isUploading, 
    progress, 
    ipfsHash,
    uploadResult, 
    error 
  } = useIpfsUpload();

  const handleUpload = async (file) => {
    try {
      const result = await uploadFile(file, {
        name: 'My File',
        description: 'File description'
      });
      
      console.log(`File uploaded with hash: ${result.ipfsHash}`);
      console.log(`Gateway URL: ${result.gatewayUrl}`);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      {isUploading && <progress value={progress} max="100" />}
      {uploadResult && (
        <div>
          <p>Uploaded to: {uploadResult.ipfsHash}</p>
          <a href={uploadResult.gatewayUrl} target="_blank" rel="noopener noreferrer">
            View on IPFS
          </a>
        </div>
      )}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

## Security Considerations

1. **DID-based authentication**: Uses decentralized identifiers instead of simple API keys
2. **Agent persistence**: Securely stores authentication state
3. **Rate limiting**: Prevents abuse of the upload endpoint
4. **Input validation**: Comprehensive validation of all user input
5. **Sanitized error messages**: Prevents information leakage

## Configuration

Required environment variables:
- `W3UP_KEY`: Either a DID private key or an email address for authorization
- `AGENT_DATA_PATH`: Path to store agent data (optional, defaults to .w3up-agent.json in project root)

**Vercel KV Configuration:**
- `KV_URL`: Vercel KV Redis URL
- `KV_REST_API_URL`: Vercel KV REST API URL
- `KV_REST_API_TOKEN`: Vercel KV REST API Token
- `KV_REST_API_READ_ONLY_TOKEN`: Vercel KV REST API Read-Only Token

Optional environment variables:
- `MAX_UPLOAD_SIZE`: Maximum file size in bytes (default: 5MB)
- `RATE_LIMIT`: Maximum uploads per minute per IP (default: 5)

## Migration from NFT.Storage & Web3.Storage

This implementation replaces both NFT.Storage and the older Web3.Storage client with the modern W3Up client. Key differences:

1. **Authentication**: 
   - Old: Simple API token
   - New: DID-based authentication with UCAN capabilities

2. **Client architecture**:
   - Old: Direct API calls with simple token-based auth
   - New: Capability-based client with agent persistence

3. **Metadata handling**:
   - Old: Basic CAR file upload
   - New: Directory structure with proper metadata

4. **Storage persistence**:
   - Old: Manual Filecoin integration
   - New: Automatic Filecoin storage deals

## Troubleshooting

### API Compatibility Issues

The W3Up client is actively developed and its API may change between versions. Our implementation includes a robust adapter pattern with the following advantages:

1. **Universal Compatibility**:
   - Handles all known API structures across different versions
   - Tests multiple property paths to find the right functionality
   - Falls back gracefully from preferred to alternative methods

2. **Detailed Diagnostics**:
   - Extensive console logging for debugging
   - Captures and reports API structure during initialization
   - Provides helpful error messages for each fallback attempt

3. **Common Issues Fixed by the Adapter**:
   - Property vs. function access for `client.agent`
   - Missing upload methods at various property paths
   - Varying return formats from upload operations
   - Inconsistent space creation and selection methods

### Common Errors

1. **"client.agent is not a function"**:
   - **Cause**: Using newer W3Up client with older code expecting agent as function
   - **Solution**: The adapter handles this automatically by trying both patterns

2. **"Cannot read property 'upload' of undefined"**:
   - **Cause**: Capability property structure has changed
   - **Solution**: The adapter checks multiple possible locations for upload methods

3. **Email Authorization Failures**:
   - **Cause**: Authorization email not clicked or expired
   - **Solution**: Check email, click the link, and restart the server

4. **Space Creation Failures**:
   - **Cause**: Authorization incomplete or permissions issue
   - **Solution**: The adapter tries alternative space creation methods

### Upgrading W3Up Client

When upgrading the W3Up client version:

1. Review the [changelog](https://github.com/web3-storage/w3up/releases) for breaking changes
2. The adapter should handle most changes automatically
3. If new capabilities are added, extend the adapter to support them
4. Test the entire flow with debug logging enabled

## Future Improvements

1. **Multi-space support**: Organize uploads across multiple spaces
2. **Delegation**: Allow client-side applications to receive delegated capabilities
3. **Content addressing enhancements**: Use IPLD for more complex data structures
4. **Client-side verification**: Verify uploads directly in the browser
5. **Enhanced metadata**: Support for more complex metadata schemas
6. **Adapter improvements**: Support for future API changes 