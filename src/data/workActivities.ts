// src/data/workActivities.ts
import { WorkActivity } from '../types';

// Regular patrol activities for Abipolitseinik and graduated officers
const PATROL_ACTIVITIES: WorkActivity[] = [
    {
        id: 'patrol_third_member',
        name: 'Alusta patrulli kolmanda liikmena',
        description: 'Abipolitseinikuna saad alustada patrulli kolmanda liikmena. Õpid kogenud kolleegidelt ja saad esimesi kogemusi tänaval.',
        minLevel: 1,
        requiredCourses: ['basic_police_training_abipolitseinik'],
        baseExpPerHour: 50,
        expGrowthRate: 0.15,
        maxHours: 12,
        allowedFor: ['abipolitseinik']
    },
    {
        id: 'patrol_second_member',
        name: 'Alusta patrulli teise liikmena',
        description: 'Kogenud abipolitseinikuna saad olla patrulli teine liige. Vastutad rohkem ja saad paremaid kogemusi.',
        minLevel: 10,
        requiredCourses: ['basic_police_training_abipolitseinik', 'firearm_training_abipolitseinik'],
        baseExpPerHour: 150,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['abipolitseinik']
    },
    {
        id: 'patrol_second_member_police',
        name: 'Alusta patrulli teise liikmena',
        description: 'Värskelt sisekaitseakadeemia lõpetanud ametnikuna suudad iseseisvalt toimida teise liikmena',
        minLevel: 30,
        requiredCourses: ['lopueksam'],
        baseExpPerHour: 250,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['politseiametnik']
    },
    {
        id: 'patrol_car_chief',
        name: 'Alusta patrulli toimkonna vanemana',
        description: 'Mõningase patrullkogemusega suudad juba iseseisvalt patrulltoimkonda juhtida',
        minLevel: 35,
        requiredCourses: ['lopueksam'],
        baseExpPerHour: 350,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['politseiametnik']
    }
];

// Academy student work activities
const ACADEMY_ACTIVITIES: WorkActivity[] = [
    {
        id: 'academy_guard_duty',
        name: 'Tööamps kolledži valvelauas',
        description: 'Täidad valvuri kohustusi Sisekaitseakadeemia valvelauas. Õpid turvalisuse põhitõdesid ja suhtlemist külastajatega.',
        minLevel: 20,
        requiredCourses: ['sisekaitseakadeemia_entrance'],
        baseExpPerHour: 200,
        expGrowthRate: 0.1,
        maxHours: 8,
        allowedFor: ['kadett']
    },
    {
        id: 'academy_police_practice',
        name: 'Praktika politseiteenistuses',
        description: 'Läbid praktikat päris politseijaoskonnas kogenud ametnike juhendamisel. Saad väärtuslikke kogemusi reaalsetest olukordadest.',
        minLevel: 25,
        requiredCourses: ['sisekaitseakadeemia_entrance'],
        baseExpPerHour: 250,
        expGrowthRate: 0.1,
        maxHours: 12,
        allowedFor: ['kadett']
    }
];

// Export combined work activities
export const WORK_ACTIVITIES: WorkActivity[] = [
    ...PATROL_ACTIVITIES,
    ...ACADEMY_ACTIVITIES
];

// Helper function to determine player status
type PlayerStatus = 'kadett' | 'abipolitseinik' | 'politseiametnik' | 'unknown';

const getPlayerStatus = (
    completedCourses: string[],
    rank: string | null
): PlayerStatus => {
    // Check if player graduated from academy
    if (completedCourses.includes('lopueksam')) {
        return 'politseiametnik';
    }

    // Check if player is a Kadett (in academy but not graduated)
    if (completedCourses.includes('sisekaitseakadeemia_entrance') &&
        !completedCourses.includes('lopueksam')) {
        return 'kadett';
    }

    // Check if player is an Abipolitseinik
    if (completedCourses.includes('basic_police_training_abipolitseinik') && !rank) {
        return 'abipolitseinik';
    }

    // Check if player has a rank (graduated officer)
    if (rank) {
        return 'politseiametnik';
    }

    return 'unknown';
};

// Updated helper function to get available work activities
export const getAvailableWorkActivities = (
    playerLevel: number,
    completedCourses: string[],
    rank: string | null = null
): WorkActivity[] => {
    const playerStatus = getPlayerStatus(completedCourses, rank);

    // If player status is unknown, return empty array
    if (playerStatus === 'unknown') {
        return [];
    }

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