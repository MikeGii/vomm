// src/data/policePositions.ts
export interface PolicePosition {
    id: 'abipolitseinik' | 'kadett' | 'patrullpolitseinik' | 'uurija' | 'kiirreageerija' | 'koerajuht' | 'küberkriminalist' | 'jälitaja' | 'grupijuht_patrol' | 'grupijuht_investigation' | 'grupijuht_emergency' | 'grupijuht_k9' | 'grupijuht_cyber' | 'grupijuht_crimes' | 'talituse_juht';
    name: string;
    departmentUnit?: string;
    requirements?: {
        minimumLevel?: number;
        completedCourses?: string[];
        minimumWorkedHours?: number;
        minimumReputation?: number;
        specialRequirements?: string[];
        attributes?: {
            strength?: number;
            agility?: number;
            dexterity?: number;
            intelligence?: number;
            endurance?: number;
        };
    };
}

export const POLICE_POSITIONS: PolicePosition[] = [
    // Algpositsioonid
    {
        id: 'abipolitseinik',
        name: 'Abipolitseinik'
    },
    {
        id: 'kadett',
        name: 'Kadett'
    },

    // Üksuste töötajad
    {
        id: 'patrullpolitseinik',
        name: 'Patrullpolitseinik',
        departmentUnit: 'patrol',
        requirements: {
            completedCourses: ['lopueksam']
        }
    },
    {
        id: 'uurija',
        name: 'Uurija',
        departmentUnit: 'procedural_service',
        requirements: {
            minimumLevel: 45,
            completedCourses: ['evidence_place_course'],
            minimumWorkedHours: 50
        }
    },
    {
        id: 'kiirreageerija',
        name: 'Kiirreageerija',
        departmentUnit: 'emergency_response',
        requirements: {
            minimumLevel: 50,
            completedCourses: ['riot_police_course', 'medical_course_police'],
            minimumWorkedHours: 80,
            attributes: {
                strength: 45,
                agility: 45,
                endurance: 50
            }
        }
    },
    {
        id: 'koerajuht',
        name: 'Koerajuht',
        departmentUnit: 'k9_unit',
        requirements: {
            minimumLevel: 45,
            completedCourses: ['dog_handler_course'],
            minimumWorkedHours: 70,
            attributes: {
                strength: 40,
                agility: 50,
                endurance: 45
            }
        }
    },
    {
        id: 'küberkriminalist',
        name: 'Küberkriminalist',
        departmentUnit: 'cyber_crime',
        requirements: {
            minimumLevel: 55,
            completedCourses: ['cyber_crime_course', 'advanced_computer_skills'],
            minimumWorkedHours: 80,
            attributes: {
                intelligence: 60
            }
        }
    },
    {
        id: 'jälitaja',
        name: 'Jälitaja',
        departmentUnit: 'crime_unit',
        requirements: {
            minimumLevel: 50,
            completedCourses: ['lopueksam', 'detective_course'],
            minimumWorkedHours: 75,
            attributes: {
                intelligence: 45,
                dexterity: 40
            }
        }
    },

    // Grupijuhid (kasutavad teie antud kriteeriume)
    {
        id: 'grupijuht_patrol',
        name: 'Grupijuht',
        departmentUnit: 'patrol',
        requirements: {
            minimumLevel: 55,
            completedCourses: ['lopueksam', 'police_group_leader_course'],
            minimumWorkedHours: 150,
            attributes: {
                strength: 40,
                agility: 40,
                dexterity: 40,
                intelligence: 50,
                endurance: 40
            }
        }
    },
    {
        id: 'grupijuht_investigation',
        name: 'Menetluse grupijuht',
        departmentUnit: 'procedural_service',
        requirements: {
            minimumLevel: 60,
            completedCourses: ['lopueksam', 'police_group_leader_course', 'evidence_place_course', 'enhanced_law_studies'],
            minimumWorkedHours: 150,
            attributes: {
                strength: 40,
                agility: 40,
                dexterity: 40,
                intelligence: 60,
                endurance: 30
            }
        }
    },
    {
        id: 'grupijuht_emergency',
        name: 'Kiirreageerijate grupijuht',
        departmentUnit: 'emergency_response',
        requirements: {
            minimumLevel: 65,
            completedCourses: ['lopueksam', 'police_group_leader_course', 'riot_police_course', 'medical_course_police', 'police_atv_course', 'police_drone_course'],
            minimumWorkedHours: 150,
            attributes: {
                strength: 50,
                agility: 50,
                dexterity: 60,
                intelligence: 40,
                endurance: 60
            }
        }
    },
    {
        id: 'grupijuht_k9',
        name: 'Koertegrupi grupijuht',
        departmentUnit: 'k9_unit',
        requirements: {
            minimumLevel: 60,
            completedCourses: ['lopueksam', 'police_group_leader_course', 'dog_handler_course'],
            minimumWorkedHours: 150
        }
    },
    {
        id: 'grupijuht_cyber',
        name: 'Küberkuritegevuse grupijuht',
        departmentUnit: 'cyber_crime',
        requirements: {
            minimumLevel: 65,
            completedCourses: ['lopueksam', 'police_group_leader_course', 'cyber_crime_course', 'advanced_computer_skills'],
            minimumWorkedHours: 150
        }
    },
    {
        id: 'grupijuht_crimes',
        name: 'Kuritegude grupijuht',
        departmentUnit: 'crime_unit',
        requirements: {
            minimumLevel: 65,
            completedCourses: ['police_group_leader_course', 'narcotic_psyhotropic_substances', 'forensics_basics'],
            minimumWorkedHours: 150
        }
    },

    // Kõrgem juhtkond
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

export const getPositionName = (positionId: string | null | undefined): string => {
    if (!positionId) return '—';
    const position = getPositionById(positionId);
    return position?.name || '—';
};