import { useState, useEffect } from 'react';

export function useIsClient() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        return () => setIsClient(false);
    }, []);

    return isClient;
}

export function useIsMobile(breakpoint: number = 768) {
    const [isMobile, setIsMobile] = useState(false);
    const isClient = useIsClient();

    useEffect(() => {
        if (!isClient) return;

        const checkMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [breakpoint, isClient]);

    return isMobile;
} 