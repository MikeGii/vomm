// src/data/handicraftActivities.ts
import { TrainingActivity } from '../types';

export const HANDICRAFT_ACTIVITIES: TrainingActivity[] = [
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
    }
];

export const getHandicraftActivityById = (activityId: string): TrainingActivity | undefined => {
    return HANDICRAFT_ACTIVITIES.find(activity => activity.id === activityId);
};

export const getAvailableHandicraftActivities = (playerLevel: number): TrainingActivity[] => {
    return HANDICRAFT_ACTIVITIES.filter(activity => activity.requiredLevel <= playerLevel);
};