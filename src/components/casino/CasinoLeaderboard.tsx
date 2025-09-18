// src/components/casino/CasinoLeaderboard.tsx
import React, { useEffect, useState } from 'react';
import { CasinoLeaderboardEntry } from '../../types/casino.types';
import { getUniversalLeaderboard, MONTHLY_REWARDS } from '../../services/CasinoLeaderboardService';
import { formatMoney } from '../../utils/currencyUtils';
import '../../styles/components/casino/CasinoLeaderboard.css';

interface CasinoLeaderboardProps {
    currentUserId?: string;
    onRefresh?: () => void;
}

export const CasinoLeaderboard: React.FC<CasinoLeaderboardProps> = ({
                                                                        currentUserId,
                                                                        onRefresh
                                                                    }) => {
    const [leaderboard, setLeaderboard] = useState<CasinoLeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const loadLeaderboard = async (forceRefresh: boolean = false) => {
        try {
            setLoading(true);
            const data = await getUniversalLeaderboard(forceRefresh);
            setLeaderboard(data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeaderboard();

        // Refresh every 5 minutes automatically
        const interval = setInterval(() => {
            loadLeaderboard(false);
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const handleRefresh = () => {
        loadLeaderboard(true);
        if (onRefresh) {
            onRefresh();
        }
    };

    const getPositionIcon = (position: number) => {
        switch (position) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `${position}.`;
        }
    };

    const getPositionClass = (position: number) => {
        switch (position) {
            case 1: return 'gold';
            case 2: return 'silver';
            case 3: return 'bronze';
            default: return '';
        }
    };

    return (
        <div className="casino-leaderboard">
            <div className="casino-leaderboard-header">
                <h3>🏆 Kasiino Edetabel</h3>
                <button
                    className="casino-leaderboard-refresh-btn"
                    onClick={handleRefresh}
                    disabled={loading}
                    title="Värskenda"
                >
                    🔄
                </button>
            </div>

            <div className="casino-leaderboard-rewards">
                <div className="casino-leaderboard-rewards-title">📅 Igakuised Auhinnad (jooksva kuu võitude põhjal):</div>
                <div className="casino-leaderboard-rewards-list">
                    {MONTHLY_REWARDS.map(reward => (
                        <div key={reward.position} className={`casino-leaderboard-reward-item ${getPositionClass(reward.position)}`}>
                            <span className="casino-leaderboard-reward-position">{getPositionIcon(reward.position)}</span>
                            <span className="casino-leaderboard-reward-amount">{reward.reward} pollid</span>
                        </div>
                    ))}
                </div>
                <div className="casino-leaderboard-rewards-note">
                    Auhinnad jagatakse kuu viimasel päeval jooksva kuu võitude põhjal!
                </div>
            </div>

            {loading ? (
                <div className="casino-leaderboard-loading">Laadin edetabelit...</div>
            ) : leaderboard.length === 0 ? (
                <div className="casino-leaderboard-empty">
                    <p>Pole veel võite registreeritud.</p>
                    <p>Ole esimene, kes võidab!</p>
                </div>
            ) : (
                <div className="casino-leaderboard-table">
                    <div className="casino-leaderboard-table-header">
                        <div className="casino-leaderboard-col-position">Koht</div>
                        <div className="casino-leaderboard-col-player">Mängija</div>
                        <div className="casino-leaderboard-col-current-month">Jooksva kuu võidud</div>
                        <div className="casino-leaderboard-col-total">Kõik võidud</div>
                        <div className="casino-leaderboard-col-biggest">Suurim võit</div>
                        <div className="casino-leaderboard-col-count">Võite kokku</div>
                    </div>
                    <div className="casino-leaderboard-table-body">
                        {leaderboard.map((entry) => (
                            <div
                                key={entry.userId}
                                className={`casino-leaderboard-table-row ${getPositionClass(entry.position)} ${
                                    entry.userId === currentUserId ? 'current-user' : ''
                                }`}
                            >
                                <div className="casino-leaderboard-col-position">
                                    <span className="casino-leaderboard-position-icon">{getPositionIcon(entry.position)}</span>
                                </div>
                                <div className="casino-leaderboard-col-player">{entry.username}</div>
                                <div className="casino-leaderboard-col-current-month">
                                    {formatMoney(entry.currentMonthWins)}
                                    {entry.currentMonthWinCount > 0 && (
                                        <small> ({entry.currentMonthWinCount})</small>
                                    )}
                                </div>
                                <div className="casino-leaderboard-col-total">{formatMoney(entry.totalWins)}</div>
                                <div className="casino-leaderboard-col-biggest">{formatMoney(entry.biggestWin)}</div>
                                <div className="casino-leaderboard-col-count">{entry.winCount}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="casino-leaderboard-footer">
                <small>Viimati uuendatud: {lastUpdate.toLocaleTimeString('et-EE')}</small>
            </div>
        </div>
    );
};