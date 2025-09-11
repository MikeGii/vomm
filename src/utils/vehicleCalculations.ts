// src/utils/vehicleCalculations.ts - UPDATED FOR UNIVERSAL TUNING SYSTEM

import {
    Engine,
    CarModel,
    PlayerCar,
    CarStats,
    POWER_MULTIPLIERS, // Keep for backward compatibility
    WEAR_PER_10000KM,
    UniversalTuningState,
    calculateUniversalPowerMultiplier,
    calculateUniversalGrip, UNIVERSAL_TUNING_CONFIG, createDefaultUniversalTuning
} from '../types/vehicles';

// ============= EXISTING FUNCTIONS (Updated for new system) =============

// Legacy engine power calculation (for old cars)
export function calculateEnginePower(engine: Engine): number {
    const basePower = engine.basePower;

    const totalMultiplier =
        POWER_MULTIPLIERS.turbo[engine.turbo] *
        POWER_MULTIPLIERS.ecu[engine.ecu] *
        POWER_MULTIPLIERS.intake[engine.intake] *
        POWER_MULTIPLIERS.exhaust[engine.exhaust];

    return Math.floor(basePower * totalMultiplier);
}

// NEW: Universal tuning power calculation
export function calculateUniversalEnginePower(basePower: number, tuning: UniversalTuningState): number {
    const universalMultiplier = calculateUniversalPowerMultiplier(tuning);
    return Math.floor(basePower * universalMultiplier);
}

// UPDATED: Support both tuning systems
export function calculateFinalPower(car: PlayerCar, basePower?: number): number {
    let tunedPower: number;

    // Check if car uses new universal tuning system
    if (car.universalTuning && basePower !== undefined) {
        // NEW SYSTEM: Use universal tuning
        tunedPower = calculateUniversalEnginePower(basePower, car.universalTuning);
    } else {
        // OLD SYSTEM: Use legacy engine tuning
        tunedPower = calculateEnginePower(car.engine);
    }

    // Apply wear regardless of tuning system
    const wearMultiplier = calculateWearMultiplier(car.mileage);
    return Math.floor(tunedPower * wearMultiplier);
}

// Keep existing functions unchanged
export function calculateWearMultiplier(mileage: number): number {
    const wearFactor = Math.floor(mileage / 10000) * WEAR_PER_10000KM;
    return Math.max(0.5, 1 - wearFactor);
}

export function calculateAcceleration(power: number, mass: number): number {
    const kwPerTon = (power / mass) * 1000;
    let acceleration = 900 / kwPerTon;

    if (kwPerTon < 60) acceleration *= 0.95;
    if (kwPerTon > 140) acceleration *= 1.05;

    return Math.round(acceleration * 10) / 10;
}

// UPDATED: Calculate car stats with grip support
export function calculateCarStats(car: PlayerCar, model: CarModel): CarStats {
    let finalPower: number;
    let grip: number;

    // Check if car uses new universal tuning system
    if (car.universalTuning) {
        // NEW SYSTEM: Universal tuning
        const basePower = car.engine.basePower;
        finalPower = calculateFinalPower(car, basePower);

        // Calculate grip using universal system
        grip = calculateUniversalGrip(car.universalTuning, basePower, finalPower);

        // Use stored grip if available, otherwise calculate
        if (car.grip !== undefined) {
            grip = car.grip;
        }
    } else {
        // OLD SYSTEM: Legacy tuning
        finalPower = calculateFinalPower(car);

        // Default grip for old cars (we can migrate this later)
        grip = car.grip || 1.0;
    }

    const acceleration = calculateAcceleration(finalPower, model.mass);

    return {
        power: finalPower,
        mass: model.mass,
        acceleration,
        grip
    };
}


// Check if car has any universal tuning upgrades
export function hasUniversalTuningUpgrades(tuning: UniversalTuningState): boolean {
    return Object.values(tuning).some(level => level > 0);
}

// Get total universal tuning cost for a car
export function calculateTotalTuningCost(tuning: UniversalTuningState, carBasePrice: number): number {
    let totalCost = 0;

    Object.entries(tuning).forEach(([category, level]) => {
        const categoryConfig = UNIVERSAL_TUNING_CONFIG[category as keyof UniversalTuningState];
        if (categoryConfig) {
            // Sum cost of all stages up to current level
            for (let i = 1; i <= level; i++) {
                const stage = categoryConfig.stages[i];
                if (stage) {
                    totalCost += Math.floor(carBasePrice * (stage.pricePercent / 100));
                }
            }
        }
    });

    return totalCost;
}

// Calculate cost to upgrade one category by one level
export function calculateUpgradeCost(
    category: keyof UniversalTuningState,
    currentLevel: number,
    carBasePrice: number
): number {
    const categoryConfig = UNIVERSAL_TUNING_CONFIG[category];
    if (!categoryConfig || currentLevel >= 3) return 0;

    const nextLevel = currentLevel + 1;
    const stage = categoryConfig.stages[nextLevel];

    return stage ? Math.floor(carBasePrice * (stage.pricePercent / 100)) : 0;
}

// ============= MIGRATION HELPERS =============

// Convert old tuning to universal tuning (for migration)
export function migrateToUniversalTuning(car: PlayerCar): UniversalTuningState {
    const tuning = createDefaultUniversalTuning(); // Now uses imported function

    // Map old levels to new levels
    const levelMap = {
        'stock': 0,
        'stage1': 1,
        'stage2': 2,
        'stage3': 3,
        'sport': 1,
        'performance': 2
    } as const;

    // Convert existing tuning
    tuning.turbo = levelMap[car.engine.turbo] || 0;
    tuning.ecu = levelMap[car.engine.ecu] || 0;
    tuning.intake = levelMap[car.engine.intake] || 0;
    tuning.exhaust = levelMap[car.engine.exhaust] || 0;

    return tuning;
}

// Backward compatibility: Keep the original calculateFinalPower signature
export function calculateFinalPowerLegacy(engine: Engine, mileage: number): number {
    const tunedPower = calculateEnginePower(engine);
    const wearMultiplier = calculateWearMultiplier(mileage);
    return Math.floor(tunedPower * wearMultiplier);
}

// ============= KEEP EXISTING FUNCTIONS =============

export function suggestSalePrice(car: PlayerCar, model: CarModel): number {
    const basePrice = model.basePrice;
    const mileageFactor = Math.max(0.3, 1 - (car.mileage / 200000));
    const ageFactor = Math.max(0.4, 1 - ((Date.now() - car.purchaseDate.getTime()) / (365 * 24 * 60 * 60 * 1000 * 5)));

    // Add tuning value to sale price
    let tuningValue = 0;
    if (car.universalTuning) {
        // New system: Add 50% of tuning cost to sale price
        tuningValue = calculateTotalTuningCost(car.universalTuning, basePrice) * 0.5;
    }

    return Math.floor((basePrice * mileageFactor * ageFactor) + tuningValue);
}