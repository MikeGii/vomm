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
        requiredCourses: ['police_group_leader_course'],
        baseExpPerHour: 1250,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_investigation']
    }
];