// src/components/fightclub/FightClubOpponents.tsx
import React, { useState } from 'react';
import { PlayerStats } from '../../types';
import { EligiblePlayer } from '../../services/FightClubService';
import { FightResult, FightParticipant, calculateFight } from '../../services/FightService';
import { FightHistory } from './FightHistory';
import { processFightResult } from '../../services/FightTransactionService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../config/firebase';

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
    const { currentUser } = useAuth();
    const { showToast } = useToast();
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
                attributes: opponent.attributes // Now we have real attributes!
            };

            // Calculate the fight
            const result = calculateFight(player1, player2);

            // Process the transaction (money, stats, history)
            const transactionResult = await processFightResult(
                currentUser.uid,
                currentUsername,
                opponent.userId,
                opponent.username,
                result
            );

            if (transactionResult.success) {
                onFightComplete(result);

                // Show result toast
                if (result.winner === 'player1') {
                    showToast(`🏆 Võitsid ${opponent.username} vastu! +${result.moneyWon}€`, 'success');
                } else {
                    showToast(`😞 Kaotasid ${opponent.username} vastu.`, 'error');
                }
            } else {
                showToast(`Viga: ${transactionResult.message}`, 'error');
            }

        } catch (error) {
            console.error('Fight error:', error);
            showToast('Viga võitluse läbiviimisel!', 'error');
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
                        {eligiblePlayers.map(player => (
                            <div key={player.userId} className="opponent-card">
                                <div className="opponent-info">
                                    <div className="opponent-header">
                                        <span className="opponent-name">{player.username}</span>
                                        <span className="opponent-level">Tase {player.level}</span>
                                    </div>
                                </div>

                                <button
                                    className="fight-button"
                                    onClick={() => handleFight(player)}
                                    disabled={fightingWith === player.userId}
                                >
                                    {fightingWith === player.userId ? 'Võitleb...' : 'Võitle'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <FightHistory
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
            />
        </div>
    );
};