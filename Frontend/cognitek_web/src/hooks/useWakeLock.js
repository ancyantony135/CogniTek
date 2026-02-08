import { useState, useEffect, useCallback } from 'react';

export function useWakeLock() {
    const [wakeLock, setWakeLock] = useState(null);

    const requestWakeLock = useCallback(async () => {
        if ('wakeLock' in navigator) {
            try {
                const lock = await navigator.wakeLock.request('screen');
                setWakeLock(lock);
                console.log('Wake Lock is active');

                lock.addEventListener('release', () => {
                    console.log('Wake Lock released');
                    setWakeLock(null);
                });
            } catch (err) {
                console.error(`${err.name}, ${err.message}`);
            }
        } else {
            console.warn('Wake Lock API not supported');
        }
    }, []);

    const releaseWakeLock = useCallback(async () => {
        if (wakeLock) {
            await wakeLock.release();
            setWakeLock(null);
        }
    }, [wakeLock]);

    // Re-request wake lock when page visibility changes (e.g. switching tabs)
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (wakeLock !== null && document.visibilityState === 'visible') {
                await requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [wakeLock, requestWakeLock]);

    return { requestWakeLock, releaseWakeLock, isLocked: !!wakeLock };
}
