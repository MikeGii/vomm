// src/data/workActivities/positions/groupLeaders.ts
import { WorkActivity } from '../types';

// Group leader work activities
export const GROUP_LEADER_ACTIVITIES: WorkActivity[] = [
    // PATROL GROUP LEADERS (unchanged)
    {
        id: 'patrol_group_leader_01',
        name: 'Grupijuhina viid läbi arenguvestluseid',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, viid läbi arenguvestluseid ja parendad grupi toimivust',
        minLevel: 55,
        requiredCourses: ['police_group_leader_course'],
        baseExpPerHour: 1050,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_patrol']
    },
    {
        id: 'patrol_group_leader_02',
        name: 'Grupijuhina parendad grupi toimivust',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, osaled koosolekutel ja parendad grupi toimivust',
        minLevel: 65,
        requiredCourses: ['police_group_leader_course'],
        baseExpPerHour: 1350,
        expGrowthRate: 0.09,
        maxHours: 12,
        allowedFor: ['grupijuht_patrol']
    },
    {
        id: 'patrol_group_leader_03',
        name: 'Grupijuhina osaled koosolekutel juhtkonnaga',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas ja osaled koosolekutel, et tuua sisse uusi innovaatilisi meetmeid ja ' +
            'töövõtteid grupijuhina',
        minLevel: 75,
        requiredCourses: ['police_group_leader_course'],
        baseExpPerHour: 1550,
        expGrowthRate: 0.09,
        maxHours: 12,
        allowedFor: ['grupijuht_patrol']
    },
    {
        id: 'patrol_group_leader_04',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi enda jaoskonnas viies läbi arenguvestluseid, parendad grupi toimivust, osaled koosolekutel' +
            ' ja tõstad oma grupiliikmete moraali',
        minLevel: 85,
        requiredCourses: ['police_group_leader_course'],
        baseExpPerHour: 1700,
        expGrowthRate: 0.09,
        maxHours: 12,
        allowedFor: ['grupijuht_patrol']
    },

    // INVESTIGATION GROUP LEADERS
    {
        id: 'procedural_group_leader_01',
        name: 'Grupijuhina viid läbi arenguvestluseid',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, viid läbi arenguvestluseid ja parendad grupi toimivust',
        minLevel: 60,
        requiredCourses: ['police_group_leader_course', 'evidence_place_course', 'enhanced_law_studies'],
        baseExpPerHour: 1250,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_investigation']
    },
    {
        id: 'procedural_group_leader_02',
        name: 'Grupijuhina parendad grupi toimivust',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, osaled koosolekutel ja parendad grupi toimivust',
        minLevel: 70,
        requiredCourses: ['police_group_leader_course', 'evidence_place_course', 'enhanced_law_studies'],
        baseExpPerHour: 1400,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_investigation']
    },
    {
        id: 'procedural_group_leader_03',
        name: 'Grupijuhina osaled koosolekutel juhtkonnaga',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas ja osaled koosolekutel, et tuua sisse uusi innovaatilisi meetmeid ja ' +
            'töövõtteid grupijuhina',
        minLevel: 80,
        requiredCourses: ['police_group_leader_course', 'evidence_place_course', 'enhanced_law_studies'],
        baseExpPerHour: 1550,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_investigation']
    },
    {
        id: 'procedural_group_leader_04',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi enda jaoskonnas viies läbi arenguvestluseid, parendad grupi toimivust, osaled koosolekutel' +
            ' ja tõstad oma grupiliikmete moraali',
        minLevel: 90,
        requiredCourses: ['police_group_leader_course', 'evidence_place_course', 'enhanced_law_studies'],
        baseExpPerHour: 1700,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_investigation']
    },

    // EMERGENCY GROUP LEADERS
    {
        id: 'emergency_group_leader_01',
        name: 'Grupijuhina viid läbi arenguvestluseid',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, viid läbi arenguvestluseid ja parendad grupi toimivust',
        minLevel: 65,
        requiredCourses: ['police_group_leader_course', 'riot_police_course', 'medical_course_police', 'police_atv_course', 'police_drone_course'],
        baseExpPerHour: 1450,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_emergency']
    },
    {
        id: 'emergency_group_leader_02',
        name: 'Grupijuhina parendad grupi toimivust',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, osaled koosolekutel ja parendad grupi toimivust',
        minLevel: 75,
        requiredCourses: ['police_group_leader_course', 'riot_police_course', 'medical_course_police', 'police_atv_course', 'police_drone_course'],
        baseExpPerHour: 1600,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_emergency']
    },
    {
        id: 'emergency_group_leader_03',
        name: 'Grupijuhina osaled koosolekutel juhtkonnaga',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas ja osaled koosolekutel, et tuua sisse uusi innovaatilisi meetmeid ja ' +
            'töövõtteid grupijuhina',
        minLevel: 85,
        requiredCourses: ['police_group_leader_course', 'riot_police_course', 'medical_course_police', 'police_atv_course', 'police_drone_course'],
        baseExpPerHour: 1750,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_emergency']
    },
    {
        id: 'emergency_group_leader_04',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi enda jaoskonnas viies läbi arenguvestluseid, parendad grupi toimivust, osaled koosolekutel' +
            ' ja tõstad oma grupiliikmete moraali',
        minLevel: 95,
        requiredCourses: ['police_group_leader_course', 'riot_police_course', 'medical_course_police', 'police_atv_course', 'police_drone_course'],
        baseExpPerHour: 1900,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_emergency']
    },

    // K9 GROUP LEADERS
    {
        id: 'k9_group_leader_01',
        name: 'Grupijuhina viid läbi arenguvestluseid',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, viid läbi arenguvestluseid ja parendad grupi toimivust',
        minLevel: 60,
        requiredCourses: ['police_group_leader_course', 'dog_handler_course'],
        baseExpPerHour: 1250,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_k9']
    },
    {
        id: 'k9_group_leader_02',
        name: 'Grupijuhina parendad grupi toimivust',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, osaled koosolekutel ja parendad grupi toimivust',
        minLevel: 70,
        requiredCourses: ['police_group_leader_course', 'dog_specialist_course'],
        baseExpPerHour: 1400,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_k9']
    },
    {
        id: 'k9_group_leader_03',
        name: 'Grupijuhina osaled koosolekutel juhtkonnaga',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas ja osaled koosolekutel, et tuua sisse uusi innovaatilisi meetmeid ja ' +
            'töövõtteid grupijuhina',
        minLevel: 80,
        requiredCourses: ['police_group_leader_course', 'dog_master_course_01'],
        baseExpPerHour: 1550,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_k9']
    },
    {
        id: 'k9_group_leader_04',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi enda jaoskonnas viies läbi arenguvestluseid, parendad grupi toimivust, osaled koosolekutel' +
            ' ja tõstad oma grupiliikmete moraali',
        minLevel: 90,
        requiredCourses: ['police_group_leader_course', 'dog_master_course_02'],
        baseExpPerHour: 1700,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_k9']
    },

    // CYBER GROUP LEADERS
    {
        id: 'cyber_group_leader_01',
        name: 'Grupijuhina viid läbi arenguvestluseid',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, viid läbi arenguvestluseid ja parendad grupi toimivust',
        minLevel: 65,
        requiredCourses: ['police_group_leader_course', 'advanced_computer_skills', 'cyber_crime_course'],
        baseExpPerHour: 1450,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_cyber']
    },
    {
        id: 'cyber_group_leader_02',
        name: 'Grupijuhina parendad grupi toimivust',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, osaled koosolekutel ja parendad grupi toimivust',
        minLevel: 75,
        requiredCourses: ['police_group_leader_course', 'advanced_computer_skills_02', 'cyber_crime_course_02'],
        baseExpPerHour: 1600,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_cyber']
    },
    {
        id: 'cyber_group_leader_03',
        name: 'Grupijuhina osaled koosolekutel juhtkonnaga',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas ja osaled koosolekutel, et tuua sisse uusi innovaatilisi meetmeid ja ' +
            'töövõtteid grupijuhina',
        minLevel: 85,
        requiredCourses: ['police_group_leader_course', 'advanced_computer_skills_02', 'cyber_crime_course_02'],
        baseExpPerHour: 1750,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_cyber']
    },
    {
        id: 'cyber_group_leader_04',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi enda jaoskonnas viies läbi arenguvestluseid, parendad grupi toimivust, osaled koosolekutel' +
            ' ja tõstad oma grupiliikmete moraali',
        minLevel: 95,
        requiredCourses: ['police_group_leader_course', 'advanced_computer_skills_02', 'cyber_crime_course_02'],
        baseExpPerHour: 1900,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_cyber']
    },

    // CRIME GROUP LEADERS
    {
        id: 'crime_group_leader_01',
        name: 'Grupijuhina viid läbi arenguvestluseid',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, viid läbi arenguvestluseid ja parendad grupi toimivust',
        minLevel: 65,
        requiredCourses: ['police_group_leader_course', 'narcotic_psyhotropic_substances', 'anatomic_basic_course'],
        baseExpPerHour: 1450,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_crimes']
    },
    {
        id: 'crime_group_leader_02',
        name: 'Grupijuhina parendad grupi toimivust',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, osaled koosolekutel ja parendad grupi toimivust',
        minLevel: 75,
        requiredCourses: ['police_group_leader_course', 'narcotic_psyhotropic_substances', 'anatomic_basic_course', 'detective_course_advanced_01'],
        baseExpPerHour: 1600,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_crimes']
    },
    {
        id: 'crime_group_leader_03',
        name: 'Grupijuhina osaled koosolekutel juhtkonnaga',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas ja osaled koosolekutel, et tuua sisse uusi innovaatilisi meetmeid ja ' +
            'töövõtteid grupijuhina',
        minLevel: 85,
        requiredCourses: ['police_group_leader_course', 'narcotic_psyhotropic_substances', 'anatomic_basic_course', 'detective_course_advanced_02'],
        baseExpPerHour: 1750,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_crimes']
    },
    {
        id: 'crime_group_leader_04',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi enda jaoskonnas viies läbi arenguvestluseid, parendad grupi toimivust, osaled koosolekutel' +
            ' ja tõstad oma grupiliikmete moraali',
        minLevel: 95,
        requiredCourses: ['police_group_leader_course', 'narcotic_psyhotropic_substances', 'anatomic_basic_course', 'detective_course_advanced_02'],
        baseExpPerHour: 1900,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_crimes']
    }
];