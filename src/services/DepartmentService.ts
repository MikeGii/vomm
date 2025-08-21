// src/services/DepartmentService.ts
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';
import { PREFECTURES } from '../data/prefectures';

export interface GraduatedPlayer {
    uid: string;
    username: string;
    level: number;
    rank: string;
    prefecture: string;
    department: string;
    departmentUnit: string;
    badgeNumber: string;
    reputation: number;
}

export interface PrefectureStats {
    name: string;
    totalPlayers: number;
    departments: DepartmentStats[];
}

export interface DepartmentStats {
    name: string;
    playerCount: number;
    prefecture: string;
}

interface DepartmentPlayersCache {
    data: GraduatedPlayer[];
    timestamp: number;
    cacheKey: string;
}

interface HierarchyStatsCache {
    prefectureStats: PrefectureStats[];
    timestamp: number;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// Cache storage
const playersCache = new Map<string, DepartmentPlayersCache>();
let hierarchyStatsCache: HierarchyStatsCache | null = null;

/**
 * Get all graduated players with smart caching
 * This is the main optimization - ONE query for all graduated players
 */
export const getAllGraduatedPlayers = async (): Promise<GraduatedPlayer[]> => {
    const cacheKey = 'all-graduated';

    // Check cache first
    const cached = playersCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        return cached.data;
    }

    try {
        // ONE QUERY for ALL graduated players
        const q = query(
            collection(firestore, 'playerStats'),
            where('completedCourses', 'array-contains', 'lopueksam')
        );

        const querySnapshot = await getDocs(q);
        const players: GraduatedPlayer[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data() as PlayerStats;

            // Only include players with all required data
            if (data.prefecture && data.department && data.username) {
                players.push({
                    uid: doc.id,
                    username: data.username,
                    level: data.level || 1,
                    rank: data.rank || 'Määramata',
                    prefecture: data.prefecture,
                    department: data.department,
                    departmentUnit: data.departmentUnit || 'patrol',
                    badgeNumber: data.badgeNumber || 'Määramata',
                    reputation: data.reputation || 0
                });
            }
        });

        // Cache the result
        playersCache.set(cacheKey, {
            data: players,
            timestamp: Date.now(),
            cacheKey
        });

        console.log(`Loaded ${players.length} graduated players from database`);
        return players;

    } catch (error) {
        console.error('Error loading graduated players:', error);
        return [];
    }
};

export const getPlayersByUnit = async (
    prefecture: string,
    department: string,
    unit: string
): Promise<GraduatedPlayer[]> => {
    const allPlayers = await getAllGraduatedPlayers();
    return allPlayers.filter(
        player => player.prefecture === prefecture &&
            player.department === department &&
            player.departmentUnit === unit
    );
};

/**
 * Get players by prefecture (filtered from cache)
 */
export const getPlayersByPrefecture = async (prefecture: string): Promise<GraduatedPlayer[]> => {
    const allPlayers = await getAllGraduatedPlayers();
    return allPlayers.filter(player => player.prefecture === prefecture);
};

/**
 * Get players by department (filtered from cache)
 */
export const getPlayersByDepartment = async (
    prefecture: string,
    department: string
): Promise<GraduatedPlayer[]> => {
    const allPlayers = await getAllGraduatedPlayers();
    return allPlayers.filter(
        player => player.prefecture === prefecture && player.department === department
    );
};

/**
 * Get hierarchy statistics (prefectures with department counts)
 */
export const getHierarchyStats = async (): Promise<PrefectureStats[]> => {
    // Check cache first
    if (hierarchyStatsCache && (Date.now() - hierarchyStatsCache.timestamp < CACHE_DURATION)) {
        return hierarchyStatsCache.prefectureStats;
    }

    try {
        const allPlayers = await getAllGraduatedPlayers();
        const prefectureStats: PrefectureStats[] = [];

        // Process each prefecture
        PREFECTURES.forEach(prefecture => {
            const prefecturePlayers = allPlayers.filter(p => p.prefecture === prefecture.name);

            // Calculate department stats
            const departmentStats: DepartmentStats[] = prefecture.departments.map(dept => {
                const deptPlayers = prefecturePlayers.filter(p => p.department === dept);
                return {
                    name: dept,
                    playerCount: deptPlayers.length,
                    prefecture: prefecture.name
                };
            });

            prefectureStats.push({
                name: prefecture.name,
                totalPlayers: prefecturePlayers.length,
                departments: departmentStats
            });
        });

        // Cache the stats
        hierarchyStatsCache = {
            prefectureStats,
            timestamp: Date.now()
        };

        return prefectureStats;

    } catch (error) {
        console.error('Error calculating hierarchy stats:', error);
        return [];
    }
};

/**
 * Clear cache (useful for manual refresh)
 */
export const clearDepartmentCache = (): void => {
    playersCache.clear();
    hierarchyStatsCache = null;
    console.log('Department cache cleared');
};

/**
 * Get cache status for debugging
 */
export const getDepartmentCacheStatus = () => {
    return {
        playersCache: {
            size: playersCache.size,
            keys: Array.from(playersCache.keys())
        },
        hierarchyStatsCache: hierarchyStatsCache ? {
            timestamp: hierarchyStatsCache.timestamp,
            age: Date.now() - hierarchyStatsCache.timestamp
        } : null
    };
};