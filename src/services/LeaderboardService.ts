// src/services/LeaderboardService.ts
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    doc,
    getDoc
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { LeaderboardEntry, LeaderboardSortBy } from '../types';

export const getLeaderboard = async (
    sortBy: LeaderboardSortBy = 'level',
    limitCount: number = 50
): Promise<LeaderboardEntry[]> => {
    try {
        // First, let's get all player stats without complex ordering
        // We'll sort in memory to avoid Firestore index issues
        const statsQuery = query(
            collection(firestore, 'playerStats'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(statsQuery);
        console.log('Found players:', querySnapshot.size); // Debug log

        const leaderboard: LeaderboardEntry[] = [];

        // Process each player
        for (const statsDoc of querySnapshot.docs) {
            const playerData = statsDoc.data();
            console.log('Processing player:', statsDoc.id, playerData); // Debug log

            // Only include players who have completed training
            if (!playerData.hasCompletedTraining) {
                continue;
            }

            // Get username from users collection
            let username = 'Tundmatu';
            try {
                const userDoc = await getDoc(doc(firestore, 'users', statsDoc.id));
                if (userDoc.exists()) {
                    username = userDoc.data().username || 'Tundmatu';
                }
            } catch (error) {
                console.error('Error fetching username for', statsDoc.id, error);
            }

            leaderboard.push({
                userId: statsDoc.id,
                username,
                level: playerData.level || 1,
                experience: playerData.experience || 0,
                reputation: playerData.reputation || 0,
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
                    // Sort by level first, then by reputation
                    if (b.level !== a.level) {
                        return b.level - a.level;
                    }
                    return b.reputation - a.reputation;

                case 'reputation':
                    // Sort by reputation first, then by level
                    if (b.reputation !== a.reputation) {
                        return b.reputation - a.reputation;
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

        console.log('Final leaderboard:', leaderboard); // Debug log
        return leaderboard;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
};

// Optional: Get all players including those without training
export const getAllPlayersLeaderboard = async (
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

            // Get username
            let username = 'Tundmatu';
            try {
                const userDoc = await getDoc(doc(firestore, 'users', statsDoc.id));
                if (userDoc.exists()) {
                    username = userDoc.data().username || 'Tundmatu';
                }
            } catch (error) {
                console.error('Error fetching username for', statsDoc.id, error);
            }

            leaderboard.push({
                userId: statsDoc.id,
                username,
                level: playerData.level || 1,
                experience: playerData.experience || 0,
                reputation: playerData.reputation || 0,
                rank: playerData.rank || null,
                badgeNumber: playerData.badgeNumber || null,
                isEmployed: playerData.isEmployed || false,
                hasCompletedTraining: playerData.hasCompletedTraining || false,
                attributes: playerData.attributes,
                casesCompleted: playerData.casesCompleted || 0,
                criminalsArrested: playerData.criminalsArrested || 0,
                totalWorkedHours: playerData.totalWorkedHours || 0,
            });
        }

        // Sort in memory
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
                default:
                    return b.level - a.level;
            }
        });

        return leaderboard;
    } catch (error) {
        console.error('Error fetching all players leaderboard:', error);
        return [];
    }
};