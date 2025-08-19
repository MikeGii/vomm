// src/services/FightClubService.ts
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';

export interface EligiblePlayer {
    userId: string;
    username: string;
    level: number;
    attributes: {
        strength: number;
        agility: number;
        dexterity: number;
        endurance: number;
        intelligence: number;
    };
}

// Check if player meets fight club requirements
export const checkFightClubRequirements = (playerStats: PlayerStats): {
    eligible: boolean;
    missingRequirements: string[];
} => {
    const missingRequirements: string[] = [];

    // Check level requirement
    if (playerStats.level < 20) {
        missingRequirements.push(`Tase: ${playerStats.level}/20`);
    }

    // Check attribute requirements with proper null checks
    const attributes = playerStats.attributes;
    const strengthLevel = attributes?.strength?.level || 0;
    const dexterityLevel = attributes?.dexterity?.level || 0;
    const agilityLevel = attributes?.agility?.level || 0;

    if (strengthLevel < 10) {
        missingRequirements.push(`Jõud: ${strengthLevel}/10`);
    }
    if (dexterityLevel < 10) {
        missingRequirements.push(`Osavus: ${dexterityLevel}/10`);
    }
    if (agilityLevel < 10) {
        missingRequirements.push(`Kiirus: ${agilityLevel}/10`);
    }

    return {
        eligible: missingRequirements.length === 0,
        missingRequirements
    };
};

// Get all eligible players for fight club
export const getEligiblePlayers = async (currentUserId: string): Promise<EligiblePlayer[]> => {
    try {
        // Get all player stats
        const statsQuery = query(collection(firestore, 'playerStats'));
        const querySnapshot = await getDocs(statsQuery);

        const eligiblePlayers: EligiblePlayer[] = [];

        for (const statsDoc of querySnapshot.docs) {
            // Skip current user
            if (statsDoc.id === currentUserId) continue;

            const playerData = statsDoc.data() as PlayerStats;

            // Check if player meets requirements
            const requirements = checkFightClubRequirements(playerData);
            if (!requirements.eligible) continue;

            // Get username from users collection
            let username = 'Tundmatu kasutaja';
            try {
                const userDoc = await getDoc(doc(firestore, 'users', statsDoc.id));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    username = userData.username || 'Tundmatu kasutaja';
                }
            } catch (error) {
                console.error('Error fetching username for', statsDoc.id, error);
            }

            eligiblePlayers.push({
                userId: statsDoc.id,
                username,
                level: playerData.level,
                attributes: {
                    strength: playerData.attributes?.strength?.level || 0,
                    agility: playerData.attributes?.agility?.level || 0,
                    dexterity: playerData.attributes?.dexterity?.level || 0,
                    endurance: playerData.attributes?.endurance?.level || 0,
                    intelligence: playerData.attributes?.intelligence?.level || 0
                }
            });
        }

        // Sort by level descending
        eligiblePlayers.sort((a, b) => b.level - a.level);

        return eligiblePlayers;

    } catch (error) {
        console.error('Error fetching eligible players:', error);
        return [];
    }
};