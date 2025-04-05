import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { FiTag, FiX } from 'react-icons/fi';
import { cn } from '@/utils/cn';

// Comprehensive list of predefined professional crypto/blockchain tags
export const PREDEFINED_TAGS = {
  // Technical domains
  technical: [
    'blockchain-development',
    'smart-contracts',
    'web3',
    'defi',
    'nft',
    'dao',
    'layer-2',
    'solidity',
    'ethereum',
    'bitcoin',
    'binance-smart-chain',
    'polkadot',
    'cosmos',
    'solana',
    'cardano',
    'zk-rollups',
    'optimistic-rollups',
    'cross-chain',
    'bridges',
  ],
  
  // Business & Finance 
  business: [
    'tokenomics',
    'crypto-economics',
    'market-analysis',
    'trading',
    'investment',
    'venture-capital',
    'fund-management',
    'ico-analysis',
    'regulatory-compliance',
    'institutional-adoption',
  ],
  
  // Industry verticals
  industry: [
    'gamefi',
    'socialfi',
    'metaverse',
    'privacy',
    'identity',
    'payments',
    'supply-chain',
    'healthcare',
    'energy',
    'real-estate',
    'insurance',
    'art',
    'music',
    'governance',
    'security',
    'auditing',
  ],
  
  // Professional roles
  roles: [
    'developer',
    'investor',
    'founder',
    'researcher',
    'analyst',
    'advisor',
    'educator',
    'community-manager',
    'marketing',
    'legal',
    'policy',
    'trader',
  ],
};

// Flattened list for easy search
export const ALL_TAGS = [
  ...PREDEFINED_TAGS.technical,
  ...PREDEFINED_TAGS.business,
  ...PREDEFINED_TAGS.industry,
  ...PREDEFINED_TAGS.roles,
];

interface TagSelectorProps {
  onTagsChange: (tags: string) => void;
  maxTags?: number;
}

const TagSelector: React.FC<TagSelectorProps> = ({ 
  onTagsChange, 
  maxTags = 5 
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeCategory, setActiveCategory] = useState<keyof typeof PREDEFINED_TAGS>('technical');
  
  // Filter tags based on search query
  const filteredTags = searchQuery.trim() 
    ? ALL_TAGS.filter(tag => 
        tag.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !selectedTags.includes(tag)
      )
    : PREDEFINED_TAGS[activeCategory].filter(tag => !selectedTags.includes(tag));
  
  // Update parent component when selected tags change
  useEffect(() => {
    onTagsChange(selectedTags.join(','));
  }, [selectedTags, onTagsChange]);
  
  const handleTagSelect = (tag: string) => {
    if (selectedTags.length < maxTags && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setSearchQuery('');
    }
  };
  
  const handleTagRemove = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };
  
  const handleCategoryChange = (category: keyof typeof PREDEFINED_TAGS) => {
    setActiveCategory(category);
    setSearchQuery('');
  };
  
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <FiTag size={14} className="text-primary" />
          Expertise Tags <span className="text-xs text-gray-500">({selectedTags.length}/{maxTags} max)</span>
        </label>
        
        {/* Selected tags */}
        <div className="flex flex-wrap gap-1.5 mb-3 min-h-8">
          {selectedTags.map(tag => (
            <Badge 
              key={tag}
              className="bg-primary/10 border border-primary/20 text-xs py-1 px-2 flex items-center gap-1"
            >
              {tag.replace(/-/g, ' ')}
              <button
                type="button"
                onClick={() => handleTagRemove(tag)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiX size={14} />
              </button>
            </Badge>
          ))}
          
          {selectedTags.length === 0 && (
            <span className="text-xs text-gray-500 italic">
              Select up to {maxTags} tags to describe your expertise
            </span>
          )}
        </div>
        
        {/* Tag input */}
        <div className="relative">
          <input
            type="text"
            placeholder="search for expertise tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => {
              // Use setTimeout to allow click events on dropdown items to fire first
              setTimeout(() => {
                setShowDropdown(false);
              }, 200);
            }}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
            disabled={selectedTags.length >= maxTags}
          />
          
          {/* Categories */}
          {showDropdown && selectedTags.length < maxTags && (
            <div className="absolute z-20 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-2 border-b border-gray-100">
                {Object.keys(PREDEFINED_TAGS).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryChange(category as keyof typeof PREDEFINED_TAGS)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-md transition-colors",
                      activeCategory === category
                        ? "bg-primary/10 text-dark font-medium"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
              
              {/* Tag options */}
              <div className="max-h-40 overflow-y-auto p-2">
                {filteredTags.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {filteredTags.slice(0, 10).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagSelect(tag)}
                        className="text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1"
                      >
                        <span className="w-3 h-3 rounded-full bg-primary/40 flex-shrink-0"></span>
                        <span>{tag.replace(/-/g, ' ')}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 text-center text-gray-500 text-sm text-lowercase">
                    {searchQuery 
                      ? "No matching tags found" 
                      : "No more tags available in this category"
                    }
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-xs text-gray-500 flex items-start gap-2">
        <FiTag className="shrink-0 mt-0.5 text-gray-400" size={14} />
        <span>
          Select tags that best represent your expertise and knowledge areas.
          This helps users find you for relevant discussions.
        </span>
      </div>
    </div>
  );
};

export default TagSelector; 