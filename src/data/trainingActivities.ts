// src/data/trainingActivities.ts
import { TrainingActivity } from '../types';

export const TRAINING_ACTIVITIES: TrainingActivity[] = [
    // Level 1 activities
    {
        id: 'lift_weights',
        name: 'Tõsta hantleid',
        description: 'Arendab jõudu ja vastupidavust',
        requiredLevel: 1,
        rewards: {
            strength: 20,
            endurance: 10,
            playerExp: 5
        }
    },
    {
        id: 'run_forest',
        name: 'Jookse metsas',
        description: 'Parandab vastupidavust ja kiirust',
        requiredLevel: 1,
        rewards: {
            endurance: 20,
            agility: 10,
            playerExp: 5
        }
    },
    {
        id: 'gym_exercises',
        name: 'Võimle matisaalis',
        description: 'Tõstab kiirust ja osavust',
        requiredLevel: 1,
        rewards: {
            agility: 20,
            dexterity: 10,
            playerExp: 5
        }
    },
    {
        id: 'read_books',
        name: 'Loe kodus raamatut',
        description: 'Suurendab intelligentsust',
        requiredLevel: 1,
        rewards: {
            intelligence: 20,
            playerExp: 5
        }
    },

    // Level 5 activities
    {
        id: 'bench_press',
        name: 'Suru kangi',
        description: 'Intensiivne jõutreening',
        requiredLevel: 5,
        rewards: {
            strength: 50,
            endurance: 20,
            playerExp: 5
        }
    },
    {
        id: 'treadmill',
        name: 'Jookse trenažööril',
        description: 'Professionaalne kardiotreening',
        requiredLevel: 5,
        rewards: {
            endurance: 50,
            agility: 20,
            playerExp: 5
        }
    },
    {
        id: 'weapon_training',
        name: 'Harjuta makett relva',
        description: 'Taktikaline relvakäsitsemise treening',
        requiredLevel: 5,
        rewards: {
            dexterity: 50,
            agility: 20,
            playerExp: 5
        }
    },
    {
        id: 'library_study',
        name: 'Mine raamatukokku',
        description: 'Süvendatud õppimine ja uurimistöö',
        requiredLevel: 5,
        rewards: {
            intelligence: 50,
            playerExp: 5
        }
    },

    // Level 20 activities - NEW
    {
        id: 'intensive_strength_training',
        name: 'Intensiivne jõutreening',
        description: 'Treening personaaltreeneriga',
        requiredLevel: 20,
        rewards: {
            strength: 100,
            endurance: 50,
            playerExp: 10
        }
    },
    {
        id: 'stadium_running',
        name: 'Jooksuharjutused staadionil',
        description: 'Professionaalsed harjutused staadionil',
        requiredLevel: 20,
        rewards: {
            endurance: 100,
            agility: 50,
            playerExp: 10
        }
    },
    {
        id: 'airsoft_game',
        name: 'Mängi kolleegidega airsofti',
        description: 'Intensiivne täpsuse ja osavuse treening',
        requiredLevel: 20,
        rewards: {
            dexterity: 100,
            agility: 50,
            playerExp: 10
        }
    },
    {
        id: 'brain_hunt_competition',
        name: 'Osale ajujahi konkursil',
        description: 'Konverents aktiivseks ajutreeninguks',
        requiredLevel: 20,
        rewards: {
            intelligence: 100,
            playerExp: 10
        }
    },
    // Level 40 activities - NEW
    {
        id: 'advanced_strength_training',
        name: 'Jõutrenn profisportlastega',
        description: 'Treening kogenud ja tugevate jõusaalihuntidega',
        requiredLevel: 40,
        rewards: {
            strength: 200,
            endurance: 100,
            playerExp: 20
        }
    },
    {
        id: 'advanced_stadium_running',
        name: 'Jooksutrenn tippjooksjatega',
        description: 'Treening tipptasemel maratoni jooksjatega',
        requiredLevel: 40,
        rewards: {
            endurance: 200,
            agility: 100,
            playerExp: 20
        }
    },
    {
        id: 'advanced_weapon_technics',
        name: 'Harjutused koos kiirreageerijatega harjutusväljakul',
        description: 'Harjutused reaalsete tulirelvadega lasketiirus koos kiirreageerijatega',
        requiredLevel: 40,
        rewards: {
            dexterity: 200,
            agility: 100,
            playerExp: 20
        }
    },
    {
        id: 'advanced_intelligence_training',
        name: 'Osale male meistrivõistlustel',
        description: 'Tugev ajutrenn koos tipptasemel malemängijatega',
        requiredLevel: 40,
        rewards: {
            intelligence: 200,
            playerExp: 20
        }
    }
];

// Helper function to get available activities for player level
export const getAvailableActivities = (playerLevel: number): TrainingActivity[] => {
    return TRAINING_ACTIVITIES.filter(activity => activity.requiredLevel <= playerLevel);
};

// Helper function to get activity by ID
export const getActivityById = (activityId: string): TrainingActivity | undefined => {
    return TRAINING_ACTIVITIES.find(activity => activity.id === activityId);
};