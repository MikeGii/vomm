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
    },
    {
        id: 'emergency_respond_work_03',
        name: 'Erioperatsioonid - relvastatud isikud sõidukis',
        description: 'Teostad PPA või muu ametiasutuse poolt tellitud võimaliku relvastatud isikutega sõiduki kinnipidamiseks',
        minLevel: 70,
        requiredCourses: ['riot_police_course_02', 'emergency_police_course_houses'],
        baseExpPerHour: 1150,
        expGrowthRate: 0.11,
        maxHours: 12,
        allowedFor: ['kiirreageerija'],
    },
    {
        id: 'emergency_respond_work_04',
        name: 'Erioperatsioonid - relvastatud isikud hoones',
        description: 'Teostad PPA või muu ametiasutuse poolt tellitud võimaliku relvastatud ja kuritegelike isikute kinnipidamiseks hoones',
        minLevel: 80,
        requiredCourses: ['riot_police_course_02', 'emergency_police_course_houses', 'medical_course_police_advanced_02'],
        baseExpPerHour: 1350,
        expGrowthRate: 0.11,
        maxHours: 12,
        allowedFor: ['kiirreageerija'],
    }
];