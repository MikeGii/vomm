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

            if (!playerData.hasCompletedTraining) {
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
                hasCompletedTraining: playerData.hasCompletedTraining || false,
                completedCourses: playerData.completedCourses || [],
                attributes: playerData.attributes,
                casesCompleted: playerData.casesCompleted || 0,
                criminalsArrested: playerData.criminalsArrested || 0,
                totalWorkedHours: playerData.totalWorkedHours || 0
            });
        }

        // Sort in memory based on sortBy parameter
        leaderboard.sort((a, b) => {
            switch (sortBy) {
                case 'level':
                    if (b.level !== a.level) {
                        return b.level - a.level;
                    }
                    return b.reputation - a.reputation;

                case 'reputation':
                    if (b.reputation !== a.reputation) {
                        return b.reputation - a.reputation;
                    }
                    return b.level - a.level;

                case 'money':  // ADD THIS CASE
                    if (b.money !== a.money) {
                        return b.money - a.money;
                    }
                    return b.level - a.level;

                case 'strength':
                    return (b.attributes?.strength?.level || 0) - (a.attributes?.strength?.level || 0);

                case 'agility':
                    return (b.attributes?.agility?.level || 0) - (a.attributes?.agility?.level || 0);

                case 'dexterity':
                    return (b.attributes?.dexterity?.level || 0) - (a.attributes?.dexterity?.level || 0);

                case 'intelligence':
                    return (b.attributes?.intelligence?.level || 0) - (a.attributes?.intelligence?.level || 0);

                case 'endurance':
                    return (b.attributes?.endurance?.level || 0) - (a.attributes?.endurance?.level || 0);

                case 'cases':
                    return b.casesCompleted - a.casesCompleted;

                case 'arrests':
                    return b.criminalsArrested - a.criminalsArrested;

                case 'totalWorkedHours':
                    return b.totalWorkedHours - a.totalWorkedHours;

                default:
                    return b.level - a.level;
            }
        });

        return leaderboard;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
};