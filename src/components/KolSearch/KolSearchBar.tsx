'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { KolListItem } from './KolListItem';
import { KOLProfile } from '@/types/profile';
import { useGraphQuery } from '@/hooks/useGraphQuery';
import { KOL_SEARCH_QUERY } from '@/config/graph.queries';
import { Address } from 'viem';
interface KolSearchBarProps {
    className?: string;
    placeholderText?: string;
    onProfileSelect?: (profile: Address) => void;
}

export default function KolSearchBar({ 
    className = '', 
    placeholderText = 'search KOLs...',
    onProfileSelect 
}: KolSearchBarProps) {
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const searchRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, error } = useGraphQuery<{ kolregistereds: KOLProfile[] }>(
        ['kol-search', debouncedQuery],
        KOL_SEARCH_QUERY,
        {
            variables: { searchTerm: debouncedQuery },
            skip: debouncedQuery.length < 2,
            staleTime: 60 * 1000,
        }
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (debouncedQuery.length >= 2) {
            setShowResults(true);
        }
    }, [debouncedQuery, data, isLoading]);

    return (
        <div ref={searchRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowResults(true)}
                    placeholder={placeholderText}
                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {(query || data?.kolregistereds) && query.length >= 2 && showResults && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                        </div>
                    ) : error ? (
                        <div className="p-4 text-center text-red-500">
                            {error.message}
                        </div>
                    ) : data?.kolregistereds.length ? (
                        <div className="divide-y divide-gray-100">
                            {data.kolregistereds.map((profile) => (
                                <div 
                                    key={profile.wallet}
                                    className="hover:bg-gray-50"
                                >
                                    <KolListItem
                                        profile={profile}
                                        onClick={onProfileSelect}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="p-4 text-center text-gray-500">
                            No KOLs found
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
} 