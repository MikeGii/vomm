// src/data/policePositions.ts
export interface PolicePosition {
    id: 'abipolitseinik' | 'kadett' | 'patrullpolitseinik' | 'grupijuht' | 'talituse_juht';
    name: string;
    requirements?: {
        minimumLevel?: number;
        completedCourses?: string[];
        minimumWorkedHours?: number;
        minimumReputation?: number;
        specialRequirements?: string[];
    };
}

export const POLICE_POSITIONS: PolicePosition[] = [
    {
        id: 'abipolitseinik',
        name: 'Abipolitseinik'
    },
    {
        id: 'kadett',
        name: 'Kadett'
    },
    {
        id: 'patrullpolitseinik',
        name: 'Patrullpolitseinik',
        requirements: {
            completedCourses: ['lopueksam']
        }
    },
    {
        id: 'grupijuht',
        name: 'Grupijuht',
        requirements: {
            minimumLevel: 50,
            completedCourses: ['lopueksam', 'police_ground_leader_course'],
            minimumWorkedHours: 100,
            minimumReputation: 1000
        }
    },
    {
        id: 'talituse_juht',
        name: 'Talitusejuht',
        requirements: {
            minimumLevel: 70,
            completedCourses: ['lopueksam', 'police_ground_leader_course', 'enhanced_law_studies'],
            minimumWorkedHours: 200,
            minimumReputation: 2500
        }
    }
];

export const getPositionById = (positionId: string): PolicePosition | undefined => {
    return POLICE_POSITIONS.find(pos => pos.id === positionId);
};

export const getPositionName = (positionId: string | null): string => {
    if (!positionId) return '—';
    const position = getPositionById(positionId);
    return position?.name || '—';
};