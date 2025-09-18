// src/services/BlackjackService.ts

import { Card, BlackjackGameState } from '../types/blackjack.types';
import { PlayerStats} from "../types";
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { getRemainingCasinoPlays } from './CasinoService';

// Constants
const ENTRY_FEE = 10; // pollid
const WIN_MULTIPLIER = 2;
const BLACKJACK_MULTIPLIER = 3;

/**
 * Create a standard 52-card deck
 */
const createDeck = (): Card[] => {
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];

    for (const suit of suits) {
        for (const rank of ranks) {
            let value = parseInt(rank);
            if (rank === 'J' || rank === 'Q' || rank === 'K') value = 10;
            if (rank === 'A') value = 11; // Ace starts as 11
            if (isNaN(value)) value = parseInt(rank);

            deck.push({ suit, rank, value });
        }
    }

    return shuffleDeck(deck);
};

/**
 * Shuffle deck using Fisher-Yates algorithm
 */
const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

/**
 * Calculate hand value (handles Aces properly)
 */
export const calculateHandValue = (hand: Card[]): number => {
    let value = 0;
    let aces = 0;

    // Count value and aces
    for (const card of hand) {
        if (card.rank === 'A') {
            aces++;
            value += 11;
        } else {
            value += card.value;
        }
    }

    // Adjust for aces if busted
    while (value > 21 && aces > 0) {
        value -= 10; // Convert ace from 11 to 1
        aces--;
    }

    return value;
};

/**
 * Check if hand is blackjack (21 with 2 cards)
 */
export const isBlackjack = (hand: Card[]): boolean => {
    return hand.length === 2 && calculateHandValue(hand) === 21;
};

/**
 * Check if player can play Blackjack
 */
export const canPlayBlackjack = (stats: PlayerStats): { canPlay: boolean; reason?: string } => {
    // Check casino play limit
    const remaining = getRemainingCasinoPlays(stats);
    if (remaining <= 0) {
        return { canPlay: false, reason: 'Kasiino mängude limiit on täis! Oota järgmist tundi.' };
    }

    // Check pollid balance - handle optional pollid
    const playerPollid = stats.pollid || 0;
    if (playerPollid < ENTRY_FEE) {
        return { canPlay: false, reason: `Sul pole piisavalt pollisid! Vaja ${ENTRY_FEE} pollid.` };
    }

    // Check reputation (optional - same as slots)
    if (stats.reputation < 0) {
        return { canPlay: false, reason: 'Negatiivse mainega ei saa kasiinos mängida!' };
    }

    return { canPlay: true };
};

/**
 * Start a new Blackjack game
 */
export const startBlackjackGame = async (
    userId: string,
    stats: PlayerStats
): Promise<{
    gameState: BlackjackGameState;
    updatedStats: PlayerStats;
}> => {
    // Validate player can play
    const { canPlay, reason } = canPlayBlackjack(stats);
    if (!canPlay) {
        throw new Error(reason);
    }

    // Get current pollid (handle optional)
    const currentPollid = stats.pollid || 0;

    // Create and shuffle deck
    const deck = createDeck();

    // Deal initial cards
    const playerHand = [deck.pop()!, deck.pop()!];
    const dealerHand = [deck.pop()!, deck.pop()!]; // Second card is hidden initially

    // Calculate scores
    const playerScore = calculateHandValue(playerHand);
    const dealerScore = calculateHandValue([dealerHand[0]]); // Only show first card score

    // Check for immediate blackjack
    const playerHasBlackjack = isBlackjack(playerHand);
    const dealerHasBlackjack = isBlackjack(dealerHand);

    let gameStatus: BlackjackGameState['gameStatus'] = 'playerTurn';
    let result: BlackjackGameState['result'] = null;
    let winAmount = 0;

    // Handle immediate blackjacks
    if (playerHasBlackjack || dealerHasBlackjack) {
        gameStatus = 'finished';
        if (playerHasBlackjack && !dealerHasBlackjack) {
            result = 'blackjack';
            winAmount = ENTRY_FEE * BLACKJACK_MULTIPLIER;
        } else if (!playerHasBlackjack && dealerHasBlackjack) {
            result = 'lose';
            winAmount = 0;
        } else {
            result = 'push';
            winAmount = ENTRY_FEE; // Return bet
        }
    }

    // Update database
    const statsRef = doc(firestore, 'playerStats', userId);
    const now = Date.now();
    const currentHour = new Date().getHours();
    const lastPlayHour = stats.casinoData ? new Date(stats.casinoData.lastPlayTime).getHours() : -1;

    // Reset plays if new hour
    const playsUsed = currentHour !== lastPlayHour ? 1 : (stats.casinoData?.playsUsed || 0) + 1;

    const updates = {
        pollid: currentPollid - ENTRY_FEE + winAmount,
        'casinoData.playsUsed': playsUsed,
        'casinoData.lastPlayTime': now,
        'casinoData.hourlyReset': now
    };

    await updateDoc(statsRef, updates);

    const gameState: BlackjackGameState = {
        playerHand,
        dealerHand,
        playerScore,
        dealerScore,
        gameStatus,
        result,
        betAmount: ENTRY_FEE,
        winAmount
    };

    return {
        gameState,
        updatedStats: {
            ...stats,
            pollid: currentPollid - ENTRY_FEE + winAmount,
            casinoData: {
                playsUsed,
                lastPlayTime: now,
                hourlyReset: now
            }
        }
    };
};

/**
 * Player hits (takes another card)
 */
