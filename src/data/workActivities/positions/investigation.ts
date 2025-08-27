// src/data/workActivities/positions/investigation.ts
import { WorkActivity } from '../types';

// Procedural unit work activities
export const INVESTIGATION_ACTIVITIES: WorkActivity[] = [
    {
        id: 'procedural_unit_work_01',
        name: 'Menetle väärteomaterjale',
        description: 'Uurijana pead menetlema ja lõpetama jaoskonda tulnud väärteomenetlusi',
        minLevel: 45,
        requiredCourses: ['evidence_place_course'],
        baseExpPerHour: 700,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['uurija'],
    }
];