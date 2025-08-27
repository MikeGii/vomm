// src/data/workActivities/positions/academy.ts
import { WorkActivity } from '../types';

// Academy student work activities
export const ACADEMY_ACTIVITIES: WorkActivity[] = [
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