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
    {
        id: 'reinforced_work_gloves',
        name: 'Tugevdatud töökindad',
        description: 'Nahkkindade valmistamine tugevdatud kangaga',
        requiredLevel: 20,
        rewards: {
            sewing: 50,
            playerExp: 10
        },
        requiredItems: [
            { id: 'leather', quantity: 6 },
            { id: 'reinforced_cloth', quantity: 4 },
            { id: 'thread', quantity: 4 }
        ],
        producedItems: [
            { id: 'reinforced_work_gloves', quantity: 1 }
        ]
    },
    {
        id: 'tactical_safety_boots_craft',
        name: 'Valmista taktikalisi turvasaapaid',
        description: 'Valmistad professionaalseid taktikalisi saapaid välitingimusteks kasutades tugevdatud materjale',
        requiredLevel: 40,
        rewards: {
            sewing: 100,
            playerExp: 15
        },
        requiredItems: [
            { id: 'leather', quantity: 8 },
            { id: 'reinforced_cloth', quantity: 6 },
            { id: 'thread', quantity: 8 },
            { id: 'synthetic_fiber', quantity: 4 }
        ],
        producedItems: [
            { id: 'tactical_safety_boots', quantity: 1 }
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
    },
    {
        id: 'advanced_medical_kit',
        name: 'Täiustatud meditsiinipakett',
        description: 'Professionaalse meditsiinipaketi koostamine',
        requiredLevel: 20,
        rewards: {
            medicine: 50,
            playerExp: 10
        },
        requiredItems: [
            { id: 'pressure_bandage', quantity: 2 },
            { id: 'medical_gel', quantity: 1 },
            { id: 'gauze', quantity: 2 },
            { id: 'antiseptic_solution', quantity: 1 }
        ],
        producedItems: [
            { id: 'advanced_medical_kit', quantity: 1 }
        ]
    },
    {
        id: 'emergency_trauma_kit_craft',
        name: 'Valmista hädaabipakki',
        description: 'Valmistad professionaalse hädaolukordade meditsiinipakki keeruliste vigastuste ravimiseks',
        requiredLevel: 40,
        rewards: {
            medicine: 100,
            playerExp: 15
        },
        requiredItems: [
            { id: 'advanced_medical_kit', quantity: 2 },
            { id: 'pressure_bandage', quantity: 4 },
            { id: 'medical_gel', quantity: 3 },
            { id: 'antiseptic_solution', quantity: 2 },
            { id: 'synthetic_fiber', quantity: 3 }
        ],
        producedItems: [
            { id: 'emergency_trauma_kit', quantity: 1 }
        ]
    },

    // 3D printing recipes

    {
        id: 'plastic_details',
        name: 'Plastik detailid',
        description: '3D prindid erinevaid plastikust detaile, et nendest ehitada keerukamaid detaile',
        requiredLevel: 60,
        rewards: {
            printing: 20,
            playerExp: 15
        },
        requiredItems: [
            { id: 'filament_pla', quantity: 2 },
            { id: 'filament_abs', quantity: 1 },
        ],
        producedItems: [
            { id: 'plastic_details_product', quantity: 1 },
        ]
    },
    {
        id: 'plastic_details_strong',
        name: 'Tugevad 3D prinditud detailid',
        description: '3D prinditud detailid ABS-ist ja PA-CF materjalist eriti vastupidavate näitajatega',
        requiredLevel: 80,
        rewards: {
            printing: 50,
            playerExp: 25
        },
        requiredItems: [
            { id: 'filament_abs', quantity: 2 },
            { id: 'filament_nylon_carbon', quantity: 1 },
        ],
        producedItems: [
            { id: 'plastic_details_strong_product', quantity: 1 },
        ]
    },

    // Laser cutting recipes

    {
        id: 'wooden_details',
        name: 'Puidust lõigatud detailid',
        description: 'Vineerist lõigatud erinevaid puidust detailid, et nendest ehitada keerukamaid detaile',
        requiredLevel: 60,
        rewards: {
            lasercutting: 20,
            playerExp: 15
        },
        requiredItems: [
            { id: 'plywood_table', quantity: 2 },
        ],
        producedItems: [
            { id: 'wooden_details_product', quantity: 1 },
        ]
    },

];

export const getHandicraftActivityById = (activityId: string): TrainingActivity | undefined => {
    return HANDICRAFT_ACTIVITIES.find(activity => activity.id === activityId);
};

export const getAvailableHandicraftActivities = (playerLevel: number): TrainingActivity[] => {
    return HANDICRAFT_ACTIVITIES.filter(activity => activity.requiredLevel <= playerLevel);
};