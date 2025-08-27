// src/data/workActivities/positions/k9.ts
import { WorkActivity } from '../types';

// K9 unit work activities
export const K9_ACTIVITIES: WorkActivity[] = [
    {
        id: 'K9_work_01',
        name: 'Abista patrulle ohtlike isikute tabamisel',
        description: 'K9 üksusena oled valmis reageerima ja abistama patrullpolitseinike ohtlike isikute kinnipidamisel ja sõidukite läbiotsimisel',
        minLevel: 45,
        requiredCourses: ['dog_handler_course'],
        baseExpPerHour: 700,
        expGrowthRate: 0.12,
        maxHours: 12,
        allowedFor: ['koerajuht'],
    }
];