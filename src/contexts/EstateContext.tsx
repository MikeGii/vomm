// src/contexts/EstateContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
            return;
        }

        // Set up real-time listener
        const unsubscribe = onSnapshot(
            doc(firestore, 'playerEstates', currentUser.uid),
            (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    setPlayerEstate({
                        ...data,
                        createdAt: data.createdAt.toDate(),
                        updatedAt: data.updatedAt.toDate()
                    } as PlayerEstate);
                } else {
                    // Initialize empty estate
                    setPlayerEstate(null);
                }
                setLoading(false);
                setError(null);
            },
            (error) => {
                console.error('Estate listener error:', error);
                setError(error.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

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