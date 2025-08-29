// src/data/workActivities/positions/emergency.ts
import { WorkActivity } from '../types';

// Emergency responder unit work activities
export const EMERGENCY_ACTIVITIES: WorkActivity[] = [
    {
        id: 'emergency_respond_work_01',
        name: 'Abista patrulle ohtlike isikute tabamisel',
        description: 'Kiirreageerijana oled valmis reageerima ja abistama patrullpolitseinike ohtlike isikute kinnipidamisel',
        minLevel: 50,
        requiredCourses: ['riot_police_course'],
        baseExpPerHour: 750,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['kiirreageerija'],
    },
    {
        id: 'emergency_respond_work_02',
        name: 'Julgesta erinevate ametkondade läbiotsinguid',
        description: 'Julgestad erinevaid uurimisasutusi ohtlike kurjategijate kodus, kus on oht ametnike elule või tervisele',
        minLevel: 60,
        requiredCourses: ['riot_police_course', 'emergency_police_course_houses'],
        baseExpPerHour: 950,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['kiirreageerija'],
    }
];