// src/data/workActivities.ts
import { WorkActivity } from '../types';

export const WORK_ACTIVITIES: WorkActivity[] = [
    {
        id: 'patrol_third_member',
        name: 'Alusta patrulli kolmanda liikmena',
        description: 'Abipolitseinikuna saad alustada patrulli kolmanda liikmena. Õpid kogenud kolleegidelt ja saad esimesi kogemusi tänaval.',
        minLevel: 1,
        requiredCourses: ['basic_police_training'],
        baseExpPerHour: 50,
        expGrowthRate: 0.15,
        maxHours: 12
    },
    {
        id: 'patrol_second_member',
        name: 'Alusta patrulli teise liikmena',
        description: 'Kogenud abipolitseinikuna saad olla patrulli teine liige. Vastutad rohkem ja saad paremaid kogemusi.',
        minLevel: 10,
        requiredCourses: ['basic_police_training', 'firearm_training'],
        baseExpPerHour: 150,
        expGrowthRate: 0.10,
        maxHours: 12
    }
];

// Helper functions
export const getAvailableWorkActivities = (
    playerLevel: number,
    completedCourses: string[]
): WorkActivity[] => {
    return WORK_ACTIVITIES.filter(activity => {
        // Check level requirement
        if (activity.minLevel > playerLevel) return false;

        // Check course requirements
        if (activity.requiredCourses) {
            const hasAllCourses = activity.requiredCourses.every(
                courseId => completedCourses.includes(courseId)
            );
            if (!hasAllCourses) return false;
        }

        return true;
    });
};

export const getWorkActivityById = (workId: string): WorkActivity | undefined => {
    return WORK_ACTIVITIES.find(activity => activity.id === workId);
};

// Calculate total exp for work duration
export const calculateWorkRewards = (
    activity: WorkActivity,
    hours: number
): number => {
    let totalExp = 0;

    for (let hour = 1; hour <= hours; hour++) {
        const hourExp = activity.baseExpPerHour * (1 + (activity.expGrowthRate * (hour - 1)));
        totalExp += Math.floor(hourExp);
    }

    return totalExp;
};