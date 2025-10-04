// src/services/CasinoService.ts
import { firestore } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { PlayerStats } from '../types';
import { recordCasinoWin } from './CasinoLeaderboardService';
import {getCurrentServer, getServerSpecificId} from "../utils/serverUtils";

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
    // If no casino data exists at all, player has never played
    if (!stats.casinoData) {
        console.log('No casino data found - returning MAX_PLAYS');
        return MAX_PLAYS_PER_HOUR;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = now.toDateString();

    // Get last play time
    const lastPlayTime = new Date(stats.casinoData.lastPlayTime);
    const lastPlayHour = lastPlayTime.getHours();
    const lastPlayDate = lastPlayTime.toDateString();

    console.log('Casino play check:', {
        currentHour,
        lastPlayHour,
        currentDate,
        lastPlayDate,
        playsUsed: stats.casinoData.playsUsed
    });

    // Reset if it's a new hour OR a different day
    if (currentHour !== lastPlayHour || currentDate !== lastPlayDate) {
        console.log('New hour or day detected - returning MAX_PLAYS');
        return MAX_PLAYS_PER_HOUR;
    }

    const remaining = Math.max(0, MAX_PLAYS_PER_HOUR - (stats.casinoData.playsUsed || 0));
    console.log('Remaining plays:', remaining);
    return remaining;
};

export const checkAndResetCasinoData = async (userId: string, stats: PlayerStats): Promise<boolean> => {
    // If no casino data, initialize it
    if (!stats.casinoData) {
        try {
            console.log('Initializing casino data for first time player');
            const statsRef = doc(firestore, 'playerStats', getServerSpecificId(userId, getCurrentServer()));
            const resetCasinoData: CasinoData = {
                playsUsed: 0,
                lastPlayTime: Date.now(),
                hourlyReset: Date.now()
            };

            await updateDoc(statsRef, {
                casinoData: resetCasinoData
            });

            return true; // Indicates initialization happened
        } catch (error) {
            console.error('Error initializing casino data:', error);
            return false;
        }
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = now.toDateString();

    const lastPlayTime = new Date(stats.casinoData.lastPlayTime);
    const lastPlayHour = lastPlayTime.getHours();
    const lastPlayDate = lastPlayTime.toDateString();

    // Reset if it's a new hour OR a different day
    if (currentHour !== lastPlayHour || currentDate !== lastPlayDate) {
        try {
            console.log('Resetting casino data - new hour or day');
            const statsRef = doc(firestore, 'playerStats', getServerSpecificId(userId, getCurrentServer()));
            const resetCasinoData: CasinoData = {
                playsUsed: 0,
                lastPlayTime: Date.now(),
                hourlyReset: Date.now()
            };

            await updateDoc(statsRef, {
                casinoData: resetCasinoData
            });

            return true; // Indicates reset happened
        } catch (error) {
            console.error('Error resetting casino data:', error);
            return false;
        }
    }

    return false; // No reset needed
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
        if (Math.random() < 0.90) {
            isWin = true;
            multiplier = 1.2;
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

    const statsRef = doc(firestore, 'playerStats', getServerSpecificId(userId, getCurrentServer()));

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

    // Record win to leaderboard if player won
    if (gameResult.isWin && gameResult.winAmount > 0) {
        // Fire and forget - don't await to keep game fast
        recordCasinoWin(
            userId,
            stats.username || 'Tundmatu',
            betAmount,
            gameResult.winAmount,
            gameResult.multiplier
        ).catch(error => {
            console.error('Failed to record casino win:', error);
            // Don't break the game if leaderboard fails
        });
    }

    return {
        updatedStats: {
            ...stats,
            ...updates
        },
        gameResult
    };
};