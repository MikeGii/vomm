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