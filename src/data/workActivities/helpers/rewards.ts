// src/data/workActivities/helpers/rewards.ts
import { WorkActivity, WorkRewards } from '../types';
import { isUnitLeader} from "../../../utils/playerStatus";
import { PlayerStats} from "../../../types";

// Calculate total exp and money for work duration
export const calculateWorkRewards = (
    activity: WorkActivity,
    hours: number,
    playerRank?: string | null,
    playerStats?: PlayerStats
): WorkRewards => {
    let totalExp = 0;

    for (let hour = 1; hour <= hours; hour++) {
        const hourExp = activity.baseExpPerHour * (1 + (activity.expGrowthRate * (hour - 1)));
        totalExp += Math.floor(hourExp);
    }

    // Calculate money for police officers (using rank and position for salary)
    const money = playerRank && playerStats ? calculateSalaryForOfficer(playerRank, hours, playerStats) : 0;

    return {
        experience: totalExp,
        money
    };
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