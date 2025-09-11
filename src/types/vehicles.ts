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

export interface TuningRequirements {
    playerLevel: number;
    handling?: number;
    reactionTime?: number;
    gearShifting?: number;
}

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

export const UNIVERSAL_TUNING_CONFIG: Record<UniversalTuningCategory, {
    name: string;
    emoji: string;
    description: string;
    stages: TuningStageConfig[];
    requirements: TuningRequirements[]; // NEW: Add requirements for each stage
}> = {
    injectors: {
        name: 'Sissepritse',
        emoji: '⛽',
        description: 'Kütuse sissepritse süsteem',
        stages: [
            { level: 0, powerBoost: 0, gripModifier: 0, pricePercent: 0 },
            { level: 1, powerBoost: 8, gripModifier: 0, pricePercent: 12 },
            { level: 2, powerBoost: 18, gripModifier: 0, pricePercent: 22 },
            { level: 3, powerBoost: 35, gripModifier: 0, pricePercent: 40 }
        ],
        requirements: [
            { playerLevel: 0 }, // Stock - no requirements
            { playerLevel: 70, handling: 15 }, // Stage 1
            { playerLevel: 90, handling: 50 }, // Stage 2
            { playerLevel: 110, handling: 70 } // Stage 3
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
        ],
        requirements: [
            { playerLevel: 0 }, // Stock
            { playerLevel: 65, handling: 10, reactionTime: 5 }, // Stage 1
            { playerLevel: 85, handling: 35, reactionTime: 25 }, // Stage 2
            { playerLevel: 105, handling: 60, reactionTime: 40 } // Stage 3
        ]
    },
    turbo: {
        name: 'Turbo',
        emoji: '🌀',
        description: 'Turbolaadur',
        stages: [
            { level: 0, powerBoost: 0, gripModifier: 0, pricePercent: 0 },
            { level: 1, powerBoost: 25, gripModifier: -0.05, pricePercent: 25 },
            { level: 2, powerBoost: 50, gripModifier: -0.10, pricePercent: 45 },
            { level: 3, powerBoost: 85, gripModifier: -0.15, pricePercent: 75 }
        ],
        requirements: [
            { playerLevel: 0 }, // Stock
            { playerLevel: 80, handling: 25, gearShifting: 20 }, // Stage 1
            { playerLevel: 100, handling: 55, gearShifting: 45 }, // Stage 2
            { playerLevel: 120, handling: 80, gearShifting: 70 } // Stage 3
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
        ],
        requirements: [
            { playerLevel: 0 }, // Stock
            { playerLevel: 65, handling: 12, reactionTime: 8 }, // Stage 1
            { playerLevel: 85, handling: 38, reactionTime: 28 }, // Stage 2
            { playerLevel: 105, handling: 65, reactionTime: 45 } // Stage 3
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
        ],
        requirements: [
            { playerLevel: 0 }, // Stock
            { playerLevel: 78, handling: 22, gearShifting: 18 }, // Stage 1
            { playerLevel: 98, handling: 52, gearShifting: 42 }, // Stage 2
            { playerLevel: 118, handling: 78, gearShifting: 68 } // Stage 3
        ]
    },
    fuel_pump: {
        name: 'Kütusepump',
        emoji: '⛽',
        description: 'Kütuse tarnesüsteem',
        stages: [
            { level: 0, powerBoost: 0, gripModifier: 0, pricePercent: 0 },
            { level: 1, powerBoost: 5, gripModifier: 0, pricePercent: 8 },
            { level: 2, powerBoost: 10, gripModifier: 0, pricePercent: 15 },
            { level: 3, powerBoost: 18, gripModifier: 0, pricePercent: 25 }
        ],
        requirements: [
            { playerLevel: 0 }, // Stock
            { playerLevel: 70, handling: 15 }, // Stage 1
            { playerLevel: 90, handling: 50 }, // Stage 2
            { playerLevel: 110, handling: 70 } // Stage 3
        ]
    },
    differential: {
        name: 'Differentsiaal',
        emoji: '⚙️',
        description: 'Jõu jaotuse süsteem',
        stages: [
            { level: 0, powerBoost: 0, gripModifier: 0, pricePercent: 0 },
            { level: 1, powerBoost: 0, gripModifier: 0.08, pricePercent: 18 },
            { level: 2, powerBoost: 0, gripModifier: 0.15, pricePercent: 32 },
            { level: 3, powerBoost: 0, gripModifier: 0.25, pricePercent: 50 }
        ],
        requirements: [
            { playerLevel: 0 }, // Stock
            { playerLevel: 82, handling: 28, gearShifting: 22 }, // Stage 1
            { playerLevel: 102, handling: 58, gearShifting: 48 }, // Stage 2
            { playerLevel: 122, handling: 85, gearShifting: 75 } // Stage 3
        ]
    },
    tires: {
        name: 'Rehvid',
        emoji: '🏁',
        description: 'Jõudlus rehvid',
        stages: [
            { level: 0, powerBoost: 0, gripModifier: 0, pricePercent: 0 },
            { level: 1, powerBoost: 0, gripModifier: 0.12, pricePercent: 14 },
            { level: 2, powerBoost: 0, gripModifier: 0.22, pricePercent: 25 },
            { level: 3, powerBoost: 0, gripModifier: 0.35, pricePercent: 38 }
        ],
        requirements: [
            { playerLevel: 0 }, // Stock
            { playerLevel: 75, handling: 18, reactionTime: 10 }, // Stage 1
            { playerLevel: 95, handling: 45, reactionTime: 30 }, // Stage 2
            { playerLevel: 115, handling: 72, reactionTime: 55 } // Stage 3
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

export function checkTuningRequirements(
    category: UniversalTuningCategory,
    stage: number,
    playerLevel: number,
    playerAttributes: {
        handling?: number;
        reactionTime?: number;
        gearShifting?: number;
    }
): { canUpgrade: boolean; missingRequirements: string[] } {
    const config = UNIVERSAL_TUNING_CONFIG[category];
    const requirements = config.requirements[stage];

    if (!requirements) {
        return { canUpgrade: false, missingRequirements: ['Tundmatu nõue'] };
    }

    const missingRequirements: string[] = [];

    // Check player level
    if (playerLevel < requirements.playerLevel) {
        missingRequirements.push(`Tase ${requirements.playerLevel} (praegu ${playerLevel})`);
    }

    // Check handling
    if (requirements.handling && (playerAttributes.handling || 0) < requirements.handling) {
        missingRequirements.push(`Käsitsemine ${requirements.handling} (praegu ${playerAttributes.handling || 0})`);
    }

    // Check reaction time
    if (requirements.reactionTime && (playerAttributes.reactionTime || 0) < requirements.reactionTime) {
        missingRequirements.push(`Reaktsiooniaeg ${requirements.reactionTime} (praegu ${playerAttributes.reactionTime || 0})`);
    }

    // Check gear shifting
    if (requirements.gearShifting && (playerAttributes.gearShifting || 0) < requirements.gearShifting) {
        missingRequirements.push(`Käiguvahetus ${requirements.gearShifting} (praegu ${playerAttributes.gearShifting || 0})`);
    }

    return {
        canUpgrade: missingRequirements.length === 0,
        missingRequirements
    };
}

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