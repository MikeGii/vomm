// src/utils/rankUtils.ts

import {PlayerStats} from "../types";
import {isGroupLeader, isUnitLeader} from "./playerStatus";

export const getRankImagePath = (rank: string | null): string | null => {
    if (!rank) return null;

    // Map ranks to their corresponding image files in public/images folder
    const rankImageMap: Record<string, string> = {
        'nooreminspektor': '/images/nooreminspektor.png',
        'inspektor': '/images/inspektor.png',
        'vaneminspektor': '/images/vaneminspektor.png',
        'üleminspektor': '/images/yleminspektor.png',
        'komissar': '/images/komissar.png',
        'vanemkomissar': '/images/vanemkomissar.png',
        'politseileitnant': '/images/politseileitnant.png',
        'politseikapten': '/images/politseikapten.png',
        'politseimajor': '/images/politseimajor.png',
        'politseikolonelleitnant': '/images/politseikolonelleitnant.png'
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
    if (!hasGraduated) return null;

    const currentLevel = playerStats.level || 1;

    // Unit Leaders - Highest priority
    if (isUnitLeader(playerStats)) {
        if (currentLevel >= 105) return 'politseikolonelleitnant';
        if (currentLevel >= 95) return 'politseimajor';
        return 'politseikapten'; // minimum for unit leaders
    }

    // Group Leaders - Second priority
    if (isGroupLeader(playerStats)) {
        if (currentLevel >= 85) return 'politseikapten';
        if (currentLevel >= 70) return 'politseileitnant';
        return 'vanemkomissar'; // minimum for group leaders
    }

    // Standard workers - Level based
    if (currentLevel >= 100) return 'vanemkomissar';
    if (currentLevel >= 80) return 'komissar';
    if (currentLevel >= 60) return 'üleminspektor';
    if (currentLevel >= 40) return 'vaneminspektor';
    return 'inspektor';
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
