// src/services/PlayerProfileService.ts
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerProfileModalData, User, PlayerStats, FirestoreTimestamp } from '../types';
import { getCurrentServer, getServerSpecificId } from '../utils/serverUtils';

export const getPlayerProfileData = async (userId: string): Promise<PlayerProfileModalData | null> => {
    try {
        // Fetch both user data and player stats
        const serverSpecificId = getServerSpecificId(userId, getCurrentServer());
        const [userDoc, statsDoc] = await Promise.all([
            getDoc(doc(firestore, 'users', userId)), // users collection is global
            getDoc(doc(firestore, 'playerStats', serverSpecificId)) // playerStats is server-specific
        ]);

        if (!userDoc.exists() || !statsDoc.exists()) {
            return null;
        }

        const userData = userDoc.data() as User;
        const playerStats = statsDoc.data() as PlayerStats;

        // Convert Firestore Timestamp to Date if necessary
        let createdAtDate: Date | undefined;
        if (userData.createdAt) {
            if (userData.createdAt instanceof Timestamp) {
                createdAtDate = userData.createdAt.toDate();
            } else if (typeof userData.createdAt === 'object' && userData.createdAt !== null && 'seconds' in userData.createdAt) {
                // Type guard and cast to FirestoreTimestamp
                const firestoreTimestamp = userData.createdAt as FirestoreTimestamp;
                createdAtDate = new Date(firestoreTimestamp.seconds * 1000);
            } else if (userData.createdAt instanceof Date) {
                createdAtDate = userData.createdAt;
            } else {
                // Fallback: try to create Date from string or number
                try {
                    createdAtDate = new Date(userData.createdAt as any);
                } catch (error) {
                    console.error('Error parsing createdAt date:', error);
                    createdAtDate = undefined;
                }
            }
        }

        return {
            userId,
            username: userData.username,
            level: playerStats.level,
            reputation: playerStats.reputation,
            money: playerStats.money,
            badgeNumber: playerStats.badgeNumber,
            policePosition: playerStats.policePosition,
            attributes: playerStats.attributes,
            createdAt: createdAtDate,
            completedCourses: playerStats.completedCourses || [],
            totalWorkedHours: playerStats.totalWorkedHours || 0,
        };
    } catch (error) {
        console.error('Error fetching player profile data:', error);
        return null;
    }
};