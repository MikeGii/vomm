// src/contexts/PlayerStatsContext.tsx - UPDATED
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, getDoc } from '../services/TrackedFirestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';
import { useAuth } from './AuthContext';
import { initializePlayerStats } from '../services/PlayerService';
import { checkRankUpdate } from '../utils/rankUtils';
import { updateLastSeenIfNeeded } from '../services/LastSeenService';
import { getPlayerEstate } from '../services/EstateService';
import { getCurrentServer, getServerSpecificId } from '../utils/serverUtils';

interface PlayerStatsContextType {
    playerStats: PlayerStats | null;
    loading: boolean;
    error: string | null;
    currentServer: string;
    refreshStats: () => Promise<void>;
}

const PlayerStatsContext = createContext<PlayerStatsContextType>({
    playerStats: null,
    loading: true,
    error: null,
    currentServer: 'beta',
    refreshStats: async () => {}
});

export const usePlayerStats = () => useContext(PlayerStatsContext);

export const PlayerStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentServer, setCurrentServer] = useState<string>(getCurrentServer());

    // Track last level to only check rank when level changes
    const lastLevelRef = useRef<number | null>(null);
    const isUpdatingRankRef = useRef<boolean>(false);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Manual refresh function - simplified to avoid loops
    const refreshStats = useCallback(async () => {
        if (!currentUser) return;

        try {
            // Use server-specific document ID
            const statsDocId = getServerSpecificId(currentUser.uid, currentServer);
            const statsRef = doc(firestore, 'playerStats', statsDocId);
            const statsDoc = await getDoc(statsRef);

            if (statsDoc.exists()) {
                const stats = statsDoc.data() as PlayerStats;

                // Load estate with server-specific ID
                try {
                    const estate = await getPlayerEstate(statsDocId);

                    if (estate && estate.currentEstate) {
                        // Estate exists with current property
                    } else if (estate) {
                        console.log('🏠 ESTATE EXISTS BUT NO CURRENT ESTATE');
                    } else {
                        console.log('🏠 NO ESTATE DATA FOUND');
                    }

                    stats.estate = estate;
                } catch (error) {
                    console.warn('Estate loading failed, continuing without estate data:', error);
                    stats.estate = null;
                }

                // Don't set state here if we have an active listener
                if (!unsubscribeRef.current) {
                    setPlayerStats(stats);
                }
            }
        } catch (err) {
            console.error('Error refreshing stats:', err);
        }
    }, [currentUser, currentServer]);

    // Update lastSeen when user is active
    useEffect(() => {
        if (!currentUser) return;

        const serverSpecificId = getServerSpecificId(currentUser.uid, currentServer);

        // Update lastSeen every 5 minutes during activity
        const activityInterval = setInterval(() => {
            if (playerStats?.lastSeen !== undefined) {
                updateLastSeenIfNeeded(serverSpecificId, playerStats.lastSeen);
            } else {
                updateLastSeenIfNeeded(serverSpecificId);
            }
        }, 5 * 60 * 1000); // 5 minutes

        // Update lastSeen immediately when context loads
        if (playerStats) {
            updateLastSeenIfNeeded(serverSpecificId, playerStats.lastSeen);
        }

        return () => clearInterval(activityInterval);
    }, [currentUser, playerStats, currentServer]);

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

                // Get server-specific document ID
                const statsDocId = getServerSpecificId(currentUser.uid, currentServer);

                // Check if player has progress on this server
                const existingStats = await getDoc(doc(firestore, 'playerStats', statsDocId));

                if (!existingStats.exists()) {
                    // New player on this server - initialize stats
                    await initializePlayerStats(currentUser.uid, username, statsDocId);
                }

                // Set up the real-time listener with server-specific ID
                const statsRef = doc(firestore, 'playerStats', statsDocId);

                const unsubscribe = onSnapshot(
                    statsRef,
                    async (docSnapshot) => {
                        if (docSnapshot.exists()) {
                            const stats = docSnapshot.data() as PlayerStats;

                            try {
                                // Load estate with server-specific ID
                                const estate = await getPlayerEstate(statsDocId);
                                stats.estate = estate;
                            } catch (error) {
                                console.warn('Estate loading failed, continuing without estate data:', error);
                                stats.estate = null;
                            }

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
    }, [currentUser, currentServer]); // Re-run when server changes

    // Listen for server changes from localStorage
    useEffect(() => {
        const handleStorageChange = () => {
            const newServer = getCurrentServer();
            if (newServer !== currentServer) {
                setCurrentServer(newServer);
                setLoading(true);
                // The main useEffect will handle reloading data
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [currentServer]);

    return (
        <PlayerStatsContext.Provider value={{ playerStats, loading, error, currentServer, refreshStats }}>
            {children}
        </PlayerStatsContext.Provider>
    );
};