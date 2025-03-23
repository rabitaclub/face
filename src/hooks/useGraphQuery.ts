/**
 * useGraphQuery Hook
 * 
 * A React hook for querying The Graph subgraphs with React Query integration.
 * Provides caching, refetching, and error handling out of the box.
 * Uses the secure /api/graph endpoint to avoid exposing subgraph URLs.
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';

interface UseGraphQueryOptions<TData> extends Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'> {
  // Variables to pass to the GraphQL query
  variables?: Record<string, unknown>;
  // Skip the query execution
  skip?: boolean;
  // Enable query stale time (default: 60 seconds)
  staleTime?: number;
  // API endpoint for GraphQL (uses /api/graph by default)
  apiEndpoint?: string;
  // Optional API key for authorization
  apiKey?: string;
}

/**
 * Hook for querying The Graph subgraphs via the secure API endpoint
 * 
 * @param queryKey Unique key for React Query caching
 * @param query GraphQL query string
 * @param options Additional options 
 * @returns React Query result with data, loading state, and error handling
 */
export function useGraphQuery<TData = any>(
  queryKey: string | string[],
  query: string,
  options: UseGraphQueryOptions<TData> = {}
) {
  const {
    variables,
    skip = false,
    staleTime = 60000, // Default: 60 seconds
    apiEndpoint = '/api/graph',
    apiKey,
    ...reactQueryOptions
  } = options;

  // Construct the full query key for React Query
  const fullQueryKey = Array.isArray(queryKey) 
    ? [...queryKey, variables] 
    : [queryKey, variables];

  return useQuery<TData, Error>({
    queryKey: fullQueryKey,
    queryFn: async () => {
      try {
        // Set up headers with optional API key
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }
        
        // Make the request to our secure API endpoint
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query,
            variables,
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        
        const result = await response.json();
        
        // Handle errors in response
        if (result.error) {
          throw new Error(`Graph query error: ${result.error}`);
        }
        
        return result.data as TData;
      } catch (error: any) {
        console.error('Graph query hook error:', error);
        throw error;
      }
    },
    enabled: !skip,
    staleTime,
    ...reactQueryOptions,
  });
}

/**
 * A convenient way to define type-safe Graph queries
 * 
 * @example
 * const { userQuery, userFragment } = defineGraphQueries({
 *   userQuery: gql`
 *     query GetUser($id: ID!) {
 *       user(id: $id) {
 *         ...UserFragment
 *       }
 *     }
 *     ${UserFragment}
 *   `,
 *   userFragment: gql`
 *     fragment UserFragment on User {
 *       id
 *       name
 *       profileImageUrl
 *     }
 *   `,
 * });
 */
export function defineGraphQueries<T extends Record<string, string>>(queries: T): T {
  return queries;
} 