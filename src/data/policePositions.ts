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
        name: 'Kadett',
        requirements: {
            minimumLevel: 15
        }
    },

    // Üksuste töötajad
    {
        id: 'patrullpolitseinik',
        name: 'Patrullpolitseinik',
        departmentUnit: 'patrol',
        requirements: {
            minimumLevel: 30,
            completedCourses: ['lopueksam'],
            attributes: {
                strength: 25,
                agility: 30,
                endurance: 25
            }
        }
    },
    {
        id: 'uurija',
        name: 'Uurija',
        departmentUnit: 'procedural_service',
        requirements: {
            minimumLevel: 45,
            completedCourses: ['evidence_place_course'],
            minimumWorkedHours: 50,
            attributes: {
                intelligence: 50,
                agility: 40,
                dexterity: 45
            }
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
                strength: 50,
                agility: 50,
                endurance: 55
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
                agility: 55,
                endurance: 50,
                intelligence: 35
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
                intelligence: 65,
                dexterity: 40
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
                intelligence: 80,
                dexterity: 45,
                agility: 40
            }
        }
    },

    // Grupijuhid
    {
        id: 'grupijuht_patrol',
        name: 'Grupijuht',
        departmentUnit: 'patrol',
        requirements: {
            minimumLevel: 55,
            completedCourses: [
                'police_group_leader_course',
                'police_ground_leader_course_02',
                'medical_course_police'
            ],
            minimumWorkedHours: 150,
            minimumReputation: 5000,
            attributes: {
                strength: 70,
                agility: 70,
                dexterity: 70,
                intelligence: 80,
                endurance: 60
            }
        }
    },
    {
        id: 'grupijuht_investigation',
        name: 'Menetluse grupijuht',
        departmentUnit: 'procedural_service',
        requirements: {
            minimumLevel: 65,
            completedCourses: [
                'police_group_leader_course',
                'evidence_place_course',
                'enhanced_law_studies_advanced',
                'detective_course'
            ],
            minimumWorkedHours: 150,
            minimumReputation: 5000,
            attributes: {
                strength: 70,
                agility: 70,
                dexterity: 70,
                intelligence: 90,
                endurance: 50
            }
        }
    },
    {
        id: 'grupijuht_emergency',
        name: 'Kiirreageerijate grupijuht',
        departmentUnit: 'emergency_response',
        requirements: {
            minimumLevel: 70,
            completedCourses: [
                'police_group_leader_course',
                'riot_police_course_02',
                'medical_course_police_advanced',
                'police_atv_course',
                'police_drone_course',
                'emergency_police_course_houses'
            ],
            minimumWorkedHours: 150,
            minimumReputation: 5000,
            attributes: {
                strength: 100,
                agility: 80,
                dexterity: 90,
                intelligence: 70,
                endurance: 80
            }
        }
    },
    {
        id: 'grupijuht_k9',
        name: 'Koertegrupi grupijuht',
        departmentUnit: 'k9_unit',
        requirements: {
            minimumLevel: 70,
            completedCourses: [
                'police_group_leader_course',
                'dog_specialist_course'
            ],
            minimumWorkedHours: 150,
            minimumReputation: 5000,
            attributes: {
                strength: 90,
                agility: 100,
                dexterity: 90,
                intelligence: 70,
                endurance: 90
            }
        }
    },
    {
        id: 'grupijuht_cyber',
        name: 'Küberkuritegevuse grupijuht',
        departmentUnit: 'cyber_crime',
        requirements: {
            minimumLevel: 70,
            completedCourses: [
                'police_group_leader_course',
                'cyber_crime_course_02',
                'advanced_computer_skills_02'
            ],
            minimumWorkedHours: 150,
            minimumReputation: 5000,
            attributes: {
                strength: 70,
                agility: 80,
                dexterity: 90,
                intelligence: 110,
                endurance: 70
            }
        }
    },
    {
        id: 'grupijuht_crimes',
        name: 'Kuritegude grupijuht',
        departmentUnit: 'crime_unit',
        requirements: {
            minimumLevel: 70,
            completedCourses: [
                'police_group_leader_course',
                'narcotic_psyhotropic_substances',
                'detective_course',
                'forensics_basics'
            ],
            minimumWorkedHours: 150,
            minimumReputation: 5000,
            attributes: {
                strength: 70,
                agility: 80,
                dexterity: 80,
                intelligence: 100,
                endurance: 80
            }
        }
    },

    // Talituse juhid (one per unit)
    {
        id: 'talituse_juht_patrol',
        name: 'Talituse juht',
        departmentUnit: 'patrol',
        requirements: {
            minimumLevel: 85,
            completedCourses: ['advanced_leader_course', 'basic_computer_course'],
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
            completedCourses: ['advanced_leader_course', 'anatomic_basic_course', 'basic_computer_course', 'narcotic_psyhotropic_substances'],
            minimumWorkedHours: 300,
            minimumReputation: 9000,
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
            completedCourses: ['advanced_leader_course', 'anatomic_basic_course', 'basic_computer_course'],
            minimumWorkedHours: 300,
            minimumReputation: 9000,
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
            completedCourses: ['advanced_leader_course', 'anatomic_basic_course', 'basic_computer_course', 'dog_master_course_02', 'narcotic_psyhotropic_substances'],
            minimumWorkedHours: 300,
            minimumReputation: 10000,
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
            completedCourses: ['advanced_leader_course', 'cyber_crime_course_02', 'advanced_computer_skills_02'],
            minimumWorkedHours: 300,
            minimumReputation: 10000,
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
            completedCourses: ['advanced_leader_course', 'anatomic_basic_course', 'basic_computer_course', 'detective_course_advanced_02', 'narcotic_psyhotropic_substances'],
            minimumWorkedHours: 300,
            minimumReputation: 10000,
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