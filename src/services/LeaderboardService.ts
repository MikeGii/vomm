// src/services/LeaderboardService.ts
import {
    collection,
    query,
    limit,
    getDocs,
    doc,
    getDoc
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { LeaderboardEntry, LeaderboardSortBy } from '../types';

const EXCLUDED_EMAILS = ['cjmike12@gmail.com'];

export const getLeaderboard = async (
    sortBy: LeaderboardSortBy = 'level',
    limitCount: number = 50
): Promise<LeaderboardEntry[]> => {
    try {
        const statsQuery = query(
            collection(firestore, 'playerStats'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(statsQuery);
        const leaderboard: LeaderboardEntry[] = [];

        for (const statsDoc of querySnapshot.docs) {
            const playerData = statsDoc.data();

            // Check if player has completed basic training (is at least Abipolitseinik)
            const hasCompletedBasicTraining = playerData.completedCourses?.includes('basic_police_training_abipolitseinik') || false;

            if (!hasCompletedBasicTraining) {
                continue;
            }

            // Get user data to check email
            let username = 'Tundmatu';
            let shouldExclude = false;

            try {
                const userDoc = await getDoc(doc(firestore, 'users', statsDoc.id));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    username = userData.username || 'Tundmatu';

                    // Check if this user should be excluded
                    if (userData.email && EXCLUDED_EMAILS.includes(userData.email)) {
                        shouldExclude = true;
                    }
                }
            } catch (error) {
                console.error('Error fetching username for', statsDoc.id, error);
            }

            // Skip if user should be excluded
            if (shouldExclude) {
                continue;
            }

            leaderboard.push({
                userId: statsDoc.id,
                username,
                level: playerData.level || 1,
                experience: playerData.experience || 0,
                reputation: playerData.reputation || 0,
                money: playerData.money || 0,
                rank: playerData.rank || null,
                badgeNumber: playerData.badgeNumber || null,
                isEmployed: playerData.isEmployed || false,
                completedCourses: playerData.completedCourses || [],
                attributes: playerData.attributes,
                casesCompleted: playerData.casesCompleted || 0,
                criminalsArrested: playerData.criminalsArrested || 0,
                totalWorkedHours: playerData.totalWorkedHours || 0
            });
        }

        // Simple sorting by level (primary) and reputation (secondary)
        leaderboard.sort((a, b) => {
            if (b.level !== a.level) {
                return b.level - a.level;
            }
            return b.reputation - a.reputation;
        });

        return leaderboard;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
};