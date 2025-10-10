// src/services/FightClubService.ts - ENHANCED VERSION
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    doc,
    getDoc
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';
import { cacheManager } from './CacheManager';
import { getCurrentServer, getServerSpecificId } from '../utils/serverUtils';

export interface EligiblePlayer {
    userId: string;
    username: string;
    level: number;
    wins: number;
    losses: number;
    attributes: {
        strength: number;
        agility: number;
        dexterity: number;
        endurance: number;
        intelligence: number;
    };
}

export interface FightClubPaginatedResult {
    players: EligiblePlayer[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

// Cache durations
const OPPONENT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const PLAYERS_PER_PAGE = 10;

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

/**
 * Get eligible players with pagination (cached for 30 minutes per page)
 */
export const getEligiblePlayersWithPagination = async (
    currentUserId: string,
    page: number = 1
): Promise<FightClubPaginatedResult> => {
    const currentServer = getCurrentServer();
    const serverSpecificUserId = getServerSpecificId(currentUserId, currentServer);

    // Get current user's stats
    const userDoc = await getDoc(doc(firestore, 'playerStats', serverSpecificUserId));
    if (!userDoc.exists()) {
        return {
            players: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
        };
    }

    const currentUserStats = userDoc.data() as PlayerStats;
    const currentUserLevel = currentUserStats.level;
    const cacheKey = `fightclub_opponents_${currentUserId}_page_${page}_level_${currentUserLevel}_${currentServer}`;

    // Check cache first
    const cached = cacheManager.get<FightClubPaginatedResult>(cacheKey);
    if (cached) {
        console.log(`Page ${page} loaded from cache (${cached.players.length} players)`);
        return cached;
    }

    try {
        // Query for players STRONGER than current user (higher or equal level)
        const strongerQuery = query(
            collection(firestore, 'playerStats'),
            where('level', '>=', currentUserLevel),
            where('attributes.strength.level', '>=', 10),
            where('attributes.dexterity.level', '>=', 10),
            where('attributes.agility.level', '>=', 10),
            orderBy('level', 'asc'), // Ascending to get closest first
            limit(15) // Get extra to account for filtering
        );

        // Query for players WEAKER than current user (lower level)
        const weakerQuery = query(
            collection(firestore, 'playerStats'),
            where('level', '<', currentUserLevel),
            where('level', '>=', 20), // Still enforce minimum level
            where('attributes.strength.level', '>=', 10),
            where('attributes.dexterity.level', '>=', 10),
            where('attributes.agility.level', '>=', 10),
            orderBy('level', 'desc'), // Descending to get closest first
            limit(15) // Get extra to account for filtering
        );

        // Execute both queries
        const [strongerSnapshot, weakerSnapshot] = await Promise.all([
            getDocs(strongerQuery),
            getDocs(weakerQuery)
        ]);

        const strongerPlayers: EligiblePlayer[] = [];
        const weakerPlayers: EligiblePlayer[] = [];

        // Process stronger players
        for (const statsDoc of strongerSnapshot.docs) {
            const docId = statsDoc.id;

            // Filter by server
            if (currentServer === 'beta' && docId.includes('_')) continue;
            if (currentServer !== 'beta' && !docId.endsWith(`_${currentServer}`)) continue;

            // Skip current user
            if (docId === serverSpecificUserId) continue;

            const playerData = statsDoc.data() as PlayerStats;
            const requirements = checkFightClubRequirements(playerData);
            if (!requirements.eligible) continue;

            const username = await getCachedUsername(docId);

            strongerPlayers.push({
                userId: docId,
                username,
                level: playerData.level,
                wins: playerData.fightClubStats?.wins || 0,
                losses: playerData.fightClubStats?.losses || 0,
                attributes: {
                    strength: playerData.attributes?.strength?.level || 0,
                    agility: playerData.attributes?.agility?.level || 0,
                    dexterity: playerData.attributes?.dexterity?.level || 0,
                    endurance: playerData.attributes?.endurance?.level || 0,
                    intelligence: playerData.attributes?.intelligence?.level || 0
                }
            });

            // Stop at 10 stronger players
            if (strongerPlayers.length >= 10) break;
        }

        // Process weaker players
        for (const statsDoc of weakerSnapshot.docs) {
            const docId = statsDoc.id;

            // Filter by server
            if (currentServer === 'beta' && docId.includes('_')) continue;
            if (currentServer !== 'beta' && !docId.endsWith(`_${currentServer}`)) continue;

            const playerData = statsDoc.data() as PlayerStats;
            const requirements = checkFightClubRequirements(playerData);
            if (!requirements.eligible) continue;

            const username = await getCachedUsername(docId);

            weakerPlayers.push({
                userId: docId,
                username,
                level: playerData.level,
                wins: playerData.fightClubStats?.wins || 0,
                losses: playerData.fightClubStats?.losses || 0,
                attributes: {
                    strength: playerData.attributes?.strength?.level || 0,
                    agility: playerData.attributes?.agility?.level || 0,
                    dexterity: playerData.attributes?.dexterity?.level || 0,
                    endurance: playerData.attributes?.endurance?.level || 0,
                    intelligence: playerData.attributes?.intelligence?.level || 0
                }
            });

            // Stop at 10 weaker players
            if (weakerPlayers.length >= 10) break;
        }

        // Combine both lists (weaker first, then stronger)
        const eligiblePlayers = [...strongerPlayers.reverse(), ...weakerPlayers];

        // Implement pagination
        const totalCount = eligiblePlayers.length;
        const totalPages = Math.ceil(totalCount / PLAYERS_PER_PAGE);
        const startIndex = (page - 1) * PLAYERS_PER_PAGE;
        const endIndex = startIndex + PLAYERS_PER_PAGE;
        const paginatedPlayers = eligiblePlayers.slice(startIndex, endIndex);

        const result: FightClubPaginatedResult = {
            players: paginatedPlayers,
            totalCount,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        };

        // Cache for 30 minutes
        cacheManager.set(cacheKey, result, OPPONENT_CACHE_DURATION);

        return result;

    } catch (error) {
        console.error('Error fetching eligible players:', error);
        return {
            players: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
        };
    }
};

/**
 * Get and cache username (to avoid repeated user collection reads)
 */
const getCachedUsername = async (serverSpecificUserId: string): Promise<string> => {
    // Extract base userId from server-specific ID
    const currentServer = getCurrentServer();
    const baseUserId = currentServer === 'beta'
        ? serverSpecificUserId
        : serverSpecificUserId.replace(`_${currentServer}`, '');

    const cacheKey = `username_${baseUserId}`;

    // Check cache first (cache usernames for 1 hour)
    const cached = cacheManager.get<string>(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const userDoc = await getDoc(doc(firestore, 'users', baseUserId));
        const username = userDoc.exists() ?
            (userDoc.data().username || 'Tundmatu kasutaja') :
            'Tundmatu kasutaja';

        // Cache for 1 hour
        cacheManager.set(cacheKey, username, 60 * 60 * 1000);

        return username;

    } catch (error) {
        console.error('Error fetching username for', baseUserId, error);
        return 'Tundmatu kasutaja';
    }
};

/**
 * Clear fight club cache (useful after fights or profile updates)
 */
export const clearFightClubCache = (userId?: string): void => {
    const currentServer = getCurrentServer();
    if (userId) {
        cacheManager.clearByPattern(`fightclub_opponents_${userId}_.*_${currentServer}`);
        cacheManager.clearByPattern(`fightclub_total_count_${userId}_${currentServer}`);
    } else {
        cacheManager.clearByPattern(`fightclub_.*_${currentServer}`);
    }
};
