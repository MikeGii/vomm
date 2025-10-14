// src/services/LeaderboardService.ts
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    getDoc,
    doc
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { LeaderboardEntry } from '../types';
import { getCurrentServer } from '../utils/serverUtils';
import { cacheManager } from './CacheManager';

const EXCLUDED_USERNAMES = ['Lääne13'];

export const getLeaderboard = async (
    limitCount: number = 300,
    forceRefresh: boolean = false
): Promise<LeaderboardEntry[]> => {
    const currentServer = getCurrentServer();
    const cacheKey = `leaderboard_${limitCount}_${currentServer}`;

    if (!forceRefresh) {
        const cached = cacheManager.get<LeaderboardEntry[]>(cacheKey);
        if (cached) {
            console.log(`Leaderboard loaded from cache (${cached.length} players)`);
            return cached;
        }
    }

    try {
        console.log('Fetching leaderboard from Firebase...');

        const statsQuery = query(
            collection(firestore, 'playerStats'),
            where('completedCourses', 'array-contains', 'basic_police_training_abipolitseinik'),
            orderBy('level', 'desc'),
            orderBy('reputation', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(statsQuery);
        console.log(`Firebase returned ${querySnapshot.size} documents`);

        const leaderboard: LeaderboardEntry[] = [];
        const userIds = new Set<string>();

        // Step 1: Collect player data and base user IDs
        querySnapshot.docs.forEach((statsDoc) => {
            const docId = statsDoc.id;

            if (currentServer === 'beta' && docId.includes('_')) return;
            if (currentServer !== 'beta' && !docId.endsWith(`_${currentServer}`)) return;

            const playerData = statsDoc.data();

            if (playerData.username && EXCLUDED_USERNAMES.includes(playerData.username)) {
                console.log(`Excluding player: ${playerData.username}`);
                return;
            }

            if (playerData.excludeFromLeaderboard === true) {
                return;
            }

            // Extract base userId
            const baseUserId = currentServer === 'beta'
                ? docId
                : docId.replace(`_${currentServer}`, '');

            userIds.add(baseUserId);

            // DEBUG: Log worked hours for White server
            if (currentServer === 'white' && playerData.totalWorkedHours > 0) {
                console.log(`✅ WHITE SERVER - Player ${playerData.username}: ${playerData.totalWorkedHours} hours`);
            }

            leaderboard.push({
                userId: statsDoc.id,
                baseUserId: baseUserId,
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
                totalWorkedHours: playerData.totalWorkedHours || 0, // ✅ See loeb õigesti
                isVip: false // Will be updated
            });
        });

        // Step 2: Fetch VIP status from users collection
        const vipPromises = Array.from(userIds).map(async (baseUserId) => {
            const userDoc = await getDoc(doc(firestore, 'users', baseUserId));
            return {
                userId: baseUserId,
                isVip: userDoc.exists() ? (userDoc.data().isVip || false) : false
            };
        });

        const vipData = await Promise.all(vipPromises);
        const vipMap = new Map(vipData.map(v => [v.userId, v.isVip]));

        // Step 3: Update VIP status
        leaderboard.forEach(entry => {
            entry.isVip = vipMap.get(entry.baseUserId) || false;
        });

        console.log(`Processed ${leaderboard.length} players for leaderboard`);
        cacheManager.set(cacheKey, leaderboard);
        console.log('Leaderboard saved to cache');

        return leaderboard;

    } catch (error: any) {
        console.error('Error fetching leaderboard:', error);

        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            console.error('FIREBASE INDEX NEEDED!');
            console.error(error.message);

            try {
                console.log('Attempting fallback query without ordering...');
                const fallbackQuery = query(
                    collection(firestore, 'playerStats'),
                    limit(limitCount)
                );

                const snapshot = await getDocs(fallbackQuery);
                const leaderboard: LeaderboardEntry[] = [];

                snapshot.docs.forEach((doc) => {
                    const docId = doc.id;

                    if (currentServer === 'beta' && docId.includes('_')) return;
                    if (currentServer !== 'beta' && !docId.endsWith(`_${currentServer}`)) return;

                    const data = doc.data();

                    const hasBasicTraining = data.completedCourses?.includes('basic_police_training_abipolitseinik');
                    const isExcluded = data.excludeFromLeaderboard === true;
                    const isExcludedUsername = data.username && EXCLUDED_USERNAMES.includes(data.username);

                    if (hasBasicTraining && !isExcluded && !isExcludedUsername) {
                        leaderboard.push({
                            userId: doc.id,
                            baseUserId: currentServer === 'beta' ? doc.id : doc.id.replace(`_${currentServer}`, ''),
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
                            totalWorkedHours: data.totalWorkedHours || 0,
                            isVip: false
                        });
                    }
                });

                leaderboard.sort((a, b) => {
                    if (b.level !== a.level) {
                        return b.level - a.level;
                    }
                    return b.reputation - a.reputation;
                });

                console.warn('Using fallback query - CREATE THE INDEX for better performance!');
                cacheManager.set(cacheKey, leaderboard);

                return leaderboard;

            } catch (fallbackError) {
                console.error('Fallback query also failed:', fallbackError);
            }
        }

        const staleCache = cacheManager.get<LeaderboardEntry[]>(cacheKey, Infinity);
        if (staleCache) {
            console.log('Returning stale cache due to error');
            return staleCache;
        }

        return [];
    }
};