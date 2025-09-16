// src/hooks/usePageTracking.ts - LIHTSAM VERSIOON
import { useEffect } from 'react';
import { globalDatabaseTracker } from '../services/GlobalDatabaseTracker';
import { useAuth } from '../contexts/AuthContext';

let isGloballyEnabled = false; // Globaalne flag

export const usePageTracking = (pageName: string) => {
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        // Lülita sisse ainult üks kord globaalselt
        if (!isGloballyEnabled) {
            globalDatabaseTracker.enableTracking(currentUser.uid);
            isGloballyEnabled = true;
        }

        // Alati uuenda lehekülge
        globalDatabaseTracker.setCurrentPage(pageName);

        return () => {
            // Cleanup - määra lehekülg tagasi "unknown'iks"
            globalDatabaseTracker.setCurrentPage('unknown');
        };
    }, [pageName, currentUser]);
};