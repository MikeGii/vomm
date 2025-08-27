// src/data/workActivities/positions/groupLeaders.ts
import { WorkActivity } from '../types';

// Group leader work activities
export const GROUP_LEADER_ACTIVITIES: WorkActivity[] = [
    {
        id: 'patrol_group_leader_01',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, viid läbi arenguvestluseid, osaled koosolekutel ja parendad grupi toimivust',
        minLevel: 55,
        requiredCourses: ['police_group_leader_course'],
        baseExpPerHour: 1050,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_patrol']
    },
    {
        id: 'procedural_group_leader_01',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, viid läbi arenguvestluseid, osaled koosolekutel ja parendad grupi toimivust',
        minLevel: 60,
        requiredCourses: ['police_group_leader_course', 'enhanced_law_studies'],
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
        requiredCourses: ['police_group_leader_course', 'riot_police_course'],
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
        requiredCourses: ['police_group_leader_course', 'forensics_basics', 'narcotic_psyhotropic_substances' ],
        baseExpPerHour: 1450,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_crimes']
    }
];