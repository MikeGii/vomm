// src/data/workActivities/positions/unitLeaders.ts
import { WorkActivity } from '../types';

export const UNIT_LEADER_ACTIVITIES: WorkActivity[] = [

    // Patrol unit leader work activities

    {
        id: 'patrol_unit_leader_01',
        name: 'Talituse juhi kohustused',
        description: 'Talituse juhina juhid tervet üksust ja korraldad üksuse tegevust',
        minLevel: 85,
        requiredCourses: ['advanced_leader_course', 'basic_computer_course'],
        baseExpPerHour: 2000,
        expGrowthRate: 0.12,
        maxHours: 10,
        allowedFor: ['talituse_juht_patrol']
    },

    // Investigation unit leader work activities

    {
        id: 'investigation_unit_leader_01',
        name: 'Talituse juhi kohustused',
        description: 'Talituse juhina juhid tervet menetlustalituse üksust ja vastutad keeruliste juhtumite koordineerimise eest',
        minLevel: 90,
        requiredCourses: ['advanced_leader_course', 'forensics_basics', 'basic_computer_course'],
        baseExpPerHour: 2300,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['talituse_juht_investigation']
    },

    // Emergency unit leader work activities

    {
        id: 'emergency_unit_leader_01',
        name: 'Talituse juhi kohustused',
        description: 'Talituse juhina juhid tervet kiirreageerimistalituse üksust ja korraldad üksuse tegevust',
        minLevel: 95,
        requiredCourses: ['advanced_leader_course', 'forensics_basics', 'basic_computer_course'],
        baseExpPerHour: 2600,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['talituse_juht_emergency']
    },

    // K9 unit leader work activities

    {
        id: 'k9_unit_leader_01',
        name: 'Talituse juhi kohustused',
        description: 'Talituse juhina juhid tervet K9 üksust ja korraldad üksuse tegevust',
        minLevel: 90,
        requiredCourses: ['advanced_leader_course', 'forensics_basics', 'basic_computer_course', 'dog_specialist_course'],
        baseExpPerHour: 2300,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['talituse_juht_k9']
    },

    // Cyber unit leader work activities

    {
        id: 'cyber_unit_leader_01',
        name: 'Talituse juhi kohustused',
        description: 'Talituse juhina juhid tervet küberkuritegevuse talituse üksust ja korraldad üksuse tegevust',
        minLevel: 95,
        requiredCourses: ['advanced_leader_course', 'forensics_basics', 'cyber_crime_course_02', 'advanced_computer_skills_02'],
        baseExpPerHour: 2600,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['talituse_juht_cyber']
    },

    // Crimes unit leader work activities

    {
        id: 'crimes_unit_leader_01',
        name: 'Talituse juhi kohustused',
        description: 'Talituse juhina juhid tervet kuritegude talituse üksust ja korraldad üksuse tegevust',
        minLevel: 95,
        requiredCourses: ['advanced_leader_course', 'forensics_basics', 'basic_computer_course'],
        baseExpPerHour: 2600,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['talituse_juht_crimes']
    },

];