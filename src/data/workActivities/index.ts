// src/data/workActivities/index.ts

import { POSITION_WORK_ACTIVITIES, getDefaultWorkActivityForPosition } from './positionWorkActivities';

import { calculateWorkRewards as calculateWorkRewardsHelper, calculateSalaryForOfficer as calculateSalaryForOfficerHelper } from './helpers/rewards';

export type { WorkActivity, PlayerStatus, WorkRewards } from './types';

export { getDefaultWorkActivityForPosition };
export { POSITION_WORK_ACTIVITIES };

export const calculateWorkRewards = calculateWorkRewardsHelper;
export const calculateSalaryForOfficer = calculateSalaryForOfficerHelper;

export const getAvailableWorkActivities = (
    playerLevel: number,
    policePosition?: string | null | undefined
) => {
    const normalizedPosition = policePosition ?? null;
    const defaultActivity = getDefaultWorkActivityForPosition(normalizedPosition);

    if (defaultActivity && playerLevel >= defaultActivity.minLevel) {
        return [defaultActivity];
    }

    return [];
};

export const getWorkActivityById = (workId: string) => {
    return POSITION_WORK_ACTIVITIES.find(activity => activity.id === workId) || null;
};