export const playerHit = (
    gameState: BlackjackGameState,
    deck: Card[]
): BlackjackGameState => {
    if (gameState.gameStatus !== 'playerTurn') {
        throw new Error('Mäng ei ole mängija käigul!');
    }

    // Draw a card
    const newCard = deck.pop();
    if (!newCard) throw new Error('Kaardipakk on tühi!');

    const newHand = [...gameState.playerHand, newCard];
    const newScore = calculateHandValue(newHand);

    // Check if busted
    if (newScore > 21) {
        return {
            ...gameState,
            playerHand: newHand,
            playerScore: newScore,
            gameStatus: 'finished',
            result: 'lose',
            winAmount: 0
        };
    }

    // Check if 21 (auto-stand)
    if (newScore === 21) {
        return playerStand({
            ...gameState,
            playerHand: newHand,
            playerScore: newScore
        });
    }

    return {
        ...gameState,
        playerHand: newHand,
        playerScore: newScore
    };
};

/**
 * Player stands (dealer's turn)
 */
export const playerStand = (gameState: BlackjackGameState): BlackjackGameState => {
    if (gameState.gameStatus !== 'playerTurn') {
        throw new Error('Mäng ei ole mängija käigul!');
    }

    // Reveal dealer's hidden card
    const dealerScore = calculateHandValue(gameState.dealerHand);

    // Dealer must hit on 16 and below, stand on 17 and above
    let dealerHand = [...gameState.dealerHand];
    let currentDealerScore = dealerScore;
    const deck = createDeck(); // In real implementation, pass the same deck

    while (currentDealerScore < 17) {
        const newCard = deck.pop();
        if (!newCard) break;

        dealerHand.push(newCard);
        currentDealerScore = calculateHandValue(dealerHand);
    }

    // Determine winner
    let result: BlackjackGameState['result'];
    let winAmount: number;

    if (currentDealerScore > 21) {
        // Dealer busted
        result = 'win';
        winAmount = ENTRY_FEE * WIN_MULTIPLIER;
    } else if (currentDealerScore > gameState.playerScore) {
        // Dealer wins
        result = 'lose';
        winAmount = 0;
    } else if (currentDealerScore < gameState.playerScore) {
        // Player wins
        result = 'win';
        winAmount = ENTRY_FEE * WIN_MULTIPLIER;
    } else {
        // Push (tie)
        result = 'push';
        winAmount = ENTRY_FEE;
    }

    return {
        ...gameState,
        dealerHand,
        dealerScore: currentDealerScore,
        gameStatus: 'finished',
        result,
        winAmount
    };
};

/**
 * Player doubles down (one card only, double bet)
 */
export const playerDoubleDown = async (
    userId: string,
    stats: PlayerStats,
    gameState: BlackjackGameState,
    deck: Card[]
): Promise<{
    gameState: BlackjackGameState;
    updatedStats: PlayerStats;
}> => {
    if (gameState.gameStatus !== 'playerTurn') {
        throw new Error('Ei saa kahekordistada!');
    }

    if (gameState.playerHand.length !== 2) {
        throw new Error('Kahekordistada saab ainult esimese kahe kaardiga!');
    }

    // Handle optional pollid
    const currentPollid = stats.pollid || 0;
    if (currentPollid < ENTRY_FEE) {
        throw new Error('Sul pole piisavalt pollisid kahekordistamiseks!');
    }

    // Draw exactly one card
    const newCard = deck.pop();
    if (!newCard) throw new Error('Kaardipakk on tühi!');

    const newHand = [...gameState.playerHand, newCard];
    const newScore = calculateHandValue(newHand);

    // Update bet amount (doubled)
    const doubleBet = ENTRY_FEE * 2;

    // After double down, automatically stand
    let finalGameState: BlackjackGameState = {
        ...gameState,
        playerHand: newHand,
        playerScore: newScore,
        betAmount: doubleBet
    };

    // Check if busted
    if (newScore > 21) {
        finalGameState = {
            ...finalGameState,
            gameStatus: 'finished',
            result: 'lose',
            winAmount: 0
        };
    } else {
        // Proceed with dealer's turn
        finalGameState = playerStand(finalGameState);
        // Adjust winnings for doubled bet
        if (finalGameState.result === 'win') {
            finalGameState.winAmount = doubleBet * WIN_MULTIPLIER;
        } else if (finalGameState.result === 'push') {
            finalGameState.winAmount = doubleBet;
        }
    }

    // Update database with additional pollid deduction
    const statsRef = doc(firestore, 'playerStats', userId);
    const updates = {
        pollid: currentPollid - ENTRY_FEE + finalGameState.winAmount
    };

    await updateDoc(statsRef, updates);

    return {
        gameState: finalGameState,
        updatedStats: {
            ...stats,
            pollid: currentPollid - ENTRY_FEE + finalGameState.winAmount
        }
    };
};

/**
 * Complete the game and update final stats
 */
export const completeBlackjackGame = async (
    userId: string,
    stats: PlayerStats,
    gameState: BlackjackGameState
): Promise<PlayerStats> => {
    if (gameState.gameStatus !== 'finished') {
        throw new Error('Mäng pole veel lõppenud!');
    }

    // Handle optional pollid
    const currentPollid = stats.pollid || 0;

    // Update pollid based on result
    const statsRef = doc(firestore, 'playerStats', userId);
    const updates = {
        pollid: currentPollid + gameState.winAmount
    };

    await updateDoc(statsRef, updates);

    return {
        ...stats,
        pollid: currentPollid + gameState.winAmount
    };
};