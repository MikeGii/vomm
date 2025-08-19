// src/components/fightclub/FightHistory.tsx
import React, {useState, useEffect, useCallback} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPlayerFightHistory, FightRecord } from '../../services/FightTransactionService';

interface FightHistoryProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FightHistory: React.FC<FightHistoryProps> = ({ isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const [fightHistory, setFightHistory] = useState<FightRecord[]>([]);
    const [loading, setLoading] = useState(false);

    const loadFightHistory = useCallback(async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            const history = await getPlayerFightHistory(currentUser.uid, 20);
            setFightHistory(history);
        } catch (error) {
            console.error('Error loading fight history:', error);
        } finally {
            setLoading(false);
        }
    }, [currentUser]); // Dependencies: only currentUser

    useEffect(() => {
        if (isOpen && currentUser) {
            loadFightHistory();
        }
    }, [isOpen, currentUser, loadFightHistory]);

    const formatDate = (timestamp: any) => {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('et-EE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getOpponentName = (fight: FightRecord): string => {
        return fight.player1Id === currentUser?.uid ? fight.player2Username : fight.player1Username;
    };

    const isWinner = (fight: FightRecord): boolean => {
        return fight.winnerId === currentUser?.uid;
    };

    const getPlayerScore = (fight: FightRecord): string => {
        if (fight.player1Id === currentUser?.uid) {
            return `${fight.player1Score} - ${fight.player2Score}`;
        } else {
            return `${fight.player2Score} - ${fight.player1Score}`;
        }
    };

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
                    ) : fightHistory.length === 0 ? (
                        <div className="no-history">
                            <p>Sul pole veel ühtegi võitlust tehtud.</p>
                            <p>Mine tagasi ja kutsu keegi võitlusele!</p>
                        </div>
                    ) : (
                        <div className="history-list">
                            {fightHistory.map((fight, index) => (
                                <div key={fight.fightId || index} className={`history-item ${isWinner(fight) ? 'won' : 'lost'}`}>
                                    <div className="fight-basic-info">
                                        <div className="fight-opponent">
                                            <span className="result-icon">
                                                {isWinner(fight) ? '🏆' : '😞'}
                                            </span>
                                            <span className="opponent-name">
                                                vs {getOpponentName(fight)}
                                            </span>
                                        </div>

                                        <div className="fight-details">
                                            <span className="fight-score">{getPlayerScore(fight)}</span>
                                            <span className="fight-rounds">({fight.rounds} voorud)</span>
                                        </div>

                                        <div className="fight-meta">
                                            {isWinner(fight) && fight.moneyTransferred > 0 && (
                                                <span className="money-won">+{fight.moneyTransferred}€</span>
                                            )}
                                            <span className="fight-date">{formatDate(fight.fightTimestamp)}</span>
                                        </div>
                                    </div>

                                    <div className="fight-result">
                                        <span className={`result-text ${isWinner(fight) ? 'won' : 'lost'}`}>
                                            {isWinner(fight) ? 'VÕIT' : 'KAOTUS'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {fightHistory.length > 0 && (
                    <div className="fight-history-footer">
                        <div className="fight-stats">
                            <div className="stat-item">
                                <span className="stat-label">Kokku võitlusi:</span>
                                <span className="stat-value">{fightHistory.length}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Võite:</span>
                                <span className="stat-value won">
                                    {fightHistory.filter(f => isWinner(f)).length}
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Kaotusi:</span>
                                <span className="stat-value lost">
                                    {fightHistory.filter(f => !isWinner(f)).length}
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Võidumäär:</span>
                                <span className="stat-value">
                                    {fightHistory.length > 0
                                        ? Math.round((fightHistory.filter(f => isWinner(f)).length / fightHistory.length) * 100)
                                        : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};