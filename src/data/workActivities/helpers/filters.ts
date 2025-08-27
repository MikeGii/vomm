// src/data/workActivities/helpers/filters.ts
import { WorkActivity, PlayerStatus } from '../types';
import { getPlayerStatus } from './playerStatus';

// Get available work activities for player
export const getAvailableWorkActivities = (
    playerLevel: number,
    completedCourses: string[],
    allActivities: WorkActivity[],
    policePosition?: string | null
): WorkActivity[] => {
    const playerStatus = getPlayerStatus(policePosition);

    // If player status is unknown, return empty array
    if (playerStatus === 'unknown') {
        return [];
    }

    return allActivities.filter(activity => {
        // Check level requirement
        if (activity.minLevel > playerLevel) return false;

        // Check course requirements
        if (activity.requiredCourses) {
            const hasAllCourses = activity.requiredCourses.every(
                courseId => completedCourses.includes(courseId)
            );
            if (!hasAllCourses) return false;
        }

        // Check if player status allows this activity
        if (activity.allowedFor) {
            // Cast to exclude 'unknown' since we handled it above
            if (!activity.allowedFor.includes(playerStatus as Exclude<PlayerStatus, 'unknown'>)) {
                return false;
            }
        }

        return true;
    });
};

// Find specific work activity by ID
export const getWorkActivityById = (
    workId: string,
    allActivities: WorkActivity[]
): WorkActivity | undefined => {
    return allActivities.find(activity => activity.id === workId);
};