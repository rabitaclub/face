import { gql } from '@/lib/fetchGraphData';

export const KOL_SEARCH_QUERY = gql`
  query SearchKols($searchTerm: String!) {
    kolregistereds(
      where: { 
        or: [
          { handle_contains_nocase: $searchTerm },
          { name_contains_nocase: $searchTerm }
        ]
      },
      first: 20,
      orderBy: name
    ) {
      wallet
      platform
      handle
      name
      fee
      pgpKey {
        publicKey
        pgpNonce
      }
    }
  }
`;

export const KOL_MESSAGES_QUERY = gql`
  query GetConversationSummaries($userAddress: Bytes!, $first: Int = 10, $skip: Int = 0) {
    sentMessages: messageSents(
        where: { sender: $userAddress }
        orderBy: blockTimestamp
        orderDirection: desc
        first: $first
        skip: $skip
    ) {
        id
        messageId
        kol
        blockTimestamp
        messageIpfsHash
        fee
        kolProfile {
            id
            handle
            platform
            name
        }
        message {
        status
        updatedAt
        responses(first: 1, orderBy: responseTimestamp, orderDirection: desc) {
            responseIpfsHash
            responseTimestamp
        }
        }
    }
    
    receivedMessages: messageSents(
        where: { kol: $userAddress }
        orderBy: blockTimestamp
        orderDirection: desc
        first: $first
        skip: $skip
    ) {
        id
        messageId
        sender
        blockTimestamp
        messageIpfsHash
        fee
        message {
        status
        updatedAt
        responses(first: 1, orderBy: responseTimestamp, orderDirection: desc) {
            responseIpfsHash
            responseTimestamp
        }
        }
    }
    }
`;

export const RABITA_CONVERSATION_QUERY = gql`
  query GetDetailedConversation($userAddress: Bytes!, $otherParty: Bytes!, $first: Int = 20, $skip: Int = 0) {
    conversation: messageSents(
      where: {
      or: [
          { and: [{ sender: $userAddress }, { kol: $otherParty }] },
          { and: [{ sender: $otherParty }, { kol: $userAddress }] }
      ]
      }
      orderBy: blockTimestamp
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
        id
        messageId
        sender
        kol
        messageIpfsHash
        blockTimestamp
        fee
        deadline
        
        senderPGPKey {
          pgpPublicKey
          pgpNonce
        }
        
        kolProfile {
          id
          handle
          platform
          name
          fee
          pgpKey {
            publicKey
            pgpNonce
            isActive
          }
        }
        
        message {
          status
          createdAt
          updatedAt
          responses {
            responseIpfsHash
            responseTimestamp
            kolProfile {
              handle
              name
            }
          }
          timeout {
            triggeredAt
          }
        }
      }
    }
`;
