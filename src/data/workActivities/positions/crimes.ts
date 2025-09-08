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
    },
    {
        id: 'crime_unit_work_03',
        name: 'Lahenda isikuvastaseid süütegusid',
        description: 'Tegeled menetlustega, kus on toime pandud isikuvastased kuriteod nagu tapmised, raskete kehavigastuste tekitamine ja vägistamised.',
        minLevel: 75,
        requiredCourses: ['narcotic_psyhotropic_substances', 'anatomic_basic_course'],
        baseExpPerHour: 1150,
        expGrowthRate: 0.12,
        maxHours: 12,
        allowedFor: ['jälitaja'],
    },
    {
        id: 'crime_unit_work_04',
        name: 'Lahenda raskeid kuritegusid',
        description: 'Kogenud jälitajane lahendad kõiksugu raskeid kuritegusid ning teed koostööd rahvusvaheliselt, et tabada suuremaid grupeeringuid',
        minLevel: 85,
        requiredCourses: ['narcotic_psyhotropic_substances', 'anatomic_basic_course', 'detective_course_advanced_02'],
        baseExpPerHour: 1350,
        expGrowthRate: 0.12,
        maxHours: 12,
        allowedFor: ['jälitaja'],
    }
];