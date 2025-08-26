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
        requiredLevel: 10,
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
        requiredLevel: 20,
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
    {
        id: 'master_cooking_01',
        name: 'Valmista päästja eine',
        description: 'Valmistad toitva ja taastava eine, mis taastab tervist välitöödel',
        requiredLevel: 40,
        rewards: {
            cooking: 100,
            playerExp: 20
        },
        requiredItems: [
            { id: 'sandwich', quantity: 2 },
            { id: 'antiseptic_solution', quantity: 1 },
            { id: 'herbs', quantity: 2 }
        ],
        producedItems: [
            { id: 'rescuer_meal', quantity: 1 }
        ]
    },
    {
        id: 'ultimate_cooking_01',
        name: 'Valmista päästeliidu toidupakki',
        description: 'Valmistad professionaalse toidupaki välitingimustes töötavate päästjate jaoks, mis taastab märkimisväärselt tervist',
        requiredLevel: 60,
        rewards: {
            cooking: 150,
            playerExp: 30
        },
        requiredItems: [
            { id: 'rescuer_meal', quantity: 2 },
            { id: 'vinegar', quantity: 3 },
            { id: 'salt', quantity: 2 },
            { id: 'power_smoothie', quantity: 1 },
            { id: 'protein_powder', quantity: 3 }
        ],
        producedItems: [
            { id: 'rescue_league_food_pack', quantity: 1 }
        ]
    },

    // BREWING ACTIVITIES
    {
        id: 'basic_brewing_01',
        name: 'Valmista mahla',
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
        requiredLevel: 10,
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
        requiredLevel: 20,
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
    {
        id: 'master_brewing_01',
        name: 'Valmista supervõimendaja',
        description: 'Valmistad ülima energiajoogi, mis annab lisajõudu treeninguteks',
        requiredLevel: 40,
        rewards: {
            brewing: 100,
            playerExp: 20
        },
        requiredItems: [
            { id: 'power_smoothie', quantity: 2 },
            { id: 'cleaning_solution', quantity: 1 },
            { id: 'caffeine', quantity: 3 }
        ],
        producedItems: [
            { id: 'super_booster', quantity: 1 }
        ]
    },
    {
        id: 'ultimate_brewing_01',
        name: 'Valmista anaboolset jooki',
        description: 'Valmistad võimsat jõujooki maksimaalse treeningu soorituse saavutamiseks kasutades kõrgtehnoloogilisi lisandeid',
        requiredLevel: 60,
        rewards: {
            brewing: 150,
            playerExp: 30
        },
        requiredItems: [
            { id: 'super_booster', quantity: 2 },
            { id: 'power_smoothie', quantity: 2 },
            { id: 'herbs', quantity: 3 },
            { id: 'caffeine', quantity: 4 },
            { id: 'brain_accelerator', quantity: 1 },
            { id: 'creatine_monohydrate', quantity: 2 }
        ],
        producedItems: [
            { id: 'anabolic_drink', quantity: 1 }
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
        id: 'cleaning_solution',
        name: 'Valmista puhastusaine',
        description: 'Valmistad võimsat puhastusainet, mis sobib ideaalselt kontorite ja sõidukite puhastamiseks',
        requiredLevel: 10,
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
        id: 'antiseptic_solution',
        name: 'Valmista antiseptikut',
        description: 'Valmistad tugevat antiseptikut, mis hävitab baktereid ja sobib meditsiiniliseks kasutamiseks',
        requiredLevel: 20,
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
    },
    {
        id: 'master_chemistry_01',
        name: 'Valmista ajukiirendaja',
        description: 'Valmistad keemilise segu, mis kiirendab õppimist ja mõtlemist',
        requiredLevel: 40,
        rewards: {
            chemistry: 100,
            playerExp: 20
        },
        requiredItems: [
            { id: 'antiseptic_solution', quantity: 1 },
            { id: 'energy_drink', quantity: 2 },
            { id: 'nootropics', quantity: 2 }
        ],
        producedItems: [
            { id: 'brain_accelerator', quantity: 1 }
        ]
    },
    {
        id: 'ultimate_chemistry_01',
        name: 'Valmista töökuse seerumit',
        description: 'Valmistad keerukat keemilist lahust, mis suurendab töökiirendust ja parandab fookust 10% võrra',
        requiredLevel: 60,
        rewards: {
            chemistry: 150,
            playerExp: 30
        },
        requiredItems: [
            { id: 'brain_accelerator', quantity: 2 },
            { id: 'energy_drink', quantity: 3 },
            { id: 'caffeine', quantity: 5 },
            { id: 'amino_acids', quantity: 4 }
        ],
        producedItems: [
            { id: 'work_efficiency_serum', quantity: 1 }
        ]
    }
];

export const getAvailableKitchenLabActivities = (playerLevel: number): TrainingActivity[] => {
    return KITCHEN_LAB_ACTIVITIES.filter(activity => activity.requiredLevel <= playerLevel);
};

export const getKitchenLabActivityById = (id: string): TrainingActivity | undefined => {
    return KITCHEN_LAB_ACTIVITIES.find(activity => activity.id === id);
};