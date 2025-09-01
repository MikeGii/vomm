// src/contexts/EstateContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerEstate } from '../types/estate';
import { useAuth } from './AuthContext';
import { getPlayerEstate, initializePlayerEstate } from '../services/EstateService';

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

    // Use useRef instead of state to avoid re-renders
    const initializedUsersRef = useRef<Set<string>>(new Set());

    const refreshEstate = useCallback(async () => {
        if (!currentUser) return;

        try {
            const estate = await getPlayerEstate(currentUser.uid);
            setPlayerEstate(estate);
        } catch (err) {
            console.error('Error refreshing estate:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    }, [currentUser]);

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
                unsubscribe = onSnapshot(
                    doc(firestore, 'playerEstates', currentUser.uid),
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
                            // Check if we've already tried to initialize
                            if (!initializedUsersRef.current.has(currentUser.uid)) {
                                try {
                                    setLoading(true);
                                    console.log('Initializing estate for existing user:', currentUser.uid);
                                    initializedUsersRef.current.add(currentUser.uid);
                                    await initializePlayerEstate(currentUser.uid);
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
    }, [currentUser]); // Only depend on currentUser

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