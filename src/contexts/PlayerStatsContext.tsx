// src/contexts/PlayerStatsContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';
import { useAuth } from './AuthContext';
import { initializePlayerStats } from '../services/PlayerService';
import { checkRankUpdate } from '../utils/rankUtils';

interface PlayerStatsContextType {
    playerStats: PlayerStats | null;
    loading: boolean;
    error: string | null;
    refreshStats: () => Promise<void>;
}

const PlayerStatsContext = createContext<PlayerStatsContextType>({
    playerStats: null,
    loading: true,
    error: null,
    refreshStats: async () => {}
});

export const usePlayerStats = () => useContext(PlayerStatsContext);

export const PlayerStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Track last level to only check rank when level changes
    const lastLevelRef = useRef<number | null>(null);
    const isUpdatingRankRef = useRef<boolean>(false);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Manual refresh function - simplified to avoid loops
    const refreshStats = useCallback(async () => {
        if (!currentUser) return;

        try {
            // Just fetch the current data without triggering updates
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            const statsDoc = await getDoc(statsRef);

            if (statsDoc.exists()) {
                const stats = statsDoc.data() as PlayerStats;
                // Don't set state here if we have an active listener
                // The listener will handle the update
                if (!unsubscribeRef.current) {
                    setPlayerStats(stats);
                }
            }
        } catch (err) {
            console.error('Error refreshing stats:', err);
        }
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) {
            setPlayerStats(null);
            setLoading(false);
            return;
        }

        const setupListener = async () => {
            try {

                const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
                const username = userDoc.exists() ? userDoc.data().username : 'Tundmatu';

                // Initialize stats first (creates document if needed for new users)
                await initializePlayerStats(currentUser.uid, username);

                // Set up the real-time listener
                const statsRef = doc(firestore, 'playerStats', currentUser.uid);

                const unsubscribe = onSnapshot(
                    statsRef,
                    async (docSnapshot) => {
                        if (docSnapshot.exists()) {
                            const stats = docSnapshot.data() as PlayerStats;
                            setPlayerStats(stats);
                            setError(null);

                            // Only check rank if level changed and we're not already updating
                            const currentLevel = stats.level || 1;
                            if (!isUpdatingRankRef.current &&
                                (lastLevelRef.current === null || lastLevelRef.current !== currentLevel)) {

                                lastLevelRef.current = currentLevel;

                                const newRank = checkRankUpdate(stats);
                                if (newRank !== null && newRank !== stats.rank) {
                                    isUpdatingRankRef.current = true;
                                    try {
                                        await updateDoc(statsRef, { rank: newRank });
                                        console.log(`Auastme uuendus: ${stats.rank || 'puudub'} → ${newRank}`);
                                    } catch (error) {
                                        console.error('Error updating rank:', error);
                                    } finally {
                                        isUpdatingRankRef.current = false;
                                    }
                                }
                            }
                        } else {
                            setPlayerStats(null);
                        }
                        setLoading(false);
                    },
                    (error) => {
                        console.error('PlayerStats listener error:', error);
                        setError(error.message);
                        setLoading(false);
                    }
                );

                unsubscribeRef.current = unsubscribe;
            } catch (err) {
                console.error('Failed to setup stats listener:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
                setLoading(false);
            }
        };

        setupListener();

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [currentUser]);

    return (
        <PlayerStatsContext.Provider value={{ playerStats, loading, error, refreshStats }}>
            {children}
        </PlayerStatsContext.Provider>
    );
};