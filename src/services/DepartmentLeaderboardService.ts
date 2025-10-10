// src/services/DepartmentLeaderboardService.ts
import { getLeaderboard } from './LeaderboardService';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { DEPARTMENT_UNITS } from '../data/departmentUnits';
import { PREFECTURES } from '../data/prefectures';
import { DepartmentCrimeStats, DepartmentCrimeDisplay } from '../types/crimeActivity';
import { cacheManager } from './CacheManager';
import { getCurrentServer } from '../utils/serverUtils';

// 30-minutiline cache
const DEPARTMENT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const CRIME_COLLECTION = 'departmentCrimeStats';

export interface DepartmentScore {
    id: string;
    name: string;
    type: 'unit' | 'prefecture';
    score: number;
    playerCount: number;
}

// Kombineeritud andmete struktuur
export interface DepartmentLeaderboardData {
    unitScores: DepartmentScore[];
    prefectureScores: DepartmentScore[];
    departmentScores: DepartmentScore[];
    crimeStats: DepartmentCrimeDisplay[];
    lastUpdated: Date;
}

const calculateDepartmentScores = (players: any[]): DepartmentScore[] => {
    const departmentScores: Record<string, DepartmentScore> = {};

    // Initialize all departments from all prefectures
    PREFECTURES.forEach(prefecture => {
        prefecture.departments.forEach(department => {
            if (department !== 'Sisekaitseakadeemia') { // Skip academy
                departmentScores[department] = {
                    id: department,
                    name: department,
                    type: 'unit', // Reusing type, or we could add 'department'
                    score: 0,
                    playerCount: 0
                };
            }
        });
    });

    // Sum up reputation for each department
    players.forEach(player => {
        // Skip abipolitseinik and null positions
        if (player.policePosition === 'abipolitseinik' || player.policePosition === null) return;

        if (player.department && departmentScores[player.department]) {
            departmentScores[player.department].score += player.reputation || 0;
            departmentScores[player.department].playerCount += 1;
        }
    });

    return Object.values(departmentScores)
        .filter(score => score.score > 0) // Only show departments with players
        .sort((a, b) => b.score - a.score);
};

// Get all possible department + unit combinations
const getAllDepartmentUnitCombinations = (): Array<{id: string, department: string, unit: string}> => {
    const combinations: Array<{id: string, department: string, unit: string}> = [];

    PREFECTURES.forEach(prefecture => {
        prefecture.departments.forEach(department => {
            DEPARTMENT_UNITS.forEach(unit => {
                combinations.push({
                    id: `${department}_${unit.id}`,
                    department: department,
                    unit: unit.name
                });
            });
        });
    });

    return combinations;
};

/**
 * Arvuta kuritegevuse andmed mängijate andmete põhjal (ei vaja eraldi päringut!)
 */
const calculateCrimeStatsFromPlayers = async (players: any[]): Promise<DepartmentCrimeDisplay[]> => {
    try {
        const currentServer = getCurrentServer();
        const crimeCollection = collection(firestore, CRIME_COLLECTION);
        const querySnapshot = await getDocs(crimeCollection);

        const results: DepartmentCrimeDisplay[] = [];

        for (const docSnap of querySnapshot.docs) {
            const docId = docSnap.id;

            // Filter by server
            if (currentServer === 'beta' && docId.includes('_')) continue;
            if (currentServer !== 'beta' && !docId.endsWith(`_${currentServer}`)) continue;

            const crimeData = docSnap.data() as DepartmentCrimeStats;

            // Arvuta osakonna mängijate arv juba laetud mängijate listist
            const departmentPlayers = players.filter(player =>
                player.department === crimeData.departmentId &&
                player.department !== 'Sisekaitseakadeemia' &&
                player.policePosition !== 'abipolitseinik' &&
                player.policePosition !== null
            );

            // Arvuta päevad resetini
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            results.push({
                departmentId: crimeData.departmentId,
                prefecture: crimeData.prefecture,
                currentCrimeLevel: crimeData.currentCrimeLevel,
                playerCount: departmentPlayers.length,
                lastUpdated: crimeData.lastUpdated.toDate(),
                daysUntilReset
            });
        }

        return results.sort((a, b) => b.currentCrimeLevel - a.currentCrimeLevel);

    } catch (error) {
        console.error('Error calculating crime stats from players:', error);
        return [];
    }
};

/**
 * PEAMINE MEETOD: laadib kõik osakonna andmed korraga cache'iga
 */
