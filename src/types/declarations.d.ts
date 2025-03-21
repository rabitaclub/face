// Type declarations for modules without declaration files

declare module 'uuid';

// declare module '@web3-storage/w3up-client' {
//   import type { CID } from 'multiformats/cid';
  
//   export interface AgentDataExport {
//     device: {
//       did: string;
//       key: string;
//       name?: string;
//       recover?: boolean;
//     };
//     spaces: Array<{
//       did: string;
//       name?: string;
//       usage?: {
//         size: number;
//         count: number;
//       };
//     }>;
//     session?: string;
//   }

//   export interface UploadOptions {
//     name?: string;
//     signal?: AbortSignal;
//     onUploadProgress?: (progress: { uploaded: number; total: number }) => void;
//   }

//   export interface UploadDirectoryResult {
//     root: CID;
//     shards: CID[];
//     car: {
//       size: number;
//       cid: CID;
//     };
//   }

//   export interface Client {
//     // Agent is a property, not a function in newer versions
//     agent: {
//       did: () => string;
//       export: () => Promise<AgentDataExport>;
//       delegate: (data: AgentDataExport) => Promise<void>;
//       currentSpace: () => { did: () => string };
//     };
    
//     // These might be top-level methods or in capability object
//     upload?: {
//       uploadFile: (file: File, options?: UploadOptions) => Promise<UploadDirectoryResult>;
//       uploadDirectory: (files: File[], options?: UploadOptions) => Promise<UploadDirectoryResult>;
//     };
//     store?: {
//       add: (cid: CID) => Promise<any>;
//     };
    
//     // Older-style capability object, both structures supported
//     capability?: {
//       store?: {
//         add: (cid: CID) => Promise<any>;
//       };
//       upload?: {
//         uploadFile: (file: File, options?: UploadOptions) => Promise<UploadDirectoryResult>;
//         uploadDirectory: (files: File[], options?: UploadOptions) => Promise<UploadDirectoryResult>;
//       };
//       filecoin?: any;
//     };
    
//     // These methods remain consistent
//     createSpace: (name: string) => Promise<{ did: () => string }>;
//     setCurrentSpace: (spaceDid: string) => Promise<void>;
//     login: (email: string) => Promise<void>;
    
//     // These might vary between versions
//     identity: {
//       spaces: () => Promise<Array<{ did: () => string }>>;
//     };
//   }

//   export function create(options?: { store?: any }): Promise<Client>;
// } 