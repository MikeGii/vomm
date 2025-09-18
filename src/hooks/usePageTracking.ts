// src/hooks/usePageTracking.ts
import { useEffect, useRef } from 'react';
import { globalDatabaseTracker } from '../services/GlobalDatabaseTracker';
import { useAuth } from '../contexts/AuthContext';

// Globaalne flag topelt-aktiveerimise vältimiseks
let globalTrackingEnabled = false;

export const usePageTracking = (pageName: string, subPage?: string) => {
    const { currentUser } = useAuth();
    const previousPageRef = useRef<string>('');

    useEffect(() => {
        if (!currentUser) return;

        // Aktiveeri tracking ainult üks kord globaalselt
        if (!globalTrackingEnabled) {
            globalDatabaseTracker.enableTracking(currentUser.uid);
            globalTrackingEnabled = true;
        }

        // Konstrueeri lehe nimi koos alamlehega
        const fullPageName = subPage ? `${pageName}_${subPage}` : pageName;

        // Uuenda lehekülg ainult kui see muutus
        if (previousPageRef.current !== fullPageName) {
            globalDatabaseTracker.setCurrentPage(fullPageName);
            previousPageRef.current = fullPageName;
        }

        // Cleanup - määra lehekülg tagasi "unknown'iks"
        return () => {
            globalDatabaseTracker.setCurrentPage('unknown');
        };
    }, [pageName, subPage, currentUser]);

    // Return tracking stats for debugging
    return {
        isTracking: globalTrackingEnabled,
        currentPage: pageName,
        stats: globalDatabaseTracker.getSessionStats()
    };
};