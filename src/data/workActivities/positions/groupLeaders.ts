// src/data/workActivities/positions/groupLeaders.ts
import { WorkActivity } from '../types';

// Group leader work activities
export const GROUP_LEADER_ACTIVITIES: WorkActivity[] = [
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
    {
        id: 'procedural_group_leader_01',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, viid läbi arenguvestluseid, osaled koosolekutel ja parendad grupi toimivust',
        minLevel: 60,
        requiredCourses: ['police_group_leader_course', 'evidence_place_course', 'enhanced_law_studies'],
        baseExpPerHour: 1250,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_investigation']
    },
    {
        id: 'emergency_group_leader_01',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, viid läbi arenguvestluseid, osaled koosolekutel ja parendad grupi toimivust',
        minLevel: 65,
        requiredCourses: ['police_group_leader_course', 'riot_police_course', 'medical_course_police', 'police_atv_course', 'police_drone_course'],
        baseExpPerHour: 1450,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_emergency']
    },
    {
        id: 'k9_group_leader_01',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, viid läbi arenguvestluseid, osaled koosolekutel ja parendad grupi toimivust',
        minLevel: 60,
        requiredCourses: ['police_group_leader_course', 'dog_handler_course'],
        baseExpPerHour: 1250,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_k9']
    },
    {
        id: 'cyber_group_leader_01',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, viid läbi arenguvestluseid, osaled koosolekutel ja parendad grupi toimivust',
        minLevel: 65,
        requiredCourses: ['police_group_leader_course', 'advanced_computer_skills', 'cyber_crime_course' ],
        baseExpPerHour: 1450,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_cyber']
    },
    {
        id: 'crime_group_leader_01',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, viid läbi arenguvestluseid, osaled koosolekutel ja parendad grupi toimivust',
        minLevel: 65,
        requiredCourses: ['police_group_leader_course', 'narcotic_psyhotropic_substances', 'anatomic_basic_course'],
        baseExpPerHour: 1450,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_crimes']
    }
];