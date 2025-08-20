// src/components/fightclub/FightHistory.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPlayerFightHistory, FightRecord } from '../../services/FightTransactionService';
import '../../styles/components/fightclub/FightHistory.css';

interface FightHistoryProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FightHistory: React.FC<FightHistoryProps> = ({ isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const [allFightHistory, setAllFightHistory] = useState<FightRecord[]>([]); // Store ALL fights
    const [displayedFights, setDisplayedFights] = useState<FightRecord[]>([]); // Current page fights
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const fightsPerPage = 20;

    const loadFightHistory = useCallback(async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            // Load all fights (or a reasonable maximum like 500)
            const history = await getPlayerFightHistory(currentUser.uid, 500);
            setAllFightHistory(history);

            // Set first page
            const startIndex = 0;
            const endIndex = fightsPerPage;
            setDisplayedFights(history.slice(startIndex, endIndex));
            setCurrentPage(1);
        } catch (error) {
            console.error('Error loading fight history:', error);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (isOpen && currentUser) {
            loadFightHistory();
        }
    }, [isOpen, currentUser, loadFightHistory]);

    const handlePageChange = (page: number) => {
        const startIndex = (page - 1) * fightsPerPage;
        const endIndex = startIndex + fightsPerPage;
        setDisplayedFights(allFightHistory.slice(startIndex, endIndex));
        setCurrentPage(page);
    };

    const formatDate = (timestamp: any) => {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffTime / (1000 * 60));

        // More compact format for mobile
        if (diffMinutes < 60) {
            return `${diffMinutes} min tagasi`;
        } else if (diffHours < 24) {
            return `${diffHours}h tagasi`;
        } else if (diffDays === 1) {
            return 'Eile';
        } else if (diffDays < 7) {
            return `${diffDays}p tagasi`;
        } else {
            return date.toLocaleDateString('et-EE', {
                day: '2-digit',
                month: '2-digit'
            });
        }
    };

    const getOpponentName = (fight: FightRecord): string => {
        return fight.player1Id === currentUser?.uid ? fight.player2Username : fight.player1Username;
    };

    const isWinner = (fight: FightRecord): boolean => {
        return fight.winnerId === currentUser?.uid;
    };

    // Calculate TOTAL stats from ALL fights
    const totalWins = allFightHistory.filter(f => isWinner(f)).length;
    const totalLosses = allFightHistory.filter(f => !isWinner(f)).length;
    const totalPages = Math.ceil(allFightHistory.length / fightsPerPage);

    if (!isOpen) return null;

    return (
        <div className="fight-history-overlay" onClick={onClose}>
            <div className="fight-history-modal" onClick={(e) => e.stopPropagation()}>
                <div className="fight-history-header">
                    <h2>📊 Võitluste Ajalugu</h2>
                    <button className="close-modal" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="fight-history-content">
                    {loading ? (
                        <div className="loading">Laadin ajalugu...</div>
                    ) : allFightHistory.length === 0 ? (
                        <div className="no-history">
                            <p>Sul pole veel ühtegi võitlust tehtud.</p>
                            <p>Mine tagasi ja kutsu keegi võitlusele!</p>
                        </div>
                    ) : (
                        <>
                            {/* Compact table for desktop and mobile */}
                            <div className="history-table-container">
                                <table className="history-table">
                                    <thead>
                                    <tr>
                                        <th className="th-result">TULEMUS</th>
                                        <th className="th-opponent">VASTANE</th>
                                        <th className="th-reward">VÕIT</th>
                                        <th className="th-time">AEG</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {displayedFights.map((fight, index) => {
                                        const won = isWinner(fight);
                                        const opponentName = getOpponentName(fight);

                                        return (
                                            <tr key={fight.fightId || index} className={won ? 'row-won' : 'row-lost'}>
                                                <td className="td-result">
                                                        <span className={`result-badge ${won ? 'badge-won' : 'badge-lost'}`}>
                                                            {won ? 'V' : 'K'}
                                                        </span>
                                                </td>
                                                <td className="td-opponent">
                                                    <span className="opponent-name-compact">{opponentName}</span>
                                                </td>
                                                <td className="td-reward">
                                                    {won && fight.moneyTransferred > 0 ? (
                                                        <span className="money-amount">+{fight.moneyTransferred}€</span>
                                                    ) : (
                                                        <span className="money-none">-</span>
                                                    )}
                                                </td>
                                                <td className="td-time">
                                                    <span className="time-text">{formatDate(fight.fightTimestamp)}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="page-btn"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        ‹
                                    </button>

                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                        let pageNum: number;

                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={i}
                                                className={`page-btn ${pageNum === currentPage ? 'active' : ''}`}
                                                onClick={() => handlePageChange(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        className="page-btn"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        ›
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Summary stats - shows TOTAL stats from ALL fights */}
                {allFightHistory.length > 0 && (
                    <div className="fight-history-stats">
                        <div className="stat-compact">
                            <span className="stat-label">VÕITE:</span>
                            <span className="stat-value won">{totalWins}</span>
                        </div>
                        <div className="stat-compact">
                            <span className="stat-label">KAOTUSI:</span>
                            <span className="stat-value lost">{totalLosses}</span>
                        </div>
                        <div className="stat-compact">
                            <span className="stat-label">LEHEKÜLG:</span>
                            <span className="stat-value">{currentPage}/{totalPages}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};