// src/types/vehicles.ts - CLEANED: Universal tuning system only

// ============= UNIVERSAL TUNING SYSTEM =============

// Universal tuning categories
export type UniversalTuningCategory =
    | 'injectors'
    | 'intake'
    | 'turbo'
    | 'exhaust'
    | 'ecu'
    | 'fuel_pump'
    | 'differential'
    | 'tires';

// Tuning state - stores current level (0-3) for each category
export interface UniversalTuningState {
    injectors: number;      // 0 = stock, 1-3 = stages
    intake: number;
    turbo: number;
    exhaust: number;
    ecu: number;
    fuel_pump: number;
    differential: number;
    tires: number;
}

// Universal tuning configuration
export interface TuningStageConfig {
    level: number;
    powerBoost: number;     // Percentage (e.g., 15 = +15%)
    gripModifier: number;   // Grip impact (positive or negative)
    pricePercent: number;   // Percentage of car base price
}

// Configuration for all tuning categories and their stages
export const UNIVERSAL_TUNING_CONFIG: Record<UniversalTuningCategory, {
    name: string;
    emoji: string;
    description: string;
    stages: TuningStageConfig[];
}> = {
    injectors: {
        name: 'Sissepritsed',
        emoji: '⛽',
        description: 'Kütuse sissepritse süsteem',
        stages: [
            { level: 0, powerBoost: 0, gripModifier: 0, pricePercent: 0 },     // Stock
            { level: 1, powerBoost: 8, gripModifier: 0, pricePercent: 12 },    // Stage 1: +8% power, 12% of car price
            { level: 2, powerBoost: 18, gripModifier: 0, pricePercent: 22 },   // Stage 2: +18% power, 22% of car price
            { level: 3, powerBoost: 35, gripModifier: 0, pricePercent: 40 }    // Stage 3: +35% power, 40% of car price
        ]
    },
    intake: {
        name: 'Õhuvõtt',
        emoji: '🌪️',
        description: 'Õhuvõtu süsteem',
        stages: [
            { level: 0, powerBoost: 0, gripModifier: 0, pricePercent: 0 },
            { level: 1, powerBoost: 6, gripModifier: 0, pricePercent: 10 },
            { level: 2, powerBoost: 12, gripModifier: 0, pricePercent: 18 },
            { level: 3, powerBoost: 22, gripModifier: 0, pricePercent: 32 }
        ]
    },
    turbo: {
        name: 'Turbo',
        emoji: '🌀',
        description: 'Turbolaadur',
        stages: [
            { level: 0, powerBoost: 0, gripModifier: 0, pricePercent: 0 },
            { level: 1, powerBoost: 25, gripModifier: -0.05, pricePercent: 25 },  // High power = grip loss
            { level: 2, powerBoost: 50, gripModifier: -0.10, pricePercent: 45 },
            { level: 3, powerBoost: 85, gripModifier: -0.15, pricePercent: 75 }
        ]
    },
    exhaust: {
        name: 'Väljalase',
        emoji: '🔥',
        description: 'Väljalaskesüsteem',
        stages: [
            { level: 0, powerBoost: 0, gripModifier: 0, pricePercent: 0 },
            { level: 1, powerBoost: 7, gripModifier: 0, pricePercent: 11 },
            { level: 2, powerBoost: 15, gripModifier: 0, pricePercent: 20 },
            { level: 3, powerBoost: 28, gripModifier: 0, pricePercent: 35 }
        ]
    },
    ecu: {
        name: 'ECU',
        emoji: '🧠',
        description: 'Mootori juhtplokk',
        stages: [
            { level: 0, powerBoost: 0, gripModifier: 0, pricePercent: 0 },
            { level: 1, powerBoost: 12, gripModifier: 0, pricePercent: 15 },
            { level: 2, powerBoost: 22, gripModifier: 0, pricePercent: 28 },
            { level: 3, powerBoost: 35, gripModifier: 0, pricePercent: 42 }
        ]
    },
    fuel_pump: {
        name: 'Kütusepimp',
        emoji: '⛽',
        description: 'Kütuse tarnesüsteem',
        stages: [
            { level: 0, powerBoost: 0, gripModifier: 0, pricePercent: 0 },
            { level: 1, powerBoost: 5, gripModifier: 0, pricePercent: 8 },
            { level: 2, powerBoost: 10, gripModifier: 0, pricePercent: 15 },
            { level: 3, powerBoost: 18, gripModifier: 0, pricePercent: 25 }
        ]
    },
    differential: {
        name: 'Diferentsiaal',
        emoji: '⚙️',
        description: 'Jõu jaotuse süsteem',
        stages: [
            { level: 0, powerBoost: 0, gripModifier: 0, pricePercent: 0 },
            { level: 1, powerBoost: 0, gripModifier: 0.08, pricePercent: 18 },   // Pure grip improvement
            { level: 2, powerBoost: 0, gripModifier: 0.15, pricePercent: 32 },
            { level: 3, powerBoost: 0, gripModifier: 0.25, pricePercent: 50 }
        ]
    },
    tires: {
        name: 'Rehvid',
        emoji: '🏁',
        description: 'Jõudlus rehvid',
        stages: [
            { level: 0, powerBoost: 0, gripModifier: 0, pricePercent: 0 },
            { level: 1, powerBoost: 0, gripModifier: 0.12, pricePercent: 14 },   // Pure grip improvement
            { level: 2, powerBoost: 0, gripModifier: 0.22, pricePercent: 25 },
            { level: 3, powerBoost: 0, gripModifier: 0.35, pricePercent: 38 }
        ]
    }
};

