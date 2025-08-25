// src/utils/rankUtils.ts

import {PlayerStats} from "../types";

export const getRankImagePath = (rank: string | null): string | null => {
    if (!rank) return null;

    // Map ranks to their corresponding image files in public/images folder
    const rankImageMap: Record<string, string> = {
        'nooreminspektor': '/images/nooreminspektor.png',
        'inspektor': '/images/inspektor.png',
        'vaneminspektor': '/images/vaneminspektor.png',
        'üleminspektor': '/images/yleminspektor.png',
        'komissar': '/images/komissar.png',
        'vanemkomissar': '/images/vanemkomissar.png'
    };

    // Convert to lowercase for case-insensitive matching
    const normalizedRank = rank.toLowerCase();
    return rankImageMap[normalizedRank] || null;
};

/**
 * Automatically updates player rank based on position, level and graduation status
 * Group leader status takes priority over level-based ranks
 * @param playerStats - Current player stats
 * @returns Updated rank if promotion is needed, current rank if no change
 */
export const getCorrectRank = (playerStats: PlayerStats): string | null => {
    const hasGraduated = playerStats.completedCourses?.includes('lopueksam') || false;

    // If not graduated, no rank
    if (!hasGraduated) {
        return null;
    }

    // Check if player is a group leader - this takes priority over level
    const isGroupLeaderPosition = [
        'grupijuht_patrol',
        'grupijuht_investigation',
        'grupijuht_emergency',
        'grupijuht_k9',
        'grupijuht_cyber',
        'grupijuht_crimes'
    ].includes(playerStats.policePosition || '');

    // Group leaders are always Vanemkomissar regardless of level
    if (isGroupLeaderPosition) {
        return 'vanemkomissar';
    }

    // For non-group leaders, use level-based promotion
    const currentLevel = playerStats.level || 1;

    if (currentLevel >= 80) {
        return 'komissar';
    } else if (currentLevel >= 60) {
        return 'üleminspektor';
    } else if (currentLevel >= 40) {
        return 'vaneminspektor';
    } else {
        // Default rank after graduation
        return 'inspektor';
    }
};

/**
 * Checks if player rank needs updating and returns the correct rank
 * @param playerStats - Current player stats
 * @returns New rank if update needed, null if current rank is correct
 */
export const checkRankUpdate = (playerStats: PlayerStats): string | null => {
    const correctRank = getCorrectRank(playerStats);

    // If the correct rank is different from current rank, return the new rank
    if (correctRank !== playerStats.rank) {
        return correctRank;
    }

    return null; // No update needed
};
