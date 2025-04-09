'use client';

import React from 'react';
import KolSearchBar from '@/components/KolSearch/KolSearchBar';
import { Address } from 'viem';

interface ConnectSearchProps {
  onProfileSelect: (profile: Address) => void;
}

export default function ConnectSearch({ onProfileSelect }: ConnectSearchProps) {
  return (
    <div className="mb-8">
      <div className="max-w-2xl mx-auto">
        <KolSearchBar
          placeholderText="search KOLs by name or handle..."
          onProfileSelect={onProfileSelect}
          className="w-full text-white"
        />
      </div>
    </div>
  );
} 