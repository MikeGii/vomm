// src/data/workActivities/positions/cybercrime.ts
import { WorkActivity } from '../types';

// Cyber crime unit work activities
export const CYBERCRIME_ACTIVITIES: WorkActivity[] = [
    {
        id: 'cyber_crime_work_01',
        name: 'Jälgi internetis toimuvat',
        description: 'Uue liikmena küberkuritegevuse uurijate üksuses esmalt jälgid internetis pettuste ja muude halva kavatsustega isikute tegevust',
        minLevel: 55,
        requiredCourses: ['cyber_crime_course'],
        baseExpPerHour: 800,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['küberkriminalist'],
    }
];