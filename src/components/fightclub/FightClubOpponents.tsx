// src/components/fightclub/FightClubOpponents.tsx - ENHANCED WITH PAGINATION
import React, { useState } from 'react';
import { PlayerStats } from '../../types';
import { FightClubPaginatedResult } from '../../services/FightClubService';
import { FightResult, FightParticipant, executeFight } from '../../services/FightService';
import { processFightResult } from '../../services/FightTransactionService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { doc, getDoc } from 'firebase/firestore';
import { calculatePotentialReward} from "../../services/FightService";
import { firestore } from '../../config/firebase';
import '../../styles/components/fightclub/FightClubOpponents.css';

interface FightClubOpponentsProps {
    playerStats: PlayerStats;
    paginatedData: FightClubPaginatedResult;
    loadingPlayers: boolean;
    onFightComplete: (result: FightResult) => void;
    onPageChange: (page: number) => void;
    canFight: boolean;
}

export const FightClubOpponents: React.FC<FightClubOpponentsProps> = ({
                                                                          playerStats,
                                                                          paginatedData,
                                                                          loadingPlayers,
                                                                          onFightComplete,
                                                                          onPageChange,
                                                                          canFight
                                                                      }) => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const [fightingWith, setFightingWith] = useState<string | null>(null);

    // Get current user's username
    const getCurrentUsername = async (): Promise<string> => {
        if (!currentUser) return 'Tundmatu';

        try {
            const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
            if (userDoc.exists()) {
                return userDoc.data().username || 'Tundmatu';
            }
        } catch (error) {
            console.error('Error fetching current user username:', error);
        }
        return 'Tundmatu';
    };

    const handleFight = async (opponent: any) => {
        if (!playerStats || !currentUser || fightingWith || !canFight) return;

        // Check if player has enough health (5 HP required)
        if (playerStats.health && playerStats.health.current < 5) {
            showToast('❤️ Sul pole piisavalt tervist võitlemiseks! Vajalik vähemalt 5 HP.', 'error');
            return;
        }

        setFightingWith(opponent.userId);

        try {
            const currentUsername = await getCurrentUsername();

            // Prepare fight participants
            const attackerData: FightParticipant = {
                userId: currentUser.uid,
                username: currentUsername,
                level: playerStats.level,
                attributes: {
                    strength: playerStats.attributes?.strength?.level || 0,
                    agility: playerStats.attributes?.agility?.level || 0,
                    dexterity: playerStats.attributes?.dexterity?.level || 0,
                    endurance: playerStats.attributes?.endurance?.level || 0,
                    intelligence: playerStats.attributes?.intelligence?.level || 0
                }
            };

            const defenderData: FightParticipant = {
                userId: opponent.userId,
                username: opponent.username,
                level: opponent.level,
                attributes: opponent.attributes
            };

            showToast(`⚔️ Alustasid võitlust kasutajaga ${opponent.username}!`, 'info');

            // Execute fight
            const fightResult = await executeFight(currentUser.uid, attackerData, defenderData);

            // Process fight result (update database)
            const transactionResult = await processFightResult(
                currentUser.uid,
                opponent.userId,
                fightResult
            );

            if (transactionResult.success) {
                onFightComplete(fightResult);

                // Show result notification
                if (fightResult.winner === 'player1') {
                    showToast(
                        `🏆 Võitsid! +${fightResult.moneyWon}€ | -5 HP`,
                        'success'
                    );
                } else {
                    showToast(
                        `😔 Kaotasid võitluse kasutajaga ${opponent.username} | -15 HP`,
                        'error'
                    );
                }
            } else {
                showToast(`Viga: ${transactionResult.message}`, 'error');
            }

        } catch (error: any) {
            console.error('Fight error:', error);

            // Show more specific error messages
            if (error.message && error.message.includes('tervist')) {
                showToast(error.message, 'error');
            } else {
                showToast('Viga võitluse läbiviimisel!', 'error');
            }
        } finally {
            setFightingWith(null);
        }
    };

    const { players, totalCount, currentPage, totalPages, hasNextPage, hasPreviousPage } = paginatedData;

    return (
        <div className="fight-club-content">
            <div className="welcome-message">
                <span className="welcome-icon">🏆</span>
                <h2>Tere tulemast võitlusklubisse!</h2>
                <p>Sa vastad kõikidele nõuetele. Vali vastane ja alusta võitlust!</p>
            </div>

            {/* Health warning if health is low */}
            {playerStats.health && playerStats.health.current < 20 && (
                <div className="health-warning">
                    <span className="warning-icon">⚠️</span>
                    <div className="warning-content">
                        <strong>Madal tervis!</strong>
                        <p>Sul on {playerStats.health.current}/{playerStats.health.max} HP</p>
                        <p>Võit: -5 HP | Kaotus: -15 HP (vajalik vähemalt 5 HP)</p>
                        <p>Tervis taastub 5 HP tunnis või kasuta meditsiinivarustust.</p>
                    </div>
                </div>
            )}

            <div className="opponents-section">
                <div className="opponents-header">
                    <h3>Võimalikud vastased:</h3>
                    {!loadingPlayers && players.length > 0 && (
                        <div className="opponents-count">
                            Kokku {totalCount} vastast
                        </div>
                    )}
                </div>

                {loadingPlayers ? (
                    <div className="loading-players">Laadin mängijaid...</div>
                ) : players.length === 0 ? (
                    <div className="no-opponents">
                        <p>Hetkel pole teisi sobivaid vastaseid võitlusklubis.</p>
                        <p>Proovi hiljem uuesti!</p>
                    </div>
                ) : (
                    <>
                        <div className="opponents-list">
                            {players.map(player => {
                                const hasEnoughHealth = playerStats.health && playerStats.health.current >= 5;
                                const potentialRewardData = calculatePotentialReward(playerStats.level, player.level);
                                const potentialReward = potentialRewardData.reward;
                                const levelDiff = player.level - playerStats.level;
                                const isFighting = fightingWith === player.userId;
                                const winRate = player.wins + player.losses > 0
                                    ? Math.round((player.wins / (player.wins + player.losses)) * 100)
                                    : 0;

                                return (
                                    <div key={player.userId} className="opponent-card">
                                        <div className="opponent-info">
                                            <div className="opponent-header">
                                                <span className="opponent-name">{player.username}</span>
                                                <span className={`opponent-level ${
                                                    levelDiff > 0 ? 'higher-level' :
                                                        levelDiff < 0 ? 'lower-level' :
                                                            'same-level'
                                                }`}>
                                                    Tase {player.level}
                                                    {levelDiff !== 0 && (
                                                        <span className="level-diff">
                                                            {levelDiff > 0 ? `(+${levelDiff})` : `(${levelDiff})`}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>

                                            {/* Fight statistics */}
                                            <div className="fight-stats">
                                                <span className="stats-label">Statistika:</span>
                                                <span className="wins">{player.wins}V</span>
                                                <span className="losses">{player.losses}K</span>
                                                {player.wins + player.losses > 0 && (
                                                    <span className="win-rate">({winRate}%)</span>
                                                )}
                                            </div>

                                            {/* Reward preview section */}
                                            <div className="reward-preview">
                                                <span className="reward-label">Võimalik võit:</span>
                                                <span className={`reward-amount ${
                                                    levelDiff > 0 ? 'bonus-reward' :
                                                        levelDiff < -5 ? 'penalty-reward' : ''
                                                }`}>
                                                +{potentialReward}€
                                                    {levelDiff !== 0 && (
                                                        <span className="reward-percentage">
                                                        {` (${potentialRewardData.percentage})`}
                                                    </span>
                                                    )}
                                            </span>
                                            </div>

                                            {/* Health cost indicator */}
                                            <div className="fight-cost">
                                                <span>Tervise kulu:</span>
                                                <span className={`cost-value ${
                                                    !hasEnoughHealth ? 'insufficient' : ''
                                                }`}>
                                                    Võit: -5 HP | Kaotus: -15 HP
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            className="fight-button"
                                            onClick={() => handleFight(player)}
                                            disabled={!hasEnoughHealth || !canFight || isFighting}
                                        >
                                            {isFighting ? '⚔️ Võitleb...' :
                                                !hasEnoughHealth ? '❤️ Pole tervist' :
                                                    !canFight ? '⏳ Ei saa võidelda' :
                                                        '⚔️ Võitle'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="pagination-controls">
                                <button
                                    className="pagination-btn"
                                    onClick={() => onPageChange(1)}
                                    disabled={currentPage === 1 || loadingPlayers}
                                >
                                    ««
                                </button>
                                <button
                                    className="pagination-btn"
                                    onClick={() => onPageChange(currentPage - 1)}
                                    disabled={!hasPreviousPage || loadingPlayers}
                                >
                                    ‹
                                </button>

                                <div className="pagination-info">
                                    <span className="page-numbers">
                                        Lehekülg {currentPage} / {totalPages}
                                    </span>
                                    <span className="total-count">
                                        ({totalCount} vastast)
                                    </span>
                                </div>

                                <button
                                    className="pagination-btn"
                                    onClick={() => onPageChange(currentPage + 1)}
                                    disabled={!hasNextPage || loadingPlayers}
                                >
                                    ›
                                </button>
                                <button
                                    className="pagination-btn"
                                    onClick={() => onPageChange(totalPages)}
                                    disabled={currentPage === totalPages || loadingPlayers}
                                >
                                    »»
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};