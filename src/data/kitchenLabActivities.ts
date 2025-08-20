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
            { id: 'porrige', quantity: 2 }
        ]
    },
    {
        id: 'basic_cooking_02',
        name: 'Küpseta leiba',
        description: 'Valmistad värske leiva, mida saab kasutada toitva toiduna või teiste roogade baasina',
        requiredLevel: 5,
        rewards: {
            cooking: 25,
            playerExp: 5
        },
        requiredItems: [
            { id: 'flour', quantity: 1 },
            { id: 'water', quantity: 1 }
        ],
        producedItems: [
            { id: 'bread', quantity: 1 }
        ]
    },
    {
        id: 'advanced_cooking_01',
        name: 'Valmista megaleibu',
        description: 'Kombineerid leiva ja putru, et valmistada toitev võileib välitöödel olevale personal',
        requiredLevel: 10,
        rewards: {
            cooking: 50,
            playerExp: 10
        },
        requiredItems: [
            { id: 'bread', quantity: 1 },
            { id: 'porrige', quantity: 1 }
        ],
        producedItems: [
            { id: 'sandwich', quantity: 1 }
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
            { id: 'juice', quantity: 2 }
        ]
    },
    {
        id: 'advanced_brewing_01',
        name: 'Valmista energiajooki',
        description: 'Valmistad värskendavat energiajooki, mis aitab püsida erksana pikemate töövahetuste ajal',
        requiredLevel: 5,
        rewards: {
            brewing: 25,
            playerExp: 5
        },
        requiredItems: [
            { id: 'juice', quantity: 1 },
            { id: 'syrup', quantity: 1 }
        ],
        producedItems: [
            { id: 'energy_drink', quantity: 1 }
        ]
    },
    {
        id: 'advanced_brewing_02',
        name: 'Valmista jõujooki',
        description: 'Kombineerid energiajoogi ja putru, et luua võimsa jõujoogi eriliselt rasketeks ülesanneteks',
        requiredLevel: 10,
        rewards: {
            brewing: 50,
            playerExp: 10
        },
        requiredItems: [
            { id: 'energy_drink', quantity: 1 },
            { id: 'porrige', quantity: 1 }
        ],
        producedItems: [
            { id: 'power_smoothie', quantity: 1 }
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
    },
    {
        id: 'make_cleaning_solution',
        name: 'Valmista puhastusaine',
        description: 'Valmistad võimsat puhastusainet, mis sobib ideaalselt kontorite ja sõidukite puhastamiseks',
        requiredLevel: 5,
        rewards: {
            chemistry: 25,
            playerExp: 5
        },
        requiredItems: [
            { id: 'vinegar', quantity: 2 },
            { id: 'salt', quantity: 1 },
            { id: 'water', quantity: 1 }
        ],
        producedItems: [
            { id: 'cleaning_solution', quantity: 1 }
        ]
    },
    {
        id: 'make_strong_antiseptic',
        name: 'Valmista antiseptikut',
        description: 'Valmistad tugevat antiseptikut, mis hävitab baktereid ja sobib meditsiiniliseks kasutamiseks',
        requiredLevel: 10,
        rewards: {
            chemistry: 50,
            playerExp: 10
        },
        requiredItems: [
            { id: 'alcohol', quantity: 3 },
            { id: 'salt', quantity: 2 },
            { id: 'water', quantity: 1 }
        ],
        producedItems: [
            { id: 'antiseptic_solution', quantity: 1 }
        ]
    }
];

export const getAvailableKitchenLabActivities = (playerLevel: number): TrainingActivity[] => {
    return KITCHEN_LAB_ACTIVITIES.filter(activity => activity.requiredLevel <= playerLevel);
};

export const getKitchenLabActivityById = (id: string): TrainingActivity | undefined => {
    return KITCHEN_LAB_ACTIVITIES.find(activity => activity.id === id);
};