export const getAllDepartmentData = async (forceRefresh: boolean = false): Promise<DepartmentLeaderboardData> => {
    const currentServer = getCurrentServer();
    const cacheKey = `department_leaderboard_data_${currentServer}`;

    if (!forceRefresh) {
        const cached = cacheManager.get<DepartmentLeaderboardData>(cacheKey, DEPARTMENT_CACHE_DURATION);
        if (cached) {
            console.log('Department leaderboard data loaded from cache');
            return cached;
        }
    }

    console.log('Loading fresh department leaderboard data from Firebase...');

    try {
        const players = await getLeaderboard(1000);

        // Calculate all scores including the new department scores
        const [unitScores, prefectureScores, departmentScores, crimeStats] = await Promise.all([
            Promise.resolve(calculateUnitScores(players)),
            Promise.resolve(calculatePrefectureScores(players)),
            Promise.resolve(calculateDepartmentScores(players)),
            calculateCrimeStatsFromPlayers(players)
        ]);

        const data: DepartmentLeaderboardData = {
            unitScores,
            prefectureScores,
            departmentScores,
            crimeStats,
            lastUpdated: new Date()
        };

        cacheManager.set(cacheKey, data, DEPARTMENT_CACHE_DURATION);

        console.log(`Department data cached: ${unitScores.length} units, ${prefectureScores.length} prefectures, ${departmentScores.length} departments, ${crimeStats.length} crime stats`);

        return data;

    } catch (error) {
        console.error('Error loading department leaderboard data:', error);

        const staleCache = cacheManager.get<DepartmentLeaderboardData>(cacheKey, Infinity);
        if (staleCache) {
            console.log('Returning stale cache due to error');
            return staleCache;
        }

        return {
            unitScores: [],
            prefectureScores: [],
            departmentScores: [],
            crimeStats: [],
            lastUpdated: new Date()
        };
    }
};

/**
 * Leia konkreetse osakonna kuritegevuse andmed
 */
export const findDepartmentCrimeStats = (
    data: DepartmentLeaderboardData,
    departmentName: string
): DepartmentCrimeDisplay | null => {
    return data.crimeStats.find(
        stats => stats.departmentId === departmentName
    ) || null;
};

// Skooride arvutamise funktsioonid (sama loogika nagu varem)
const calculateUnitScores = (players: any[]): DepartmentScore[] => {
    const unitScores: Record<string, DepartmentScore> = {};

    // Initialize all combinations
    const combinations = getAllDepartmentUnitCombinations();
    combinations.forEach(combo => {
        unitScores[combo.id] = {
            id: combo.id,
            name: `${combo.department} ${combo.unit}`,
            type: 'unit',
            score: 0,
            playerCount: 0
        };
    });

    // Sum up reputation for each department + unit combination
    players.forEach(player => {
        if (player.policePosition === 'abipolitseinik' || player.policePosition === null) return;

        if (player.department && player.departmentUnit) {
            const unit = DEPARTMENT_UNITS.find(u => u.id === player.departmentUnit);
            if (unit) {
                const comboId = `${player.department}_${unit.id}`;
                if (unitScores[comboId]) {
                    unitScores[comboId].score += player.reputation || 0;
                    unitScores[comboId].playerCount += 1;
                }
            }
        }
    });

    return Object.values(unitScores)
        .filter(score => score.score > 0)
        .sort((a, b) => b.score - a.score);
};

const calculatePrefectureScores = (players: any[]): DepartmentScore[] => {
    const prefectureScores: Record<string, DepartmentScore> = {};

    // Initialize all prefectures
    PREFECTURES.forEach(prefecture => {
        prefectureScores[prefecture.id] = {
            id: prefecture.id,
            name: prefecture.name,
            type: 'prefecture',
            score: 0,
            playerCount: 0
        };
    });

    // Sum up reputation for each prefecture
    players.forEach(player => {
        if (player.policePosition === 'abipolitseinik' || player.policePosition === null) return;

        if (player.prefecture) {
            const matchedPrefecture = PREFECTURES.find(p =>
                p.id === player.prefecture ||
                p.name === player.prefecture
            );

            if (matchedPrefecture && prefectureScores[matchedPrefecture.id]) {
                prefectureScores[matchedPrefecture.id].score += player.reputation || 0;
                prefectureScores[matchedPrefecture.id].playerCount += 1;
            }
        }
    });

    return Object.values(prefectureScores)
        .sort((a, b) => b.score - a.score);
};