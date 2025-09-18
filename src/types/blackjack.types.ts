// src/types/blackjack.types.ts

export interface Card {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    rank: string;
    value: number;
}

export interface BlackjackGameState {
    playerHand: Card[];
    dealerHand: Card[];
    playerScore: number;
    dealerScore: number;
    gameStatus: 'waiting' | 'playing' | 'playerTurn' | 'dealerTurn' | 'finished';
    result: 'win' | 'lose' | 'push' | 'blackjack' | null;
    betAmount: number;
    winAmount: number;
}