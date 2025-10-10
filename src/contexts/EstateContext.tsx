// src/contexts/EstateContext.tsx - UPDATED
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerEstate } from '../types/estate';
import { useAuth } from './AuthContext';
import { getPlayerEstate, initializePlayerEstate } from '../services/EstateService';
import { getCurrentServer, getServerSpecificId } from '../utils/serverUtils';

interface EstateContextType {
    playerEstate: PlayerEstate | null;
    loading: boolean;
    error: string | null;
    refreshEstate: () => Promise<void>;
    hasWorkshop: () => boolean;
    canUse3DPrinter: () => boolean;
    canUseLaserCutter: () => boolean;
}

const EstateContext = createContext<EstateContextType>({
    playerEstate: null,
    loading: true,
    error: null,
    refreshEstate: async () => {},
    hasWorkshop: () => false,
    canUse3DPrinter: () => false,
    canUseLaserCutter: () => false
});

export const useEstate = () => useContext(EstateContext);

export const EstateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [playerEstate, setPlayerEstate] = useState<PlayerEstate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentServer, setCurrentServer] = useState<string>(getCurrentServer());

    // Use useRef instead of state to avoid re-renders
    const initializedUsersRef = useRef<Set<string>>(new Set());

    const refreshEstate = useCallback(async () => {
        if (!currentUser) return;

        try {
            // Use server-specific ID
            const estateDocId = getServerSpecificId(currentUser.uid, currentServer);
            const estate = await getPlayerEstate(estateDocId);
            setPlayerEstate(estate);
        } catch (err) {
            console.error('Error refreshing estate:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    }, [currentUser, currentServer]);

    // Helper functions
    const hasWorkshop = useCallback((): boolean => {
        return playerEstate?.currentEstate?.hasWorkshop || false;
    }, [playerEstate]);

    const canUse3DPrinter = useCallback((): boolean => {
        return hasWorkshop() && (playerEstate?.ownedDevices.has3DPrinter || false);
    }, [playerEstate, hasWorkshop]);

    const canUseLaserCutter = useCallback((): boolean => {
        return hasWorkshop() && (playerEstate?.ownedDevices.hasLaserCutter || false);
    }, [playerEstate, hasWorkshop]);

    // Listen for server changes from localStorage
    useEffect(() => {
        const handleStorageChange = () => {
            const newServer = getCurrentServer();
            if (newServer !== currentServer) {
                setCurrentServer(newServer);
                setLoading(true);
                // Clear initialization tracking for server switch
                initializedUsersRef.current = new Set();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [currentServer]);

    useEffect(() => {
        if (!currentUser) {
            setPlayerEstate(null);
            setLoading(false);
            setError(null);
            // Clear the ref when user logs out
            initializedUsersRef.current = new Set();
            return;
        }

        let unsubscribe: (() => void) | undefined;

        const setupListener = async () => {
            try {
                // Get server-specific document ID
                const estateDocId = getServerSpecificId(currentUser.uid, currentServer);

                unsubscribe = onSnapshot(
                    doc(firestore, 'playerEstates', estateDocId),
                    async (doc) => {
                        if (doc.exists()) {
                            const data = doc.data();
                            setPlayerEstate({
                                ...data,
                                createdAt: data.createdAt.toDate(),
                                updatedAt: data.updatedAt.toDate()
                            } as PlayerEstate);
                            setLoading(false);
                            setError(null);
                        } else {
                            // Document doesn't exist - initialize for existing player
                            // Check if we've already tried to initialize for this server
                            const initKey = `${currentUser.uid}_${currentServer}`;
                            if (!initializedUsersRef.current.has(initKey)) {
                                try {
                                    setLoading(true);
                                    console.log(`Initializing estate for user on ${currentServer} server:`, currentUser.uid);
                                    initializedUsersRef.current.add(initKey);
                                    // Pass the server-specific document ID to initialization
                                    await initializePlayerEstate(estateDocId);
                                    // The onSnapshot will fire again with the new document
                                } catch (error) {
                                    console.error('Failed to initialize estate:', error);
                                    setError('Failed to initialize estate data');
                                    setPlayerEstate(null);
                                    setLoading(false);
                                }
                            } else {
                                // Already tried to initialize, just set loading to false
                                setLoading(false);
                            }
                        }
                    },
                    (error) => {
                        console.error('Estate listener error:', error);
                        setError(error.message);
                        setLoading(false);
                    }
                );
            } catch (error) {
                console.error('Error setting up estate listener:', error);
                setError('Failed to setup estate listener');
                setLoading(false);
            }
        };

        setupListener();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [currentUser, currentServer]); // Re-run when server changes

    return (
        <EstateContext.Provider value={{
            playerEstate,
            loading,
            error,
            refreshEstate,
            hasWorkshop,
            canUse3DPrinter,
            canUseLaserCutter
        }}>
            {children}
        </EstateContext.Provider>
    );
};