// src/data/workActivities/positions/crimes.ts
import { WorkActivity } from '../types';

// Crime unit work activities
export const CRIME_ACTIVITIES: WorkActivity[] = [
    {
        id: 'crime_unit_work_01',
        name: 'Jälita tänavatel narkokaubitsejaid',
        description: 'Liigud tänavatel erariietes ja kogud infot narkokaubitsejate asukohtade, tegevuste ja liikumiste kohta',
        minLevel: 50,
        requiredCourses: ['detective_course'],
        baseExpPerHour: 850,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['jälitaja'],
    },
    {
        id: 'crime_unit_work_02',
        name: 'Lahenda raskeid varavastaseid süütegusid',
        description: 'Tegeled jaoskonnas bürokraatiaga ja väljas info kogumisega raskete varavastaste süütegude osas nagu röövimised ja väljapressimised',
        minLevel: 65,
        requiredCourses: ['narcotic_psyhotropic_substances'],
        baseExpPerHour: 950,
        expGrowthRate: 0.12,
        maxHours: 12,
        allowedFor: ['jälitaja'],
    }
];