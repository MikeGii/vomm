// src/contexts/PlayerStatsContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';
import { useAuth } from './AuthContext';
import { initializePlayerStats } from '../services/PlayerService';

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

    // Manual refresh function if needed
    const refreshStats = async () => {
        if (!currentUser) return;

        try {
            const stats = await initializePlayerStats(currentUser.uid);
            setPlayerStats(stats);
        } catch (err) {
            console.error('Error refreshing stats:', err);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            setPlayerStats(null);
            setLoading(false);
            return;
        }

        let unsubscribe: (() => void) | undefined;

        const setupListener = async () => {
            try {
                // Initialize stats first (creates document if needed for new users)
                await initializePlayerStats(currentUser.uid);

                // Set up the real-time listener
                const statsRef = doc(firestore, 'playerStats', currentUser.uid);

                unsubscribe = onSnapshot(
                    statsRef,
                    (doc) => {
                        if (doc.exists()) {
                            const stats = doc.data() as PlayerStats;
                            setPlayerStats(stats);
                            setError(null);
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
            } catch (err) {
                console.error('Failed to setup stats listener:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
                setLoading(false);
            }
        };

        setupListener();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [currentUser]);

    return (
        <PlayerStatsContext.Provider value={{ playerStats, loading, error, refreshStats }}>
            {children}
        </PlayerStatsContext.Provider>
    );
};