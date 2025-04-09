'use client';

import React, { useState } from 'react';
import { useGraphQuery } from '@/hooks/useGraphQuery';
import { TRENDING_KOLS_QUERY, KOL_SEARCH_QUERY } from '@/config/graph.queries';
import { KOLProfile } from '@/types/profile';
import { Address } from 'viem';
import ConnectHeader from '@/components/connect/ConnectHeader';
import ConnectSearch from '@/components/connect/ConnectSearch';
import KolListView from '@/components/connect/KolListView';
import { useRouter } from 'next/navigation';

export default function ConnectPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const timestampDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60); // 30 days ago

    // Query for featured KOLs
    const { data: featuredData, isLoading: featuredLoading } = useGraphQuery<{ kolregistereds: KOLProfile[] }>(
        ['featured-kols'],
        TRENDING_KOLS_QUERY,
        {
            variables: { timestampDaysAgo, limit: 20 },
            staleTime: 60 * 1000, // 1 minute
        }
    );

    // Query for search results
    const { data: searchData, isLoading: searchLoading } = useGraphQuery<{ kolregistereds: KOLProfile[] }>(
        ['kol-search', searchQuery],
        KOL_SEARCH_QUERY,
        {
            variables: { searchTerm: searchQuery },
            skip: searchQuery.length < 2,
            staleTime: 60 * 1000,
        }
    );

    const handleProfileSelect = (profile: Address) => {
        // Navigate to the messages page with the selected profile
        router.push(`/messages/${profile}`);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const isLoading = featuredLoading || searchLoading;
    const isSearching = searchQuery.length >= 2;
    const displayData = isSearching ? searchData?.kolregistereds : featuredData?.kolregistereds;
    const sectionTitle = isSearching ? 'Search Results' : 'Featured KOLs';

    return (
        <div className="container mx-auto px-4 py-8 lowercase">
            <ConnectHeader isSearching={isSearching} />
            
            <ConnectSearch onProfileSelect={handleProfileSelect} />

            <div className="space-y-4">
                <KolListView
                    profiles={displayData || []}
                    isLoading={isLoading}
                    onProfileSelect={handleProfileSelect}
                    emptyMessage={isSearching ? 'No KOLs found matching your search' : 'No featured KOLs available'}
                    title={sectionTitle}
                />
            </div>
        </div>
    );
} 