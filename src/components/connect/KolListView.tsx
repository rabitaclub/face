'use client';

import React, { useState } from 'react';
import { KolListItem } from '@/components/KolSearch/KolListItem';
import { KOLProfile } from '@/types/profile';
import { Address } from 'viem';
import { Grid, List, Loader2 } from 'lucide-react';

interface KolListViewProps {
  profiles: KOLProfile[];
  isLoading: boolean;
  onProfileSelect: (profile: Address) => void;
  emptyMessage: string;
  title: string;
}

export default function KolListView({
  profiles,
  isLoading,
  onProfileSelect,
  emptyMessage,
  title
}: KolListViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-300">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-200">
          {title}
        </h2>
        <div className="flex rounded-md overflow-hidden border border-gray-700">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 flex items-center justify-center ${
              viewMode === 'grid' 
                ? 'bg-primary text-white' 
                : 'bg-transparent text-gray-300 hover:bg-gray-800'
            }`}
            title="Grid view"
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 flex items-center justify-center ${
              viewMode === 'list' 
                ? 'bg-primary text-white' 
                : 'bg-transparent text-gray-300 hover:bg-gray-800'
            }`}
            title="List view"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <div
              key={profile.wallet}
              className="bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-700"
            >
              <KolListItem
                profile={profile}
                onClick={onProfileSelect}
                variant="card"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((profile) => (
            <div
              key={profile.wallet}
              className="bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-700"
            >
              <KolListItem
                profile={profile}
                onClick={onProfileSelect}
                variant="list"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 