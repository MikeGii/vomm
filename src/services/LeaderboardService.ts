// src/services/LeaderboardService.ts - COMPLETE FIXED VERSION
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { LeaderboardEntry } from '../types';
import { cacheManager } from './CacheManager';

const EXCLUDED_USERNAMES = ['Lääne13'];

/**
 * Get leaderboard with proper ordering and caching
 * @param limitCount - Number of players to fetch (default 200 for all active players)
 * @param forceRefresh - Force bypass cache and fetch fresh data
 */
export const getLeaderboard = async (
    limitCount: number = 300,
    forceRefresh: boolean = false
): Promise<LeaderboardEntry[]> => {
    const cacheKey = `leaderboard_${limitCount}`;

    // Step 1: Check cache first (unless force refresh)
    if (!forceRefresh) {
        const cached = cacheManager.get<LeaderboardEntry[]>(cacheKey);
        if (cached) {
            console.log(`Leaderboard loaded from cache (${cached.length} players)`);
            return cached;
        }
    }

    try {
        console.log('Fetching leaderboard from Firebase...');

        // Step 2: Build the query with PROPER ORDERING
        // CRITICAL FIX: Order BY level and reputation BEFORE limiting
        const statsQuery = query(
            collection(firestore, 'playerStats'),
            where('completedCourses', 'array-contains', 'basic_police_training_abipolitseinik'),
            orderBy('level', 'desc'),       // Highest level first
            orderBy('reputation', 'desc'),   // Then by reputation
            limit(limitCount)
        );

        // Step 3: Execute query
        const querySnapshot = await getDocs(statsQuery);
        console.log(`Firebase returned ${querySnapshot.size} documents`);

        const leaderboard: LeaderboardEntry[] = [];

        // Step 4: Process each player
        querySnapshot.docs.forEach((statsDoc) => {
            const playerData = statsDoc.data();

            // Skip excluded usernames
            if (playerData.username && EXCLUDED_USERNAMES.includes(playerData.username)) {
                console.log(`Excluding player: ${playerData.username}`);
                return;
            }

            // Skip if explicitly excluded from leaderboard
            if (playerData.excludeFromLeaderboard === true) {
                return;
            }

            // Add to leaderboard
            leaderboard.push({
                userId: statsDoc.id,
                username: playerData.username || 'Tundmatu',
                level: playerData.level || 1,
                experience: playerData.experience || 0,
                reputation: playerData.reputation || 0,
                money: playerData.money || 0,
                rank: playerData.rank || null,
                badgeNumber: playerData.badgeNumber || null,
                policePosition: playerData.policePosition,
                departmentUnit: playerData.departmentUnit || null,
                department: playerData.department || null,
                prefecture: playerData.prefecture || null,
                isEmployed: playerData.isEmployed || false,
                completedCourses: playerData.completedCourses || [],
                attributes: playerData.attributes,
                casesCompleted: playerData.casesCompleted || 0,
                criminalsArrested: playerData.criminalsArrested || 0,
                totalWorkedHours: playerData.totalWorkedHours || 0,
                isVip: playerData.isVip || false
            });
        });

        // Step 5: Data is already sorted by Firebase query, no need to sort again!
        console.log(`Processed ${leaderboard.length} players for leaderboard`);

        // Step 6: Save to cache
        cacheManager.set(cacheKey, leaderboard);
        console.log('Leaderboard saved to cache');

        return leaderboard;

    } catch (error: any) {
        console.error('Error fetching leaderboard:', error);

        // Check if it's an index error
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            console.error('FIREBASE INDEX NEEDED!');
            console.error('Click this link to create the index:');
            console.error(error.message);

            // Try fallback query without ordering (temporary fix)
            try {
                console.log('Attempting fallback query without ordering...');
                const fallbackQuery = query(
                    collection(firestore, 'playerStats'),
                    limit(limitCount)
                );

                const snapshot = await getDocs(fallbackQuery);
                const leaderboard: LeaderboardEntry[] = [];

                snapshot.docs.forEach((doc) => {
                    const data = doc.data();

                    // Apply filters client-side
                    const hasBasicTraining = data.completedCourses?.includes('basic_police_training_abipolitseinik');
                    const isExcluded = data.excludeFromLeaderboard === true;
                    const isExcludedUsername = data.username && EXCLUDED_USERNAMES.includes(data.username);

                    if (hasBasicTraining && !isExcluded && !isExcludedUsername) {
                        leaderboard.push({
                            userId: doc.id,
                            username: data.username || 'Tundmatu',
                            level: data.level || 1,
                            experience: data.experience || 0,
                            reputation: data.reputation || 0,
                            money: data.money || 0,
                            rank: data.rank || null,
                            badgeNumber: data.badgeNumber || null,
                            policePosition: data.policePosition,
                            departmentUnit: data.departmentUnit || null,
                            department: data.department || null,
                            prefecture: data.prefecture || null,
                            isEmployed: data.isEmployed || false,
                            completedCourses: data.completedCourses || [],
                            attributes: data.attributes,
                            casesCompleted: data.casesCompleted || 0,
                            criminalsArrested: data.criminalsArrested || 0,
                            totalWorkedHours: data.totalWorkedHours || 0
                        });
                    }
                });

                // Sort client-side as fallback
                leaderboard.sort((a, b) => {
                    if (b.level !== a.level) {
                        return b.level - a.level;
                    }
                    return b.reputation - a.reputation;
                });

                console.warn('Using fallback query - CREATE THE INDEX for better performance!');

                // Don't cache fallback results as long
                cacheManager.set(cacheKey, leaderboard);

                return leaderboard;

            } catch (fallbackError) {
                console.error('Fallback query also failed:', fallbackError);
            }
        }

        // Try to return cached data even if expired
        const staleCache = cacheManager.get<LeaderboardEntry[]>(cacheKey, Infinity);
        if (staleCache) {
            console.log('Returning stale cache due to error');
            return staleCache;
        }

        // Return empty array as last resort
        return [];
    }
};

/**
 * Clear leaderboard cache (useful after updates)
 */
export const clearLeaderboardCache = (): void => {
    cacheManager.clearByPattern('leaderboard');
    console.log('Leaderboard cache cleared');
};

/**
 * Get current cache status for debugging
 */
export const getLeaderboardCacheStatus = (): boolean => {
    return cacheManager.has('leaderboard_200');
};

