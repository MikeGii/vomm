// src/data/workActivities/positions/k9.ts
import { WorkActivity } from '../types';

// K9 unit work activities
export const K9_ACTIVITIES: WorkActivity[] = [
    {
        id: 'K9_work_01',
        name: 'Teosta isikute otsinguid välitingimustes',
        description: 'K9 üksusena oled valmis reageerima ja abistama patrullpolitseinike eksinud / kadunud isikute otsingutel',
        minLevel: 45,
        requiredCourses: ['dog_handler_course'],
        baseExpPerHour: 700,
        expGrowthRate: 0.12,
        maxHours: 12,
        allowedFor: ['koerajuht'],
    },
    {
        id: 'K9_work_02',
        name: 'Teosta läbiotsinguid ruumides',
        description: 'K9 üksusena abistad patrullpolitseinike kui kiirreageerijaid läbiotsimistel keelatud ainete leidmisel',
        minLevel: 55,
        requiredCourses: ['dog_handler_course', 'emergency_police_course_houses'],
        baseExpPerHour: 950,
        expGrowthRate: 0.12,
        maxHours: 12,
        allowedFor: ['koerajuht'],
    },
    {
        id: 'K9_work_03',
        name: 'Abista patrulle ohtlike isikute tabamisel',
        description: 'K9 üksusena oled valmis reageerima ja abistama patrullpolitseinike ohtlike isikute kinnipidamisel',
        minLevel: 65,
        requiredCourses: ['dog_specialist_course', 'emergency_police_course_houses'],
        baseExpPerHour: 1150,
        expGrowthRate: 0.11,
        maxHours: 12,
        allowedFor: ['koerajuht'],
    }
];