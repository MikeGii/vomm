// src/pages/CasinoPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { CasinoCounter } from '../components/casino/CasinoCounter';
import { SlotMachine } from '../components/casino/SlotMachine';
import { getRemainingCasinoPlays, playSlotMachine, SlotResult } from '../services/CasinoService';
import '../styles/pages/Casino.css';

const CasinoPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const { playerStats, loading, refreshStats } = usePlayerStats();
    const [isPlaying, setIsPlaying] = useState(false);

    // REMOVED: useEffect with onSnapshot listener

    const handleSlotPlay = async (betAmount: number): Promise<SlotResult> => {
        if (!currentUser || !playerStats) {
            throw new Error('Player not found');
        }

        setIsPlaying(true);

        try {
            const { gameResult } = await playSlotMachine(currentUser.uid, playerStats, betAmount);

            if (gameResult.isWin) {
                showToast(`🎉 Võitsid ${gameResult.winAmount}€! (x${gameResult.multiplier})`, 'success');
            } else {
                showToast(`😞 Kaotasid ${betAmount}€. Maine -5`, 'warning');
            }

            await refreshStats(); // Update stats after play
            return gameResult;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Viga mängimisel';
            showToast(errorMessage, 'error');
            throw error;
        } finally {
            setIsPlaying(false);
        }
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