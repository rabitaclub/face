import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export const useUrlSync = () => {
    const router = useRouter();
    const pathname = usePathname();

    const updateUrl = useCallback((walletAddress: string | null) => {
        if (walletAddress) {
            const newPath = `/messages/${walletAddress}`;
            if (pathname !== newPath) {
                router.push(newPath);
            }
        } else {
            if (pathname !== '/messages') {
                router.push('/messages');
            }
        }
    }, [router, pathname]);

    return { updateUrl };
}; 