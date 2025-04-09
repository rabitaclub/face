'use client';

import React from 'react';

interface ConnectHeaderProps {
  isSearching: boolean;
}

export default function ConnectHeader({ isSearching }: ConnectHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-100">Connect with KOLs</h1>
      <p className="text-gray-400">
        {isSearching 
          ? 'Search results for your query' 
          : 'Discover and connect with top KOLs in the community'}
      </p>
    </div>
  );
} 