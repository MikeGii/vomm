// src/services/CasinoService.ts
import { firestore } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { PlayerStats } from '../types';

export interface CasinoData {
    playsUsed: number;
    lastPlayTime: number; // timestamp
    hourlyReset: number; // timestamp of when hour resets
}

const MAX_PLAYS_PER_HOUR = 5;

// Get time until next hourly reset
export const getTimeUntilCasinoReset = (): string => {
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1);
    const diff = nextHour.getTime() - now.getTime();

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const canPlayerGamble = (playerStats: PlayerStats): { canGamble: boolean; reason?: string } => {
    // Check if player reputation is negative
    if (playerStats.reputation < 5) {
        return {
            canGamble: false,
            reason: 'Sinu maine on liiga madal kasiinosse pääsemiseks. Maine peab olema vähemalt 5.'
        };
    }

    return { canGamble: true };
};

// Get remaining casino plays for current hour
export const getRemainingCasinoPlays = (stats: PlayerStats): number => {
    if (!stats.casinoData) {
        return MAX_PLAYS_PER_HOUR;
    }

    const currentHour = new Date().getHours();
    const lastPlayHour = new Date(stats.casinoData.lastPlayTime).getHours();

    // Reset if it's a new hour
    if (currentHour !== lastPlayHour) {
        return MAX_PLAYS_PER_HOUR;
    }

    return Math.max(0, MAX_PLAYS_PER_HOUR - stats.casinoData.playsUsed);
};

// Simple slot machine game result
export interface SlotResult {
    symbols: string[];
    isWin: boolean;
    multiplier: number;
    winAmount: number;
}

// Generate random slot machine result
export const generateSlotResult = (betAmount: number): SlotResult => {
    const symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣'];
    const result = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
    ];

    // Check for wins
    let isWin = false;
    let multiplier = 0;

    // Three of a kind
    if (result[0] === result[1] && result[1] === result[2]) {
        isWin = true;
        switch (result[0]) {
            case '💎':
                multiplier = 10; // Diamond jackpot
                break;
            case '7️⃣':
                multiplier = 5; // Lucky 7
                break;
            case '🔔':
                multiplier = 3; // Bell
                break;
            default:
                multiplier = 2; // Other fruits
                break;
        }
    }
    // Two of a kind - DOUBLED from 15% to 30%
    else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        // 60% chance to win something on two of a kind (4x original)
        if (Math.random() < 0.60) {
            isWin = true;
            multiplier = 1.5;
        }
    }

    const winAmount = isWin ? Math.floor(betAmount * multiplier) : 0;

    return {
        symbols: result,
        isWin,
        multiplier,
        winAmount
    };
};

// Play casino slot machine
export const playSlotMachine = async (userId: string, stats: PlayerStats, betAmount: number): Promise<{
    updatedStats: PlayerStats;
    gameResult: SlotResult;
}> => {

    const { canGamble, reason } = canPlayerGamble(stats);
    if (!canGamble) {
        throw new Error(reason || 'Sa ei saa mängida.');
    }

    const statsRef = doc(firestore, 'playerStats', userId);

    const remaining = getRemainingCasinoPlays(stats);
    if (remaining <= 0) {
        throw new Error('Kasiinos mängimise limiit on täis! Oota järgmist tundi.');
    }

    if (betAmount > stats.money) {
        throw new Error('Sul pole piisavalt raha!');
    }

    if (betAmount < 1) {
        throw new Error('Minimaalne panus on 1€!');
    }

    const now = Date.now();
    const currentHour = new Date().getHours();
    const lastPlayHour = stats.casinoData ? new Date(stats.casinoData.lastPlayTime).getHours() : -1;

    // Reset plays if it's a new hour
    const playsUsed = currentHour !== lastPlayHour ? 1 : (stats.casinoData?.playsUsed || 0) + 1;

    const updatedCasinoData: CasinoData = {
        playsUsed,
        lastPlayTime: now,
        hourlyReset: now
    };

    // Generate game result
    const gameResult = generateSlotResult(betAmount);

    // Calculate new money and reputation
    const newMoney = stats.money - betAmount + gameResult.winAmount;
    const newReputation = Math.max(0, stats.reputation - 5);

    const updates = {
        casinoData: updatedCasinoData,
        reputation: newReputation,
        money: newMoney
    };

    await updateDoc(statsRef, updates);

    return {
        updatedStats: {
            ...stats,
            ...updates
        },
        gameResult
    };
};