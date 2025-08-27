// src/data/workActivities/helpers/rewards.ts
import { WorkActivity, WorkRewards } from '../types';

// Calculate total exp and money for work duration
export const calculateWorkRewards = (
    activity: WorkActivity,
    hours: number,
    playerRank?: string | null
): WorkRewards => {
    let totalExp = 0;

    for (let hour = 1; hour <= hours; hour++) {
        const hourExp = activity.baseExpPerHour * (1 + (activity.expGrowthRate * (hour - 1)));
        totalExp += Math.floor(hourExp);
    }

    // Calculate money for police officers (using rank for salary)
    const money = playerRank ? calculateSalaryForOfficer(playerRank, hours) : 0;

    return {
        experience: totalExp,
        money
    };
};

// Calculate salary based on rank and hours worked
export const calculateSalaryForOfficer = (rank: string | null, hours: number): number => {
    if (!rank) return 0;

    // Define hourly rates by rank
    const hourlyRates: Record<string, number> = {
        'inspektor': 120,
        'vaneminspektor': 140,
        'üleminspektor': 160,
        'komissar': 210,
        'vanemkomissar': 260
    };

    const normalizedRank = rank.toLowerCase();
    const hourlyRate = hourlyRates[normalizedRank] || 0;

    return hourlyRate * hours;
};