// src/components/fightclub/FightClubOpponents.tsx
import React, { useState } from 'react';
import { PlayerStats } from '../../types';
import { EligiblePlayer } from '../../services/FightClubService';
import { FightResult, FightParticipant, executeFight } from '../../services/FightService';
import { FightHistory } from './FightHistory';
import { processFightResult } from '../../services/FightTransactionService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { doc, getDoc } from 'firebase/firestore';
import { calculatePotentialReward} from "../../services/FightService";
import { firestore } from '../../config/firebase';
import '../../styles/components/fightclub/FightClubOpponents.css';

interface FightClubOpponentsProps {
    playerStats: PlayerStats;
    eligiblePlayers: EligiblePlayer[];
    loadingPlayers: boolean;
    onFightComplete: (result: FightResult) => void;
}

export const FightClubOpponents: React.FC<FightClubOpponentsProps> = ({
                                                                          playerStats,
                                                                          eligiblePlayers,
                                                                          loadingPlayers,
                                                                          onFightComplete
                                                                      }) => {
    const {currentUser} = useAuth();
    const {showToast} = useToast();
    const [fightingWith, setFightingWith] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);

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

    const handleFight = async (opponent: EligiblePlayer) => {
        if (!playerStats || !currentUser || fightingWith) return;

        // Check if player has enough health (5 HP required)
        if (playerStats.health && playerStats.health.current < 5) {
            showToast('❤️ Sul pole piisavalt tervist võitlemiseks! Vajalik vähemalt 5 HP.', 'error');
            return;
        }

        setFightingWith(opponent.userId);

        try {
            // Get current user's username
            const currentUsername = await getCurrentUsername();

            // Prepare fight participants with real data
            const player1: FightParticipant = {
                userId: currentUser.uid,
                username: currentUsername,
                level: playerStats.level,
                attributes: {
                    strength: playerStats.attributes?.strength?.level || 0,
                    agility: playerStats.attributes?.agility?.level || 0,
                    dexterity: playerStats.attributes?.dexterity?.level || 0,
                    endurance: playerStats.attributes?.endurance?.level || 0,
                    intelligence: playerStats.attributes?.intelligence?.level || 0,
                }
            };

            const player2: FightParticipant = {
                userId: opponent.userId,
                username: opponent.username,
                level: opponent.level,
                attributes: opponent.attributes
            };

            // Calculate the fight
            const result = await executeFight(
                currentUser.uid,
                player1,
                player2
            );

            // Process the transaction (money, stats, history, AND health reduction)
            const transactionResult = await processFightResult(
                currentUser.uid,
                currentUsername,
                opponent.userId,
                opponent.username,
                result
            );

            // In the handleFight function - update the toast messages:
            if (transactionResult.success) {
                // Refresh player stats to show updated health and money
                await onFightComplete(result);

                // Show result toast with dynamic health cost
                if (result.winner === 'player1') {
                    showToast(
                        `🏆 Võitsid ${opponent.username} vastu! +${result.moneyWon}€ | -5 HP`,
                        'success'
                    );
                } else {
                    showToast(
                        `😞 Kaotasid ${opponent.username} vastu. | -15 HP`,
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

    return (
        <div className="fight-club-content">
            <div className="welcome-message">
                <span className="welcome-icon">🏆</span>
                <h2>Tere tulemast võitlusklubisse!</h2>
                <p>Sa vastad kõikidele nõuetele. Vali vastane ja alusta võitlust!</p>

                <div className="welcome-actions">
                    <button
                        className="history-button"
                        onClick={() => setShowHistory(true)}
                    >
                        📊 Vaata võitluste ajalugu
                    </button>
                </div>
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
                <h3>Võimalikud vastased:</h3>

                {loadingPlayers ? (
                    <div className="loading-players">Laadin mängijaid...</div>
                ) : eligiblePlayers.length === 0 ? (
                    <div className="no-opponents">
                        <p>Hetkel pole teisi sobivaid vastaseid võitlusklubis.</p>
                        <p>Proovi hiljem uuesti!</p>
                    </div>
                ) : (
                    <div className="opponents-list">
                        {eligiblePlayers.map(player => {
                            const hasEnoughHealth = playerStats.health && playerStats.health.current >= 5;
                            const potentialReward = calculatePotentialReward(playerStats.level, player.level);
                            const levelDiff = player.level - playerStats.level;

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

                                        {/* Reward preview section */}
                                        <div className="reward-preview">
                                            <span className="reward-label">Võimalik võit:</span>
                                            <span className={`reward-amount ${
                                                levelDiff > 0 ? 'bonus-reward' :
                                                    levelDiff < -5 ? 'penalty-reward' : ''
                                            }`}>
                                            ~{potentialReward.reward}€
                                                {levelDiff !== 0 && (
                                                    <span className="reward-percentage">
                                                    ({potentialReward.percentage})
                                                </span>
                                                )}
                                        </span>
                                        </div>

                                        {/* Health cost indicator */}
                                        <div className="fight-cost">
                                            <span className="cost-label">Vigastus:</span>
                                            <span className={`cost-value ${!hasEnoughHealth ? 'insufficient' : ''}`}>
                                                5-15 HP
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        className="fight-button"
                                        onClick={() => handleFight(player)}
                                        disabled={fightingWith === player.userId || !hasEnoughHealth}
                                        title={!hasEnoughHealth ? 'Vajalik vähemalt 5 HP võitlemiseks' : ''}
                                    >
                                        {fightingWith === player.userId ? '⚔️ Võitleb...' :
                                            !hasEnoughHealth ? '❤️ Liiga vähe HP' : '⚔️ Võitle'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <FightHistory
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
            />
        </div>
    );
}