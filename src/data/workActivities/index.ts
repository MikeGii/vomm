// src/data/workActivities/index.ts

// Import all activities from positions
import { PATROL_ACTIVITIES } from './positions/patrol';
import { ACADEMY_ACTIVITIES } from './positions/academy';
import { GROUP_LEADER_ACTIVITIES } from './positions/groupLeaders';
import { INVESTIGATION_ACTIVITIES } from './positions/investigation';
import { EMERGENCY_ACTIVITIES } from './positions/emergency';
import { K9_ACTIVITIES } from './positions/k9';
import { CYBERCRIME_ACTIVITIES } from './positions/cybercrime';
import { CRIME_ACTIVITIES } from './positions/crimes';

// Import helper functions
import { getPlayerStatus as getPlayerStatusHelper } from './helpers/playerStatus';
import { calculateWorkRewards as calculateWorkRewardsHelper, calculateSalaryForOfficer as calculateSalaryForOfficerHelper } from './helpers/rewards';
import { getAvailableWorkActivities as getAvailableWorkActivitiesFilter, getWorkActivityById as getWorkActivityByIdFilter } from './helpers/filters';
import {UNIT_LEADER_ACTIVITIES} from "./positions/unitLeaders";

// Export types
export type { WorkActivity, PlayerStatus, WorkRewards } from './types';

// Combine all work activities
export const WORK_ACTIVITIES = [
    ...PATROL_ACTIVITIES,
    ...ACADEMY_ACTIVITIES,
    ...GROUP_LEADER_ACTIVITIES,
    ...INVESTIGATION_ACTIVITIES,
    ...EMERGENCY_ACTIVITIES,
    ...K9_ACTIVITIES,
    ...CYBERCRIME_ACTIVITIES,
    ...CRIME_ACTIVITIES,
    ...UNIT_LEADER_ACTIVITIES
];

// Export helper functions with original names
export const getPlayerStatus = getPlayerStatusHelper;
export const calculateWorkRewards = calculateWorkRewardsHelper;
export const calculateSalaryForOfficer = calculateSalaryForOfficerHelper;

// Export convenience functions that use the combined activities
export const getAvailableWorkActivities = (
    playerLevel: number,
    completedCourses: string[],
    policePosition?: string | null
) => {
    return getAvailableWorkActivitiesFilter(
        playerLevel,
        completedCourses,
        WORK_ACTIVITIES,
        policePosition
    );
};

export const getWorkActivityById = (workId: string) => {
    return getWorkActivityByIdFilter(workId, WORK_ACTIVITIES);
};