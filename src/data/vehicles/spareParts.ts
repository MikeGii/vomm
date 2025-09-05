// src/data/vehicles/spareParts.ts

import {
    TurboLevel,
    ECULevel,
    IntakeLevel,
    ExhaustLevel
} from '../../types/vehicles';

export interface SparePart {
    id: string;
    category: 'turbo' | 'ecu' | 'intake' | 'exhaust';
    level: TurboLevel | ECULevel | IntakeLevel | ExhaustLevel;
    name: string;
    description: string;
    price: number;
    powerBoost: number; // Percentage boost (matches POWER_MULTIPLIERS)
    compatibleEngines?: string[];
}

// Updated spare parts with correct pricing logic
export const SPARE_PARTS: SparePart[] = [

    // STOCK parts (for selling purposes)
    {
        id: 'turbo_stock',
        category: 'turbo',
        level: 'stock' as TurboLevel,
        name: 'Tehase Turbo',
        description: 'Originaal tehase turbo süsteem',
        price: 6000, // 25% of stage1 price
        powerBoost: 0
    },
    {
        id: 'ecu_stock',
        category: 'ecu',
        level: 'stock' as ECULevel,
        name: 'Tehase ECU',
        description: 'Originaal tehase ECU häälestus',
        price: 2250, // 25% of stage1 price
        powerBoost: 0
    },
    {
        id: 'intake_stock',
        category: 'intake',
        level: 'stock' as IntakeLevel,
        name: 'Tehase õhuvõtt',
        description: 'Originaal tehase õhuvõtusüsteem',
        price: 1125, // 25% of sport price
        powerBoost: 0
    },
    {
        id: 'exhaust_stock',
        category: 'exhaust',
        level: 'stock' as ExhaustLevel,
        name: 'Tehase väljalase',
        description: 'Originaal tehase väljalaskesüsteem',
        price: 1500, // 25% of sport price
        powerBoost: 0
    },

    // TURBO parts
    {
        id: 'turbo_stage1',
        category: 'turbo',
        level: 'stage1' as TurboLevel,
        name: 'Stage 1 Turbo',
        description: 'Algeline turbo täiendus - annab 40% võimsust juurde',
        price: 24000,
        powerBoost: 40
    },
    {
        id: 'turbo_stage2',
        category: 'turbo',
        level: 'stage2' as TurboLevel,
        name: 'Stage 2 Turbo',
        description: 'Keskmine turbo täiendus - annab 80% võimsust juurde',
        price: 45000,
        powerBoost: 80
    },
    {
        id: 'turbo_stage3',
        category: 'turbo',
        level: 'stage3' as TurboLevel,
        name: 'Stage 3 Turbo',
        description: 'Võimas turbo süsteem - annab 200% võimsust juurde',
        price: 90000,
        powerBoost: 200
    },

    // ECU parts
    {
        id: 'ecu_stage1',
        category: 'ecu',
        level: 'stage1' as ECULevel,
        name: 'Stage 1 ECU',
        description: 'Algeline ECU häälestus - annab 15% võimsust juurde',
        price: 9000,
        powerBoost: 15
    },
    {
        id: 'ecu_stage2',
        category: 'ecu',
        level: 'stage2' as ECULevel,
        name: 'Stage 2 ECU',
        description: 'Edasijõudnute ECU häälestus - annab 25% võimsust juurde',
        price: 15000,
        powerBoost: 25
    },
    {
        id: 'ecu_stage3',
        category: 'ecu',
        level: 'stage3' as ECULevel,
        name: 'Stage 3 ECU',
        description: 'Võistlus ECU häälestus - annab 35% võimsust juurde',
        price: 24000,
        powerBoost: 35
    },

    // INTAKE parts
    {
        id: 'intake_sport',
        category: 'intake',
        level: 'sport' as IntakeLevel,
        name: 'Sport õhufilter',
        description: 'Sport õhuvõtusüsteem - annab 8% võimsust juurde',
        price: 4500,
        powerBoost: 8
    },
    {
        id: 'intake_performance',
        category: 'intake',
        level: 'performance' as IntakeLevel,
        name: 'Performance õhufilter',
        description: 'Võistlus õhuvõtusüsteem - annab 15% võimsust juurde',
        price: 10500,
        powerBoost: 15
    },

    // EXHAUST parts
    {
        id: 'exhaust_sport',
        category: 'exhaust',
        level: 'sport' as ExhaustLevel,
        name: 'Sport väljalaskesüsteem',
        description: 'Sport summuti - annab 10% võimsust juurde',
        price: 6000,
        powerBoost: 10
    },
    {
        id: 'exhaust_performance',
        category: 'exhaust',
        level: 'performance' as ExhaustLevel,
        name: 'Performance väljalaskesüsteem',
        description: 'Võistlus summuti - annab 20% võimsust juurde',
        price: 13500,
        powerBoost: 20
    }
];

// Helper functions
export const getPartById = (id: string): SparePart | undefined => {
    return SPARE_PARTS.find(part => part.id === id);
};

export const getPartsByCategory = (category: string): SparePart[] => {
    return SPARE_PARTS.filter(part => part.category === category);
};

export const getPartByTypeAndLevel = (
    category: 'turbo' | 'ecu' | 'intake' | 'exhaust',
    level: string
): SparePart | undefined => {
    return SPARE_PARTS.find(part =>
        part.category === category && part.level === level
    );
};

// NEW: Get stock part price (25% of next level)
export const getStockPartPrice = (
    category: 'turbo' | 'ecu' | 'intake' | 'exhaust'
): number => {
    let nextLevelPartId: string;

    switch (category) {
        case 'turbo':
        case 'ecu':
            nextLevelPartId = `${category}_stage1`;
            break;
        case 'intake':
        case 'exhaust':
            nextLevelPartId = `${category}_sport`;
            break;
        default:
            return 0;
    }

    const nextLevelPart = getPartById(nextLevelPartId);
    return nextLevelPart ? Math.floor(nextLevelPart.price * 0.25) : 0;
};

// NEW: Get sell price for any part (50% of original price)
export const getPartSellPrice = (partId: string, purchasePrice?: number): number => {
    // If we know the purchase price, use that
    if (purchasePrice) {
        return Math.floor(purchasePrice * 0.5);
    }

    // Otherwise use current market price
    const part = getPartById(partId);
    return part ? Math.floor(part.price * 0.5) : 0;
};