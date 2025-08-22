// src/services/DepartmentLeaderboardService.ts
import { getLeaderboard } from './LeaderboardService';
import { DEPARTMENT_UNITS } from '../data/departmentUnits';
import { PREFECTURES } from '../data/prefectures';

export interface DepartmentScore {
    id: string;
    name: string;
    type: 'unit' | 'prefecture';
    score: number;
    playerCount: number;
}

// Get all possible department + unit combinations
const getAllDepartmentUnitCombinations = (): Array<{id: string, department: string, unit: string}> => {
    const combinations: Array<{id: string, department: string, unit: string}> = [];

    // Get all departments from all prefectures
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

// Process for department + unit combinations
export const getDepartmentUnitScores = async (): Promise<DepartmentScore[]> => {
    const players = await getLeaderboard(1000);
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
        // Skip abipolitseinik
        if (player.policePosition === 'abipolitseinik' || player.policePosition === null) return;

        if (player.department && player.departmentUnit) {
            // Try to match the unit ID (not the name)
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

    // Filter out zero scores and sort
    return Object.values(unitScores)
        .filter(score => score.score > 0)
        .sort((a, b) => b.score - a.score);
};

// Process for prefectures (simpler)
export const getPrefectureScores = async (): Promise<DepartmentScore[]> => {
    const players = await getLeaderboard(1000);
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
        // Skip abipolitseinik
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

    // Return all prefectures even if 0 (since there are only 4)
    return Object.values(prefectureScores)
        .sort((a, b) => b.score - a.score);
};