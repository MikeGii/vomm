// src/services/LeaderboardService.ts
import {
    collection,
    query,
    limit,
    getDocs
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { LeaderboardEntry } from '../types';

const EXCLUDED_USERNAMES = ['L22ne13'];

export const getLeaderboard = async (
    limitCount: number = 100
): Promise<LeaderboardEntry[]> => {
    try {
        const statsQuery = query(
            collection(firestore, 'playerStats'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(statsQuery);
        const leaderboard: LeaderboardEntry[] = [];

        querySnapshot.docs.forEach((statsDoc) => {
            const playerData = statsDoc.data();

            const hasCompletedBasicTraining = playerData.completedCourses?.includes('basic_police_training_abipolitseinik') || false;
            if (!hasCompletedBasicTraining) {
                return; // Skip
            }

            if (playerData.username && EXCLUDED_USERNAMES.includes(playerData.username)) {
                return; // Skip this user
            }

            if (playerData.excludeFromLeaderboard === true) {
                return;
            }

            leaderboard.push({
                userId: statsDoc.id,
                username: playerData.username || 'Tundmatu',
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
        });

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