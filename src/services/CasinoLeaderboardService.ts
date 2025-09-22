// src/services/CasinoLeaderboardService.ts
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { CasinoWin, CasinoLeaderboardEntry } from '../types/casino.types';
import { cacheManager } from './CacheManager';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const LEADERBOARD_LIMIT = 10;

// Monthly rewards configuration
export const MONTHLY_REWARDS = [
    { position: 1, reward: 200, label: 'Kuld' },
    { position: 2, reward: 125, label: 'Hõbe' },
    { position: 3, reward: 75, label: 'Pronks' }
];

/**
 * Get current month string in format "YYYY-MM"
 */
const getCurrentMonth = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
};

/**
 * Record a casino win to the database
 */
export const recordCasinoWin = async (
    userId: string,
    username: string,
    betAmount: number,
    winAmount: number,
    multiplier: number
): Promise<void> => {
    try {
        const winData: CasinoWin = {
            userId,
            username,
            winAmount,
            betAmount,
            multiplier,
            timestamp: Date.now(),
            month: getCurrentMonth()
        };

        // Store win record with auto-generated ID
        const winsCollection = collection(firestore, 'casinoWins');
        await setDoc(doc(winsCollection), winData);

        // Clear cache to refresh leaderboard
        cacheManager.remove('casino_leaderboard_universal');
    } catch (error) {
        console.error('Error recording casino win:', error);
        // Don't throw - we don't want to break the game if recording fails
    }
};

/**
 * Get universal casino leaderboard with all-time and current month stats
 */
export const getUniversalLeaderboard = async (
    forceRefresh: boolean = false
): Promise<CasinoLeaderboardEntry[]> => {
    const cacheKey = 'casino_leaderboard_universal';
    const currentMonth = getCurrentMonth();

    // Check cache first
    if (!forceRefresh) {
        const cached = cacheManager.get<CasinoLeaderboardEntry[]>(cacheKey, CACHE_DURATION);
        if (cached) {
            console.log('Casino leaderboard loaded from cache');
            return cached;
        }
    }

    try {
        console.log('Fetching universal casino leaderboard from Firebase...');

        // Get ALL wins (not filtered by month)
        const winsQuery = query(
            collection(firestore, 'casinoWins'),
            where('winAmount', '>', 0)
        );

        const snapshot = await getDocs(winsQuery);

        // Aggregate wins by user
        const userWinsMap = new Map<string, {
            username: string;
            totalWins: number;
            currentMonthWins: number;
            biggestWin: number;
            winCount: number;
            currentMonthWinCount: number;
        }>();

        snapshot.docs.forEach((doc) => {
            const win = doc.data() as CasinoWin;
            const existing = userWinsMap.get(win.userId);
            const isCurrentMonth = win.month === currentMonth;

            if (existing) {
                // Update all-time stats
                existing.totalWins += win.winAmount;
                existing.biggestWin = Math.max(existing.biggestWin, win.winAmount);
                existing.winCount += 1;

                // Update current month stats if applicable
                if (isCurrentMonth) {
                    existing.currentMonthWins += win.winAmount;
                    existing.currentMonthWinCount += 1;
                }
            } else {
                // Create new entry
                userWinsMap.set(win.userId, {
                    username: win.username,
                    totalWins: win.winAmount,
                    currentMonthWins: isCurrentMonth ? win.winAmount : 0,
                    biggestWin: win.winAmount,
                    winCount: 1,
                    currentMonthWinCount: isCurrentMonth ? 1 : 0
                });
            }
        });

        // Convert to array and sort by CURRENT MONTH wins for rewards
        const leaderboard: CasinoLeaderboardEntry[] = Array.from(userWinsMap.entries())
            .map(([userId, data]) => ({
                userId,
                username: data.username,
                totalWins: data.totalWins,
                currentMonthWins: data.currentMonthWins,
                biggestWin: data.biggestWin,
                winCount: data.winCount,
                currentMonthWinCount: data.currentMonthWinCount,
                position: 0 // Will be set after sorting
            }))
            .sort((a, b) => {
                // Primary sort: current month wins (for rewards)
                if (b.currentMonthWins !== a.currentMonthWins) {
                    return b.currentMonthWins - a.currentMonthWins;
                }
                // Secondary sort: total wins
                return b.totalWins - a.totalWins;
            })
            .slice(0, LEADERBOARD_LIMIT)
            .map((entry, index) => ({
                ...entry,
                position: index + 1
            }));

        // Cache the result
        cacheManager.set(cacheKey, leaderboard, CACHE_DURATION);
        console.log(`Casino leaderboard cached: ${leaderboard.length} entries`);

        return leaderboard;
    } catch (error) {
        console.error('Error fetching casino leaderboard:', error);

        // Try to return stale cache if available
        const staleCache = cacheManager.get<CasinoLeaderboardEntry[]>(cacheKey, Infinity);
        if (staleCache) {
            console.log('Returning stale cache due to error');
            return staleCache;
        }

        return [];
    }
};

// Keep the old function for backwards compatibility, but redirect to universal
export const getMonthlyLeaderboard = getUniversalLeaderboard;