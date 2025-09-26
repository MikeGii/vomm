// src/data/workActivities/helpers/rewards.ts
import { WorkActivity, WorkRewards } from '../types';
import { isUnitLeader} from "../../../utils/playerStatus";
import { PlayerStats} from "../../../types";
import { DepartmentUnitService } from '../../../services/DepartmentUnitService';

// Calculate total exp and money for work duration with player bonuses
export const calculateWorkRewards = async (  // CHANGED TO ASYNC
    activity: WorkActivity,
    hours: number,
    playerRank?: string | null,
    playerStats?: PlayerStats
): Promise<WorkRewards> => {  // CHANGED TO PROMISE
    let baseExp = 0;

    // Calculate base experience from work activity (existing logic)
    for (let hour = 1; hour <= hours; hour++) {
        const hourExp = activity.baseExpPerHour * (1 + (activity.expGrowthRate * (hour - 1)));
        baseExp += Math.floor(hourExp);
    }

    // Apply player level and attribute bonuses
    let finalExp = applyPlayerBonuses(baseExp, playerStats);

    // Calculate base money for police officers
    let money = playerRank && playerStats ? calculateSalaryForOfficer(playerRank, hours, playerStats) : 0;

    // NEW: Apply department unit bonuses if player is in a unit
    if (playerStats?.department && playerStats?.departmentUnit) {
        try {
            const unitBonuses = await DepartmentUnitService.getUnitBonuses(
                playerStats.department,
                playerStats.departmentUnit
            );

            // Apply work XP bonus
            if (unitBonuses.workXpBonus > 0) {
                const xpMultiplier = 1 + (unitBonuses.workXpBonus / 100);
                finalExp = Math.floor(finalExp * xpMultiplier);
            }

            // Apply salary bonus
            if (unitBonuses.salaryBonus > 0) {
                const salaryMultiplier = 1 + (unitBonuses.salaryBonus / 100);
                money = Math.floor(money * salaryMultiplier);
            }
        } catch (error) {
            console.error('Error applying department unit bonuses:', error);
            // Continue with base values if bonus fetch fails
        }
    }

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