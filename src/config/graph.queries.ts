import { gql } from '@/lib/fetchGraphData';

export const KOL_SEARCH_QUERY = gql`
  query SearchKols($searchTerm: String!) {
    kolRegistereds(
      where: { 
        or: [
          { handle_contains_nocase: $searchTerm },
          { name_contains_nocase: $searchTerm }
        ]
      }
      first: 20
      orderBy: name
    ) {
      id
      wallet
      platform
      handle
      name
      fee
      pgpKey {
        publicKey
        pgpNonce
        isActive
      }
    }
  }
`;

export const KOL_MESSAGES_QUERY = gql`
  query GetConversationSummaries($userAddress: Bytes!, $first: Int = 10, $skip: Int = 0) {
    senderConversations: conversations(
      where: { sender: $userAddress }
      orderBy: updatedAt
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      kol
      kolProfile {
        id
        handle
        platform
        name
      }
      lastMessageContent
      lastMessageSender
      lastMessageTimestamp
      messageCount
      isActive
      updatedAt
      messages(first: 1, orderBy: blockTimestamp, orderDirection: desc) {
        id
        messageIpfsHash
        fee
        blockTimestamp
        message {
          status
          updatedAt
        }
      }
    }
    
    kolConversations: conversations(
      where: { kol: $userAddress }
      orderBy: updatedAt
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      sender
      lastMessageContent
      lastMessageSender
      lastMessageTimestamp
      messageCount
      isActive
      updatedAt
      messages(first: 1, orderBy: blockTimestamp, orderDirection: desc) {
        id
        messageIpfsHash
        fee
        blockTimestamp
        message {
          status
          updatedAt
        }
      }
    }
  }
`;

export const RABITA_CONVERSATION_QUERY = gql`
  query GetDetailedConversation($userAddress: Bytes!, $otherParty: Bytes!, $first: Int = 20, $skip: Int = 0) {
    userAsSender: conversations(
      where: { 
        sender: $userAddress 
        kol: $otherParty 
      }
    ) {
      id
      lastMessageContent
      lastMessageSender
      lastMessageTimestamp
      messageCount
      isActive
      messages(
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
        }
      }
    }
    
    userAsKol: conversations(
      where: { 
        sender: $otherParty
        kol: $userAddress 
      }
    ) {
      id
      lastMessageContent
      lastMessageSender
      lastMessageTimestamp
      messageCount
      isActive
      messages(
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
        }
      }
    }
  }
`;

export const PGP_KEYS_QUERY = gql`
  query PGPKeys($address: Bytes!) {
    senderPGPKeys(
      where: { sender: $address }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      sender
      pgpPublicKey
      pgpNonce
      blockTimestamp
    }
  }
`;

export const TRENDING_KOLS_QUERY = gql`
query GetTrendingKOLs($timestampDaysAgo: Int!, $limit: Int = 20) {
  kolRegistereds(
    first: $limit,
    orderBy: blockTimestamp,
    orderDirection: desc
  ) {
    id
    wallet
    name
    handle
    platform
    fee
    
    messages(where: {blockTimestamp_gt: $timestampDaysAgo}) {
      id
      fee
      blockTimestamp
      sender
      
      conversation {
        id
        messages(orderBy: blockTimestamp) {
          id
          sender
          blockTimestamp
        }
      }
    }
    
    activePairsAsKOL(where: {lastUpdated_gt: $timestampDaysAgo}) {
      id
      isActive
      createdAt
      lastUpdated
      
      conversation {
        id
        messageCount
        createdAt
        updatedAt
        lastMessageTimestamp
      }
    }
  }
}
`