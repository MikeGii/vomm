// src/data/kitchenLabActivities.ts
import { TrainingActivity } from '../types';

export const KITCHEN_LAB_ACTIVITIES: TrainingActivity[] = [
    // COOKING ACTIVITIES
    {
        id: 'basic_cooking_01',
        name: 'Keeda kaerahelbeputru',
        description: 'Valmistad putru Merelahe teel, et hädaohus olevad isikud saaksid hommikusööki',
        requiredLevel: 1,
        rewards: {
            cooking: 15,
            playerExp: 5
        },
        requiredItems: [
            { id: 'oatmeal', quantity: 2 },
            { id: 'water', quantity: 1 }
        ],
        producedItems: [
            { id: 'porrige', quantity: 1 }
        ]
    },

    // BREWING ACTIVITIES
    {
        id: 'basic_brewing_01',
        name: 'Valmista siirupit',
        description: 'Valmistad mahedat siirupijooki',
        requiredLevel: 1,
        rewards: {
            brewing: 15,
            playerExp: 5
        },
        requiredItems: [
            { id: 'water', quantity: 2 },
            { id: 'syrup', quantity: 1 }
        ],
        producedItems: [
            { id: 'juice', quantity: 1 }
        ]
    },

    // CHEMISTRY ACTIVITIES
    {
        id: 'basic_chemistry_01',
        name: 'Valmista desinfitseerimisvahendit',
        description: 'Valmistad lihtsat desinfitseerimisvahendit, mida saab kasutada kontoris ja välitöödel',
        requiredLevel: 1,
        rewards: {
            chemistry: 15,
            playerExp: 5
        },
        requiredItems: [
            { id: 'alcohol', quantity: 2 },
            { id: 'water', quantity: 1 }
        ],
        producedItems: [
            { id: 'disinfectant', quantity: 1 }
        ]
    }
];

export const getAvailableKitchenLabActivities = (playerLevel: number): TrainingActivity[] => {
    return KITCHEN_LAB_ACTIVITIES.filter(activity => activity.requiredLevel <= playerLevel);
};

export const getKitchenLabActivityById = (id: string): TrainingActivity | undefined => {
    return KITCHEN_LAB_ACTIVITIES.find(activity => activity.id === id);
};