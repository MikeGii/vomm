// src/data/handicraftActivities.ts
import { TrainingActivity } from '../types';

export const HANDICRAFT_ACTIVITIES: TrainingActivity[] = [

    // Sewing activities

    {
        id: 'simple_cloth',
        name: 'Lihtne riie',
        description: 'Lihtsa riide õmblemine põhimaterjalidest',
        requiredLevel: 1,
        rewards: {
            sewing: 15,
            playerExp: 5
        },
        requiredItems: [
            { id: 'fabric', quantity: 2 },
            { id: 'thread', quantity: 1 }
        ],
        producedItems: [
            { id: 'cloth', quantity: 1 }
        ]
    },
    {
        id: 'reinforced_cloth',
        name: 'Täiustatud riie',
        description: 'Tugeva riide valmistamine lihtsa riide parandamisel',
        requiredLevel: 10,
        rewards: {
            sewing: 25,
            playerExp: 5
        },
        requiredItems: [
            { id: 'cloth', quantity: 1 },
            { id: 'fabric', quantity: 1 },
            { id: 'thread', quantity: 1 }
        ],
        producedItems: [
            { id: 'reinforced_cloth', quantity: 1 }
        ]
    },

    // Medicine activities

    {
        id: 'basic_bandage',
        name: 'Tavaline side',
        description: 'Lihtsa meditsiinilise side valmistamine',
        requiredLevel: 1,
        rewards: {
            medicine: 15,
            playerExp: 5
        },
        requiredItems: [
            { id: 'cotton', quantity: 2 },
            { id: 'thread', quantity: 1 }
        ],
        producedItems: [
            { id: 'bandage', quantity: 1 }
        ]
    },
    {
        id: 'pressure_bandage',
        name: 'Rõhkside',
        description: 'Spetsiaalse rõhkside valmistamine veritsuse peatamiseks',
        requiredLevel: 10,
        rewards: {
            medicine: 25,
            playerExp: 5
        },
        requiredItems: [
            { id: 'bandage', quantity: 1 },
            { id: 'gauze', quantity: 1 },
            { id: 'cotton', quantity: 1 }
        ],
        producedItems: [
            { id: 'pressure_bandage', quantity: 1 }
        ]
    }
];

export const getHandicraftActivityById = (activityId: string): TrainingActivity | undefined => {
    return HANDICRAFT_ACTIVITIES.find(activity => activity.id === activityId);
};

export const getAvailableHandicraftActivities = (playerLevel: number): TrainingActivity[] => {
    return HANDICRAFT_ACTIVITIES.filter(activity => activity.requiredLevel <= playerLevel);
};