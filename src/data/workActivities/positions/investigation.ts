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
    },
    {
        id: 'procedural_unit_work_02',
        name: 'Menetle lihtsamaid kuriteo materjale',
        description: 'Uurijana pead koguma tõendeid, kuulama üle kahtlusaluseid ja tegema kuriteo materjale prokuratuuri',
        minLevel: 55,
        requiredCourses: ['enhanced_law_studies_advanced'],
        baseExpPerHour: 900,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['uurija'],
    },
    {
        id: 'procedural_unit_work_03',
        name: 'Menetle kuriteo materjale',
        description: 'Uurijana tegeled kuriteomaterjalidega, mis jäävad lahendada jaoskonnale ja ei liigu prefektuuri tasandile teistele raskete kuritegudega' +
            ' tegelevatele talitustele',
        minLevel: 65,
        requiredCourses: ['enhanced_law_studies_advanced', 'narcotic_psyhotropic_substances', 'evidence_place_course'],
        baseExpPerHour: 1000,
        expGrowthRate: 0.11,
        maxHours: 8,
        allowedFor: ['uurija'],
    }
];