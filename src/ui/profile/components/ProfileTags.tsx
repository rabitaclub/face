import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { FiTag } from 'react-icons/fi';

interface ProfileTagsProps {
  tags: string;
}

export function ProfileTags({ tags }: ProfileTagsProps) {
  const tagList = tags ? tags.split(',') : [];
  
  if (tagList.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-primary flex items-center gap-2">
        <FiTag size={16} />
        <span>Expertise</span>
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {tagList.map(tag => (
          <Badge 
            key={tag}
            className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1"
          >
            {tag.replace(/-/g, ' ')}
          </Badge>
        ))}
      </div>
    </div>
  );
} 