// src/data/workActivities/positions/unitLeaders.ts
import { WorkActivity } from '../types';

export const UNIT_LEADER_ACTIVITIES: WorkActivity[] = [
    {
        id: 'patrol_unit_leader_01',
        name: 'Talituse juhi kohustused',
        description: 'Talituse juhina juhid tervet üksust, vastutad strateegiliste otsuste eest ja korraldad üksuse tegevust',
        minLevel: 85,
        requiredCourses: ['advanced_leader_course'],
        baseExpPerHour: 2000,
        expGrowthRate: 0.12,
        maxHours: 10,
        allowedFor: ['talituse_juht_patrol']
    },
    {
        id: 'investigation_unit_leader_01',
        name: 'Talituse juhi kohustused',
        description: 'Talituse juhina juhid tervet menetlusüksust ja vastutad keeruliste juhtumite koordineerimise eest',
        minLevel: 90,
        requiredCourses: ['advanced_leader_course', 'forensics_basics'],
        baseExpPerHour: 2200,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['talituse_juht_investigation']
    },

];