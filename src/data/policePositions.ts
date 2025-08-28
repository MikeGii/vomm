// src/data/policePositions.ts
export interface PolicePosition {
    id: 'abipolitseinik' | 'kadett' | 'patrullpolitseinik' | 'uurija' | 'kiirreageerija' | 'koerajuht'
        | 'küberkriminalist' | 'jälitaja' | 'grupijuht_patrol' | 'grupijuht_investigation' | 'grupijuht_emergency'
        | 'grupijuht_k9' | 'grupijuht_cyber' | 'grupijuht_crimes' | 'talituse_juht_patrol' | 'talituse_juht_investigation'
        | 'talituse_juht_emergency' | 'talituse_juht_k9' | 'talituse_juht_cyber' | 'talituse_juht_crimes';
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

    // Talituse juhid (one per unit)
    {
        id: 'talituse_juht_patrol',
        name: 'Talituse juht',
        departmentUnit: 'patrol',
        requirements: {
            minimumLevel: 85,
            completedCourses: ['advanced_leader_course'],
            minimumWorkedHours: 300,
            minimumReputation: 8000,
            attributes: {
                strength: 200,
                agility: 175,
                dexterity: 175,
                intelligence: 250,
                endurance: 200
            }
        },
    },
    {
        id: 'talituse_juht_investigation',
        name: 'Talituse juht',
        departmentUnit: 'procedural_service',
        requirements: {
            minimumLevel: 90,
            completedCourses: ['advanced_leader_course', 'forensics_basics'],
            minimumWorkedHours: 300,
            minimumReputation: 8000,
            attributes: {
                strength: 175,
                agility: 175,
                dexterity: 225,
                intelligence: 275,
                endurance: 200
            }
        }
    },
    {
        id: 'talituse_juht_emergency',
        name: 'Talituse juht',
        departmentUnit: 'emergency_response',
        requirements: {
            minimumLevel: 95,
            completedCourses: ['advanced_leader_course'],
            minimumWorkedHours: 300,
            minimumReputation: 8000,
            attributes: {
                strength: 275,
                agility: 225,
                dexterity: 200,
                intelligence: 250,
                endurance: 250
            }
        }
    },
    {
        id: 'talituse_juht_k9',
        name: 'Talituse juht',
        departmentUnit: 'k9_unit',
        requirements: {
            minimumLevel: 90,
            completedCourses: ['advanced_leader_course', 'dog_specialist_course'],
            minimumWorkedHours: 300,
            minimumReputation: 9000,
            attributes: {
                strength: 225,
                agility: 200,
                dexterity: 200,
                intelligence: 250,
                endurance: 275
            }
        }
    },
    {
        id: 'talituse_juht_cyber',
        name: 'Talituse juht',
        departmentUnit: 'cyber_crime',
        requirements: {
            minimumLevel: 95,
            completedCourses: ['advanced_leader_course', 'cyber_crime_course', 'advanced_computer_skills'],
            minimumWorkedHours: 300,
            minimumReputation: 9000,
            attributes: {
                strength: 175,
                agility: 200,
                dexterity: 175,
                intelligence: 275,
                endurance: 200
            }
        }
    },
    {
        id: 'talituse_juht_crimes',
        name: 'Talituse juht',
        departmentUnit: 'crime_unit',
        requirements: {
            minimumLevel: 95,
            completedCourses: ['advanced_leader_course', 'forensics_basics'],
            minimumWorkedHours: 300,
            minimumReputation: 9000,
            attributes: {
                strength: 225,
                agility: 200,
                dexterity: 225,
                intelligence: 250,
                endurance: 200
            }
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