// ============= ENGINE AND CAR INTERFACES =============

export interface Engine {
    code: string;
    brand: string;
    basePower: number;
}

export interface CarModel {
    id: string;
    brand: string;
    model: string;
    mass: number;
    compatibleEngines: string[];
    defaultEngine: string;
    basePrice: number;
    imageUrl?: string;
}

// Clean PlayerCar interface
export interface PlayerCar {
    id: string;
    ownerId: string;
    carModelId: string;
    mileage: number;
    purchaseDate: Date;
    engine: Engine;

    // Universal tuning system
    universalTuning?: UniversalTuningState;
    grip?: number; // Default 1.0, affected by tuning

    isForSale: boolean;
    salePrice?: number;
    listedAt?: Date;
}

// Car stats interface
export interface CarStats {
    power: number;
    mass: number;
    acceleration: number;
    grip: number;
}

// ============= CONSTANTS =============

export const WEAR_PER_10000KM = 0.02;

// ============= OTHER INTERFACES =============

export interface CarListingItem {
    car: PlayerCar;
    model: CarModel;
    stats: CarStats;
    seller?: {
        id: string;
        username: string;
    };
}

export interface MarketplaceFilters {
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minPower?: number;
    maxPower?: number;
    maxMileage?: number;
}

export interface GarageSlot {
    slotId: number;
    carId?: string;
    isEmpty: boolean;
}

// ============= HELPER FUNCTIONS =============

// Calculate universal tuning power multiplier
export function calculateUniversalPowerMultiplier(tuning: UniversalTuningState): number {
    let totalBoost = 0;

    (Object.keys(tuning) as UniversalTuningCategory[]).forEach(category => {
        const level = tuning[category];
        const config = UNIVERSAL_TUNING_CONFIG[category];
        const stage = config.stages[level];
        if (stage) {
            totalBoost += stage.powerBoost;
        }
    });

    return 1 + (totalBoost / 100); // Convert percentage to multiplier
}

// Calculate universal tuning grip
export function calculateUniversalGrip(tuning: UniversalTuningState, basePower: number, finalPower: number): number {
    let baseGrip = 1.0;

    // Calculate grip modifiers from tuning
    (Object.keys(tuning) as UniversalTuningCategory[]).forEach(category => {
        const level = tuning[category];
        const config = UNIVERSAL_TUNING_CONFIG[category];
        const stage = config.stages[level];
        if (stage) {
            baseGrip += stage.gripModifier;
        }
    });

    // Apply power-based grip loss (high power = less grip)
    const powerIncrease = (finalPower - basePower) / basePower;
    const powerGripLoss = powerIncrease * 0.3; // Every 100% power increase = -30% grip
    baseGrip -= powerGripLoss;

    // Ensure grip doesn't go below 0.1
    return Math.max(0.1, Math.round(baseGrip * 100) / 100);
}

export function createDefaultUniversalTuning(): UniversalTuningState {
    return {
        injectors: 0,
        intake: 0,
        turbo: 0,
        exhaust: 0,
        ecu: 0,
        fuel_pump: 0,
        differential: 0,
        tires: 0
    };
}