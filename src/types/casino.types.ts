// src/types/casino.types.ts
export interface CasinoWin {
    userId: string;
    username: string;
    winAmount: number;
    betAmount: number;
    multiplier: number;
    timestamp: number;
    month: string;
    server: string;
}

export interface CasinoLeaderboardEntry {
    userId: string;
    username: string;
    totalWins: number;
    currentMonthWins: number;
    biggestWin: number;
    winCount: number;
    currentMonthWinCount: number;
    position: number;
}

export type CasinoGameType = 'slots' | 'blackjack';