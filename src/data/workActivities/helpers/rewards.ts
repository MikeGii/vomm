// src/data/workActivities/helpers/rewards.ts
import { WorkActivity, WorkRewards } from '../types';
import { isUnitLeader} from "../../../utils/playerStatus";
import { PlayerStats} from "../../../types";

// Calculate total exp and money for work duration with player bonuses
export const calculateWorkRewards = (
    activity: WorkActivity,
    hours: number,
    playerRank?: string | null,
    playerStats?: PlayerStats
): WorkRewards => {
    let baseExp = 0;

    // Calculate base experience from work activity (existing logic)
    for (let hour = 1; hour <= hours; hour++) {
        const hourExp = activity.baseExpPerHour * (1 + (activity.expGrowthRate * (hour - 1)));
        baseExp += Math.floor(hourExp);
    }

    // Apply player level and attribute bonuses
    const finalExp = applyPlayerBonuses(baseExp, playerStats);

    // Calculate money for police officers (using rank and position for salary)
    const money = playerRank && playerStats ? calculateSalaryForOfficer(playerRank, hours, playerStats) : 0;

    return {
        experience: finalExp,
        money
    };
};

// Apply player level and attribute bonuses to base experience
const applyPlayerBonuses = (baseExp: number, playerStats?: PlayerStats): number => {
    if (!playerStats) return baseExp;

    // Player level bonus: 3% per level starting from level 30
    const playerLevel = playerStats.level || 1;
    let levelBonus = 0;
    if (playerLevel >= 30) {
        levelBonus = (playerLevel - 29) * 0.03; // 3% for each level above 29
    }
    const levelMultiplier = 1 + levelBonus;

    // Attribute bonus: 0.01% per attribute level
    const totalAttributes = getTotalAttributeLevels(playerStats);
    const attributeBonus = totalAttributes * 0.0001; // 0.01% = 0.0001
    const attributeMultiplier = 1 + attributeBonus;

    // Apply both multipliers
    const finalExp = Math.floor(baseExp * levelMultiplier * attributeMultiplier);

    return finalExp;
};

// Calculate total attribute levels from player stats
const getTotalAttributeLevels = (playerStats: PlayerStats): number => {
    if (!playerStats.attributes) return 0;

    const attributes = playerStats.attributes;
    return (
        (attributes.strength?.level || 0) +
        (attributes.agility?.level || 0) +
        (attributes.dexterity?.level || 0) +
        (attributes.intelligence?.level || 0) +
        (attributes.endurance?.level || 0)
    );
};

// Calculate salary based on rank, position, and hours worked
export const calculateSalaryForOfficer = (rank: string | null, hours: number, playerStats: PlayerStats): number => {
    if (!rank) return 0;

    const normalizedRank = rank.toLowerCase();
    const hourlyRate = getHourlyRateByRankAndPosition(normalizedRank, playerStats);

    return hourlyRate * hours;
};

// Determine hourly rate based on rank and position
const getHourlyRateByRankAndPosition = (rank: string, playerStats: PlayerStats): number => {
    const isUnitLeaderPosition = isUnitLeader(playerStats);

    // Define hourly rates by rank with position-based logic
    switch (rank) {
        // Standard worker ranks
        case 'inspektor':
            return 120;
        case 'vaneminspektor':
            return 140;
        case 'üleminspektor':
            return 160;
        case 'komissar':
            return 210;
        case 'vanemkomissar':
            return 260; // Same for both standard workers and group leaders at this level

        // Leadership ranks
        case 'politseileitnant':
            return 340; // Only group leaders should have this rank based on our logic

        case 'politseikapten':
            return isUnitLeaderPosition ? 480 : 440; // Unit: 480€, Group: 440€

        case 'politseimajor':
            return 600; // Unit leader only

        case 'politseikolonelleitnant':
            return 740; // Unit leader only

        default:
            return 0;
    }
};