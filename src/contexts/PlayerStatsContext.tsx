// src/contexts/PlayerStatsContext.tsx - FULLY UPDATED
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';
import { useAuth } from './AuthContext';
import { initializePlayerStats } from '../services/PlayerService';
import { checkRankUpdate } from '../utils/rankUtils';
import { updateLastSeenIfNeeded } from '../services/LastSeenService';
import { getPlayerEstate } from '../services/EstateService';
import { getCurrentServer, getServerSpecificId } from '../utils/serverUtils';
import { GlobalUserService } from '../services/GlobalUserService';

interface PlayerStatsContextType {
    playerStats: PlayerStats | null;
    pollid: number;
    isVip: boolean;
    loading: boolean;
    error: string | null;
    currentServer: string;
    refreshStats: () => Promise<void>;
    updatePollid: (amount: number) => Promise<number>;
    setPollidAmount: (amount: number) => Promise<void>;
}

const PlayerStatsContext = createContext<PlayerStatsContextType>({
    playerStats: null,
    pollid: 0,
    isVip: false,
    loading: true,
    error: null,
    currentServer: 'beta',
    refreshStats: async () => {},
    updatePollid: async () => 0,
    setPollidAmount: async () => {}
});

export const usePlayerStats = () => useContext(PlayerStatsContext);

export const PlayerStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [pollid, setPollid] = useState<number>(0);
    const [isVip, setIsVip] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentServer, setCurrentServer] = useState<string>(getCurrentServer());

    const lastLevelRef = useRef<number | null>(null);
    const isUpdatingRankRef = useRef<boolean>(false);
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const globalUnsubscribeRef = useRef<(() => void) | null>(null);

    const updatePollid = useCallback(async (amount: number): Promise<number> => {
        if (!currentUser) return 0;

        const newPollid = await GlobalUserService.updatePollid(currentUser.uid, amount);
        setPollid(newPollid);  // This calls the setState function
        return newPollid;
    }, [currentUser]);

    const setPollidAmount = useCallback(async (amount: number): Promise<void> => {  // RENAMED
        if (!currentUser) return;

        await GlobalUserService.setPollid(currentUser.uid, amount);
        setPollid(amount);  // This calls the setState function
    }, [currentUser]);

    // Manual refresh function - simplified to avoid loops
    const refreshStats = useCallback(async () => {
        if (!currentUser) return;

        try {
            // Use server-specific document ID
            const statsDocId = getServerSpecificId(currentUser.uid, currentServer);
            const statsRef = doc(firestore, 'playerStats', statsDocId);
            const statsDoc = await getDoc(statsRef);

            // ADD - Refresh global data too
            const globalData = await GlobalUserService.getGlobalUserData(currentUser.uid);
            setPollid(globalData.pollid);
            setIsVip(globalData.isVip);

            if (statsDoc.exists()) {
                const stats = statsDoc.data() as PlayerStats;

                // Load estate with server-specific ID
                try {
                    const estate = await getPlayerEstate(statsDocId);
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

        // Use BASE userId - LastSeenService adds server suffix itself
        const activityInterval = setInterval(() => {
            if (playerStats?.lastSeen !== undefined) {
                updateLastSeenIfNeeded(currentUser.uid, playerStats.lastSeen);
            } else {
                updateLastSeenIfNeeded(currentUser.uid);
            }
        }, 5 * 60 * 1000);

        if (playerStats) {
            updateLastSeenIfNeeded(currentUser.uid, playerStats.lastSeen);
        }

        return () => clearInterval(activityInterval);
    }, [currentUser, playerStats]);

    // ADD - Set up listener for global user data
    useEffect(() => {
        if (!currentUser) {
            setPollid(0);
            setIsVip(false);
            return;
        }

        // Listen to global user document for pollid/VIP changes
        const userRef = doc(firestore, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(
            userRef,
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    setPollid(userData.pollid || 0);
                    setIsVip(userData.isVip || false);
                }
            },
            (error) => {
                console.error('Global user listener error:', error);
            }
        );

        globalUnsubscribeRef.current = unsubscribe;

        return () => {
            if (globalUnsubscribeRef.current) {
                globalUnsubscribeRef.current();
                globalUnsubscribeRef.current = null;
            }
        };
    }, [currentUser]);

    useEffect(() => {
        // CRITICAL: Always get fresh server value from localStorage
        const freshServer = getCurrentServer();

        // Update state if it doesn't match
        if (freshServer !== currentServer) {
            console.log('Detected server mismatch. Updating from', currentServer, 'to', freshServer);
            setCurrentServer(freshServer);
            return; // Exit and let the next effect run with correct server
        }

        if (!currentUser) {
            setPlayerStats(null);
            setLoading(false);
            return;
        }

        const setupListener = async () => {
            console.log('=== SETTING UP LISTENER ===');
            console.log('Current Server:', freshServer); // Use fresh value
            console.log('User ID:', currentUser.uid);

            try {
                const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
                const username = userDoc.exists() ? userDoc.data().username : 'Tundmatu';

                console.log('Username:', username);

                // Get server-specific document ID using FRESH server value
                const statsDocId = getServerSpecificId(currentUser.uid, freshServer);
                console.log('Stats Doc ID:', statsDocId);

                // ADD - Load global data immediately
                const globalData = await GlobalUserService.getGlobalUserData(currentUser.uid);
                setPollid(globalData.pollid);
                setIsVip(globalData.isVip);

                // Check if player has progress on this server
                const existingStats = await getDoc(doc(firestore, 'playerStats', statsDocId));
                console.log('Stats exist?', existingStats.exists());

                if (!existingStats.exists()) {
                    console.log('INITIALIZING NEW STATS FOR SERVER:', freshServer);
                    await initializePlayerStats(currentUser.uid, username, statsDocId);
                    console.log('Stats initialized successfully');
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
            console.log('Storage change detected. New server:', newServer);
            if (newServer !== currentServer) {
                console.log('Server changed from', currentServer, 'to', newServer);
                setCurrentServer(newServer);
                setLoading(true);
            }
        };

        // CRITICAL: Check immediately on mount
        const initialServer = getCurrentServer();
        console.log('Initial server check:', initialServer, 'current state:', currentServer);
        if (initialServer !== currentServer) {
            console.log('Correcting server mismatch on mount');
            setCurrentServer(initialServer);
            setLoading(true);
        }

        window.addEventListener('storage', handleStorageChange);

        // CRITICAL: Also listen to custom event for same-tab changes
        const handleCustomServerChange = (e: CustomEvent) => {
            console.log('Custom server change event:', e.detail.server);
            const newServer = e.detail.server;
            if (newServer !== currentServer) {
                setCurrentServer(newServer);
                setLoading(true);
            }
        };

        window.addEventListener('serverChanged', handleCustomServerChange as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('serverChanged', handleCustomServerChange as EventListener);
        };
    }, [currentServer]);

    return (
        <PlayerStatsContext.Provider value={{
            playerStats,
            pollid,
            isVip,
            loading,
            error,
            currentServer,
            refreshStats,
            updatePollid,
            setPollidAmount
        }}>
            {children}
        </PlayerStatsContext.Provider>
    );
};