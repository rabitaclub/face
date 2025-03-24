import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsClient';

interface MessagingSkeletonProps {
    className?: string;
}

export function MessagingSkeleton({ className }: MessagingSkeletonProps) {
    const isMobile = useIsMobile();

    return (
        <div className={cn("flex-1 flex rounded-lg overflow-hidden shadow-sm relative bg-white", className)}>
            {/* Contact List Skeleton */}
            <div className={cn(
                "h-full border-r border-gray-200",
                isMobile ? "w-full" : "w-1/3"
            )}>
                {/* Search Bar Skeleton */}
                <div className="p-4 border-b border-gray-200">
                    <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                
                {/* Contact Items Skeleton */}
                <div className="space-y-2 p-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3 p-2 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Panel Skeleton */}
            <div className={cn(
                "h-full bg-gray-50",
                isMobile ? "hidden" : "w-2/3"
            )}>
                {/* Chat Header Skeleton */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                            <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Chat Messages Skeleton */}
                <div className="p-4 space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={cn(
                            "flex",
                            i % 2 === 0 ? "justify-end" : "justify-start"
                        )}>
                            <div className={cn(
                                "max-w-[70%] rounded-lg p-3",
                                i % 2 === 0 ? "bg-primary/10" : "bg-gray-200"
                            )}>
                                <div className="space-y-2">
                                    <div className={cn(
                                        "h-4 rounded",
                                        i % 2 === 0 ? "bg-primary/20" : "bg-gray-300",
                                        "animate-pulse"
                                    )} />
                                    <div className={cn(
                                        "h-3 rounded w-16",
                                        i % 2 === 0 ? "bg-primary/20" : "bg-gray-300",
                                        "animate-pulse"
                                    )} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Message Input Skeleton */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                        <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
} 