// src/pages/FightClubPage.tsx - ENHANCED WITH PAGINATION
import React, {useState, useEffect, useMemo, useCallback} from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { useToast } from '../contexts/ToastContext';
import {
    checkFightClubRequirements,
    getEligiblePlayersWithPagination,
    FightClubPaginatedResult,
    clearFightClubCache
} from '../services/FightClubService';
import { FightClubRequirements, FightClubOpponents, FightResultModal } from '../components/fightclub';
import { FightResult } from '../services/FightService';
import '../styles/pages/FightClub.css';

const FIGHTS_PER_HOUR = 5;
const FIGHT_RESET_INTERVAL = 60 * 60 * 1000;

const FightClubPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { playerStats, loading, refreshStats } = usePlayerStats();
    const { showToast } = useToast();

    // Pagination state
    const [paginatedData, setPaginatedData] = useState<FightClubPaginatedResult>({
        players: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingPlayers, setLoadingPlayers] = useState(false);

    // Fight modal state
    const [fightResult, setFightResult] = useState<FightResult | null>(null);
    const [showFightModal, setShowFightModal] = useState(false);
    const [timeUntilResetDisplay, setTimeUntilResetDisplay] = useState<string>('');

    // Calculate remaining fights
    const fightsRemaining = useMemo(() => {
        if (!playerStats?.fightClubData) {
            return FIGHTS_PER_HOUR;
        }

        const now = Date.now();
        const lastReset = playerStats.fightClubData.lastResetTime?.toMillis() || 0;

        if (now - lastReset >= FIGHT_RESET_INTERVAL) {
            return FIGHTS_PER_HOUR;
        }

        return playerStats.fightClubData.remainingFights ?? FIGHTS_PER_HOUR;
    }, [playerStats]);

    // Update timer display every second
    useEffect(() => {
        if (!playerStats?.fightClubData?.lastResetTime || fightsRemaining > 0) {
            setTimeUntilResetDisplay('');
            return;
        }

        const updateTimer = () => {
            const lastReset = playerStats.fightClubData!.lastResetTime!.toMillis();
            const nextReset = lastReset + FIGHT_RESET_INTERVAL;
            const now = Date.now();
            const timeLeft = Math.max(0, nextReset - now);

            if (timeLeft === 0) {
                refreshStats();
                return;
            }

            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            setTimeUntilResetDisplay(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [playerStats, fightsRemaining, refreshStats]);

    // Load paginated opponents
    const loadOpponents = useCallback(async (page: number) => {
        if (!playerStats || !currentUser) return;

        const requirements = checkFightClubRequirements(playerStats);
        if (!requirements.eligible) return;

        setLoadingPlayers(true);
        try {
            const data = await getEligiblePlayersWithPagination(currentUser.uid, page);
            setPaginatedData(data);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error loading opponents:', error);
            showToast('Viga vastaste laadimisel', 'error');
        } finally {
            setLoadingPlayers(false);
        }
    }, [playerStats, currentUser, showToast]);

// Load opponents on initial load
    useEffect(() => {
        if (playerStats && currentUser) {
            loadOpponents(1);
        }
    }, [playerStats, currentUser, loadOpponents]);

    // Handle fight completion
    const handleFightComplete = async (result: FightResult) => {
        setFightResult(result);
        setShowFightModal(true);

        // Refresh player stats
        await refreshStats();

        // Clear fight club cache and reload current page
        if (currentUser) {
            clearFightClubCache(currentUser.uid);
            await loadOpponents(currentPage);
        }
    };

    // Handle page changes
    const handlePageChange = async (newPage: number) => {
        if (newPage >= 1 && newPage <= paginatedData.totalPages) {
            await loadOpponents(newPage);
        }
    };

    // Check if can fight
    const canFight = fightsRemaining > 0;

    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <div className="page-content">
                    <div className="fight-club-container">
                        <div className="loading">Laadin võitlusklubi...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!playerStats) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <div className="page-content">
                    <div className="fight-club-container">
                        <div className="error">Viga andmete laadimisel</div>
                    </div>
                </div>
            </div>
        );
    }

    const requirements = checkFightClubRequirements(playerStats);

    return (
        <div className="page">
            <AuthenticatedHeader />
            <div className="page-content">
                <div className="fight-club-container">
                    <button
                        className="back-to-dashboard"
                        onClick={() => navigate('/dashboard')}
                    >
                        ← Tagasi töölauale
                    </button>

                    <h1 className="fight-club-title">🥊 Võitlusklubi</h1>

                    {/* Fight limit display */}
                    {requirements.eligible && (
                        <div className="fight-limit-card">
                            <div className="fight-limit-header">
                                <h3>Võitluste limiit</h3>
                            </div>
                            <div className="fight-limit-content">
                                <div className="fights-visual">
                                    {[...Array(FIGHTS_PER_HOUR)].map((_, index) => (
                                        <div
                                            key={index}
                                            className={`fight-slot ${index < fightsRemaining ? 'available' : 'used'}`}
                                        >
                                            {index < fightsRemaining ? '🥊' : '❌'}
                                        </div>
                                    ))}
                                </div>
                                <div className="fights-text">
                                    <span className="fights-count">
                                        {fightsRemaining} / {FIGHTS_PER_HOUR} võitlust kasutada
                                    </span>
                                    {!canFight && timeUntilResetDisplay && (
                                        <span className="reset-timer">
                                            Taastub: {timeUntilResetDisplay}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {!canFight && (
                                <div className="fight-limit-warning">
                                    ⏳ Oled kasutanud kõik võitlused selleks tunniks. Oota taastumist!
                                </div>
                            )}
                        </div>
                    )}

                    {!requirements.eligible ? (
                        <FightClubRequirements
                            playerStats={playerStats}
                            onNavigateToTraining={() => navigate('/training')}
                        />
                    ) : (
                        <FightClubOpponents
                            playerStats={playerStats}
                            paginatedData={paginatedData}
                            loadingPlayers={loadingPlayers}
                            onFightComplete={handleFightComplete}
                            onPageChange={handlePageChange}
                            canFight={canFight}
                        />
                    )}

                    <FightResultModal
                        isOpen={showFightModal}
                        fightResult={fightResult}
                        onClose={() => {
                            setShowFightModal(false);
                            setFightResult(null);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default FightClubPage;