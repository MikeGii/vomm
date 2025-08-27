// src/services/FightClubService.ts - ENHANCED VERSION
import {
    collection,
    query,
    where,
    orderBy,
    startAfter,
    limit,
    getDocs,
    doc,
    getDoc,
    DocumentSnapshot,
    QueryDocumentSnapshot
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';
import { cacheManager } from './CacheManager';

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
const TOTAL_COUNT_CACHE_DURATION = 60 * 60 * 1000; // 1 hour (changes less frequently)
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
 * Get total count of eligible opponents (cached for 1 hour)
 */
const getTotalEligibleCount = async (currentUserId: string): Promise<number> => {
    const cacheKey = `fightclub_total_count_${currentUserId}`;

    // Check cache first
    const cached = cacheManager.get<number>(cacheKey);
    if (cached !== null) {
        console.log('Total eligible count loaded from cache:', cached);
        return cached;
    }

    try {
        console.log('Fetching total eligible count from database...');

        // Build query for eligible players (level 20+, required attributes)
        const eligibleQuery = query(
            collection(firestore, 'playerStats'),
            where('level', '>=', 20),
            where('attributes.strength.level', '>=', 10),
            where('attributes.dexterity.level', '>=', 10),
            where('attributes.agility.level', '>=', 10)
        );

        const snapshot = await getDocs(eligibleQuery);

        // Filter out current user and double-check requirements
        let count = 0;
        snapshot.docs.forEach(doc => {
            if (doc.id === currentUserId) return;

            const playerData = doc.data() as PlayerStats;
            const requirements = checkFightClubRequirements(playerData);
            if (requirements.eligible) count++;
        });

        // Cache the result for 1 hour
        cacheManager.set(cacheKey, count, TOTAL_COUNT_CACHE_DURATION);

        console.log(`Total eligible opponents: ${count}`);
        return count;

    } catch (error) {
        console.error('Error fetching total eligible count:', error);
        return 0;
    }
};

/**
 * Get eligible players with pagination (cached for 30 minutes per page)
 */
export const getEligiblePlayersWithPagination = async (
    currentUserId: string,
    page: number = 1
): Promise<FightClubPaginatedResult> => {
    const cacheKey = `fightclub_opponents_${currentUserId}_page_${page}`;

    // Check cache first
    const cached = cacheManager.get<FightClubPaginatedResult>(cacheKey);
    if (cached) {
        console.log(`Page ${page} loaded from cache (${cached.players.length} players)`);
        return cached;
    }

    try {
        console.log(`Fetching page ${page} from database...`);

        // Get total count for pagination calculation
        const totalCount = await getTotalEligibleCount(currentUserId);
        const totalPages = Math.ceil(totalCount / PLAYERS_PER_PAGE);

        // Build paginated query - optimized with proper indexing
        let eligibleQuery = query(
            collection(firestore, 'playerStats'),
            where('level', '>=', 20),
            where('attributes.strength.level', '>=', 10),
            where('attributes.dexterity.level', '>=', 10),
            where('attributes.agility.level', '>=', 10),
            orderBy('level', 'desc'), // Order by level descending
            orderBy('reputation', 'desc'), // Then by reputation
            limit(PLAYERS_PER_PAGE * page) // Get all docs up to current page
        );

        const snapshot = await getDocs(eligibleQuery);
        const eligiblePlayers: EligiblePlayer[] = [];
        let processedCount = 0;

        // Process documents and implement client-side pagination
        for (const statsDoc of snapshot.docs) {
            // Skip current user
            if (statsDoc.id === currentUserId) continue;

            const playerData = statsDoc.data() as PlayerStats;

            // Double-check requirements
            const requirements = checkFightClubRequirements(playerData);
            if (!requirements.eligible) continue;

            processedCount++;

            // Skip to correct page (client-side pagination after filtering)
            const startIndex = (page - 1) * PLAYERS_PER_PAGE;
            const endIndex = page * PLAYERS_PER_PAGE;

            if (processedCount <= startIndex) continue;
            if (processedCount > endIndex) break;

            // Get username with caching
            const username = await getCachedUsername(statsDoc.id);

            // Get fight stats
            const fightClubStats = playerData.fightClubStats;

            eligiblePlayers.push({
                userId: statsDoc.id,
                username,
                level: playerData.level,
                wins: fightClubStats?.wins || 0,
                losses: fightClubStats?.losses || 0,
                attributes: {
                    strength: playerData.attributes?.strength?.level || 0,
                    agility: playerData.attributes?.agility?.level || 0,
                    dexterity: playerData.attributes?.dexterity?.level || 0,
                    endurance: playerData.attributes?.endurance?.level || 0,
                    intelligence: playerData.attributes?.intelligence?.level || 0
                }
            });
        }

        // Prepare result
        const result: FightClubPaginatedResult = {
            players: eligiblePlayers,
            totalCount,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        };

        // Cache result for 30 minutes
        cacheManager.set(cacheKey, result, OPPONENT_CACHE_DURATION);

        console.log(`Page ${page} fetched: ${eligiblePlayers.length} players`);
        return result;

    } catch (error) {
        console.error('Error fetching eligible players with pagination:', error);

        // Return empty result on error
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
const getCachedUsername = async (userId: string): Promise<string> => {
    const cacheKey = `username_${userId}`;

    // Check cache first (cache usernames for 1 hour)
    const cached = cacheManager.get<string>(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        const username = userDoc.exists() ?
            (userDoc.data().username || 'Tundmatu kasutaja') :
            'Tundmatu kasutaja';

        // Cache for 1 hour
        cacheManager.set(cacheKey, username, 60 * 60 * 1000);

        return username;

    } catch (error) {
        console.error('Error fetching username for', userId, error);
        return 'Tundmatu kasutaja';
    }
};

/**
 * Legacy function wrapper for backward compatibility
 * @deprecated Use getEligiblePlayersWithPagination instead
 */
export const getEligiblePlayers = async (currentUserId: string): Promise<EligiblePlayer[]> => {
    console.warn('getEligiblePlayers is deprecated. Use getEligiblePlayersWithPagination for better performance.');

    const result = await getEligiblePlayersWithPagination(currentUserId, 1);
    return result.players;
};

/**
 * Clear fight club cache (useful after fights or profile updates)
 */
export const clearFightClubCache = (userId?: string): void => {
    if (userId) {
        cacheManager.clearByPattern(`fightclub_opponents_${userId}`);
        cacheManager.clearByPattern(`fightclub_total_count_${userId}`);
        console.log(`Cleared fight club cache for user: ${userId}`);
    } else {
        cacheManager.clearByPattern('fightclub_');
        console.log('Cleared all fight club cache');
    }
};

/**
 * Force refresh fight club data
 */
export const refreshFightClubData = async (
    currentUserId: string,
    page: number = 1
): Promise<FightClubPaginatedResult> => {
    clearFightClubCache(currentUserId);
    return await getEligiblePlayersWithPagination(currentUserId, page);
};