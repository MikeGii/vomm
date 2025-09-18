// src/components/casino/Blackjack.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { useToast } from '../../contexts/ToastContext';
import {
    startBlackjackGame,
    playerHit,
    playerStand,
    playerDoubleDown,
    canPlayBlackjack,
    calculateHandValue,
    completeBlackjackGame
} from '../../services/BlackjackService';
import { Card, BlackjackGameState } from '../../types/blackjack.types';
import '../../styles/components/casino/Blackjack.css';

export const Blackjack: React.FC = () => {
    const { currentUser } = useAuth();
    const { playerStats, loading } = usePlayerStats();
    const { showToast } = useToast();

    const [gameState, setGameState] = useState<BlackjackGameState | null>(null);
    const [deck, setDeck] = useState<Card[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showDealerCards, setShowDealerCards] = useState(false);

    // Check if player can play
    const [canPlay, setCanPlay] = useState(true);
    const [blockReason, setBlockReason] = useState<string>('');

    useEffect(() => {
        if (playerStats) {
            const { canPlay: allowed, reason } = canPlayBlackjack(playerStats);
            setCanPlay(allowed);
            setBlockReason(reason || '');
        }
    }, [playerStats]);

    // Format card display
    const getCardSymbol = (card: Card): string => {
        const suits = {
            'hearts': '♥️',
            'diamonds': '♦️',
            'clubs': '♣️',
            'spades': '♠️'
        };
        return `${card.rank}${suits[card.suit]}`;
    };

    // Start new game
    const handleStartGame = async () => {
        if (!currentUser || !playerStats || !canPlay) return;

        setIsProcessing(true);
        try {
            const { gameState: newGame, updatedStats } = await startBlackjackGame(
                currentUser.uid,
                playerStats
            );

            setGameState(newGame);
            setShowDealerCards(newGame.gameStatus === 'finished');

            // Create a fresh deck for this game
            const newDeck: Card[] = []; // This would be the same deck from service
            setDeck(newDeck);

            if (newGame.result === 'blackjack') {
                showToast(`🎉 Blackjack! Võitsid ${newGame.winAmount} pollid!`, 'success');
            } else if (newGame.result === 'push') {
                showToast('Viik! Diiler samuti sai blackjacki.', 'info');
            } else if (newGame.result === 'lose') {
                showToast('Diiler sai blackjacki. Kaotasid.', 'error');
            }
        } catch (error: any) {
            showToast(error.message || 'Viga mängu alustamisel', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle Hit
    const handleHit = () => {
        if (!gameState || gameState.gameStatus !== 'playerTurn') return;

        const updatedGame = playerHit(gameState, deck);
        setGameState(updatedGame);

        if (updatedGame.gameStatus === 'finished') {
            setShowDealerCards(true);
            if (updatedGame.result === 'lose') {
                showToast(`Läksid lõhki! Kaotasid ${updatedGame.betAmount} pollid.`, 'error');
            }
            completeGame(updatedGame);
        }
    };

    // Handle Stand
    const handleStand = () => {
        if (!gameState || gameState.gameStatus !== 'playerTurn') return;

        setShowDealerCards(true);
        const updatedGame = playerStand(gameState);
        setGameState(updatedGame);

        // Show result
        if (updatedGame.result === 'win') {
            showToast(`🎉 Võitsid ${updatedGame.winAmount} pollid!`, 'success');
        } else if (updatedGame.result === 'push') {
            showToast('Viik! Saad oma panuse tagasi.', 'info');
        } else {
            showToast(`Kaotasid ${updatedGame.betAmount} pollid.`, 'error');
        }

        completeGame(updatedGame);
    };

    // Handle Double Down
    const handleDoubleDown = async () => {
        if (!gameState || !currentUser || !playerStats) return;
        if (gameState.gameStatus !== 'playerTurn' || gameState.playerHand.length !== 2) return;

        setIsProcessing(true);
        try {
            const { gameState: updatedGame } = await playerDoubleDown(
                currentUser.uid,
                playerStats,
                gameState,
                deck
            );

            setShowDealerCards(true);
            setGameState(updatedGame);

            // Show result
            if (updatedGame.result === 'win') {
                showToast(`🎉 Kahekordistamine õnnestus! Võitsid ${updatedGame.winAmount} pollid!`, 'success');
            } else if (updatedGame.result === 'push') {
                showToast('Viik! Saad oma kahekordse panuse tagasi.', 'info');
            } else {
                showToast(`Kahekordistamine ebaõnnestus. Kaotasid ${updatedGame.betAmount} pollid.`, 'error');
            }
        } catch (error: any) {
            showToast(error.message || 'Viga kahekordistamisel', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // Complete game and update stats
    const completeGame = async (finalGameState: BlackjackGameState) => {
        if (!currentUser || !playerStats) return;

        try {
            await completeBlackjackGame(currentUser.uid, playerStats, finalGameState);
        } catch (error) {
            console.error('Error completing game:', error);
        }
    };

    // Reset for new game
    const handleNewGame = () => {
        setGameState(null);
        setShowDealerCards(false);
        setDeck([]);
    };

    if (loading) {
        return <div className="blackjack-loading">Laadin...</div>;
    }

    return (
        <div className="blackjack-container">
            <div className="blackjack-header">
                <h3>🃏 Blackjack (21)</h3>
                <div className="blackjack-stats">
                    <span className="blackjack-pollid-display">
                        Pollid: {playerStats?.pollid || 0}
                    </span>
                </div>
            </div>

            {!canPlay && (
                <div className="blackjack-blocked">
                    <div className="blackjack-blocked-message">
                        <h4>❌ Mäng blokeeritud</h4>
                        <p>{blockReason}</p>
                    </div>
                </div>
            )}

            {!gameState && canPlay && (
                <div className="blackjack-start">
                    <div className="blackjack-game-info">
                        <p>Sisenetasu: <strong>10 pollid</strong></p>
                        <p>Võit: <strong>2x</strong> | Blackjack: <strong>3x</strong></p>
                    </div>
                    <button
                        className="blackjack-start-button"
                        onClick={handleStartGame}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Alustan...' : 'Alusta mängu'}
                    </button>
                </div>
            )}

            {gameState && (
                <div className="blackjack-game">
                    {/* Dealer's hand */}
                    <div className="blackjack-dealer-section">
                        <h4>Diiler</h4>
                        <div className="blackjack-card-hand">
                            {gameState.dealerHand.map((card, index) => (
                                <div key={index} className="blackjack-playing-card">
                                    {index === 1 && !showDealerCards ?
                                        '🂠' : getCardSymbol(card)}
                                </div>
                            ))}
                        </div>
                        <div className="blackjack-score">
                            Skoor: {showDealerCards ?
                            gameState.dealerScore :
                            calculateHandValue([gameState.dealerHand[0]])}
                        </div>
                    </div>

                    {/* Player's hand */}
                    <div className="blackjack-player-section">
                        <h4>Sinu käsi</h4>
                        <div className="blackjack-card-hand">
                            {gameState.playerHand.map((card, index) => (
                                <div key={index} className="blackjack-playing-card">
                                    {getCardSymbol(card)}
                                </div>
                            ))}
                        </div>
                        <div className="blackjack-score">
                            Skoor: {gameState.playerScore}
                        </div>
                    </div>

                    {/* Game controls */}
                    {gameState.gameStatus === 'playerTurn' && (
                        <div className="blackjack-game-controls">
                            <button
                                className="blackjack-control-button blackjack-hit"
                                onClick={handleHit}
                                disabled={isProcessing}
                            >
                                Lisa (Hit)
                            </button>
                            <button
                                className="blackjack-control-button blackjack-stand"
                                onClick={handleStand}
                                disabled={isProcessing}
                            >
                                Jää (Stand)
                            </button>
                            {gameState.playerHand.length === 2 &&
                                (playerStats?.pollid || 0) >= 10 && (
                                    <button
                                        className="blackjack-control-button blackjack-double"
                                        onClick={handleDoubleDown}
                                        disabled={isProcessing}
                                    >
                                        Kahekordista
                                    </button>
                                )}
                        </div>
                    )}

                    {/* Game result */}
                    {gameState.gameStatus === 'finished' && (
                        <div className={`blackjack-game-result ${gameState.result}`}>
                            <h3>
                                {gameState.result === 'win' && '🎉 Võitsid!'}
                                {gameState.result === 'lose' && '😔 Kaotasid'}
                                {gameState.result === 'push' && '🤝 Viik!'}
                                {gameState.result === 'blackjack' && '🎰 BLACKJACK!'}
                            </h3>
                            <p>
                                {gameState.result === 'win' && `Võitsid ${gameState.winAmount} pollid!`}
                                {gameState.result === 'lose' && `Kaotasid ${gameState.betAmount} pollid.`}
                                {gameState.result === 'push' && 'Saad oma panuse tagasi.'}
                                {gameState.result === 'blackjack' && `Võitsid ${gameState.winAmount} pollid!`}
                            </p>
                            <button
                                className="blackjack-new-game-button"
                                onClick={handleNewGame}
                            >
                                Uus mäng
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};