// src/data/workActivities/positions/emergency.ts
import { WorkActivity } from '../types';

// Emergency responder unit work activities
export const EMERGENCY_ACTIVITIES: WorkActivity[] = [
    {
        id: 'emergency_respond_work_01',
        name: 'Abista patrulle ohtlike isikute tabamisel',
        description: 'Kiirreageerijana oled valmis reageerima ja abistama patrullpolitseinike ohtlike isikute kinnipidamisel',
        minLevel: 50,
        requiredCourses: ['riot_police_course', 'medical_course_police'],
        baseExpPerHour: 750,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['kiirreageerija'],
    }
];