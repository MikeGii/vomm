// src/pages/CasinoPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { CasinoCounter } from '../components/casino/CasinoCounter';
import { CasinoLeaderboard } from '../components/casino/CasinoLeaderboard';
import { SlotMachine } from '../components/casino/SlotMachine';
import {
    getRemainingCasinoPlays,
    playSlotMachine,
    SlotResult,
    checkAndResetCasinoData
} from '../services/CasinoService';
import '../styles/pages/Casino.css';

const CasinoPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const { playerStats, loading } = usePlayerStats(); // No need for refreshStats!
    const [isPlaying, setIsPlaying] = useState(false);
    const [shouldRefreshLeaderboard, setShouldRefreshLeaderboard] = useState(false);

    // Track if we've checked reset this hour
    const lastResetCheck = useRef<string>('');

    // Check and reset casino data only when hour changes
    useEffect(() => {
        if (!playerStats || !currentUser) return;

        const currentHourKey = `${new Date().toDateString()}-${new Date().getHours()}`;

        // Only check once per hour
        if (lastResetCheck.current !== currentHourKey) {
            lastResetCheck.current = currentHourKey;

            // Check if reset is needed
            checkAndResetCasinoData(currentUser.uid, playerStats)
                .then(resetOccurred => {
                    if (resetOccurred) {
                        console.log('Casino data reset for new hour');
                        // No need to refresh - onSnapshot will handle it!
                    }
                })
                .catch(error => {
                    console.error('Error checking casino reset:', error);
                });
        }
    }, [playerStats, currentUser]);

    const handleSlotPlay = async (betAmount: number): Promise<SlotResult> => {
        if (!currentUser || !playerStats) {
            throw new Error('Mängija ei leitud');
        }

        setIsPlaying(true);

        try {
            // Play the game - database update will trigger onSnapshot
            const { gameResult } = await playSlotMachine(
                currentUser.uid,
                playerStats,
                betAmount
            );

            // Show result messages
            if (gameResult.isWin) {
                showToast(
                    `🎉 Võitsid ${gameResult.winAmount}€! (x${gameResult.multiplier})`,
                    'success'
                );
                // Trigger leaderboard refresh on win
                setShouldRefreshLeaderboard(prev => !prev);
            } else {
                showToast(`😞 Kaotasid ${betAmount}€. Maine -5`, 'warning');
            }

            // Stats will auto-update via onSnapshot listener!
            return gameResult;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Viga mängimisel';
            showToast(errorMessage, 'error');
            throw error;
        } finally {
            setIsPlaying(false);
        }
    };

    const handleLeaderboardRefresh = () => {
        showToast('Edetabel värskendatud!', 'info');
    };

    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <div className="page-content">
                    <div className="casino-container">
                        <div className="loading">Laadin kasiinot...</div>
                    </div>
                </div>
            </div>
        );
    }

    const remainingPlays = playerStats ? getRemainingCasinoPlays(playerStats) : 5;
    const canPlay = remainingPlays > 0 && !isPlaying;

    return (
        <div className="page">
            <AuthenticatedHeader />
            <div className="page-content">
                <div className="casino-container">
                    <button
                        className="back-to-dashboard"
                        onClick={() => navigate('/dashboard')}
                    >
                        ← Tagasi töölauale
                    </button>

                    <div className="casino-warning">
                        <span className="warning-icon">⚠️</span>
                        <p className="warning-text">
                            Kasiinos mängimine ei ole politseiametnikule kohane ning iga mängija vastutab ise oma tegevuste eest.
                            Samuti kahjustab kasiinos mängimine mainet ja seeläbi on lubatud kasiinos mängida kuni 5 korda tunnis.
                        </p>
                    </div>

                    {playerStats && (
                        <CasinoCounter remainingPlays={remainingPlays} />
                    )}

                    <h1 className="casino-title">🎰 Kasiino</h1>
                    <div className="casino-content">
                        <p className="casino-description">
                            Tere tulemast kasiino! Proovi õnne slotiautomaadi mänguga.
                        </p>

                        {currentUser && (
                            <CasinoLeaderboard
                                currentUserId={currentUser.uid}
                                onRefresh={handleLeaderboardRefresh}
                                key={shouldRefreshLeaderboard ? 'refresh' : 'normal'}
                            />
                        )}

                        {playerStats && (
                            <SlotMachine
                                onPlay={handleSlotPlay}
                                playerMoney={playerStats.money}
                                playerStats={playerStats}
                                isPlaying={isPlaying}
                                canPlay={canPlay}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CasinoPage;