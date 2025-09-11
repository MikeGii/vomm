// src/utils/vehicleCalculations.ts - CLEANED: Universal tuning system only

import {
    CarModel,
    PlayerCar,
    CarStats,
    WEAR_PER_10000KM,
    UniversalTuningState,
    calculateUniversalPowerMultiplier,
    calculateUniversalGrip,
    UNIVERSAL_TUNING_CONFIG
} from '../types/vehicles';

// ============= UNIVERSAL TUNING FUNCTIONS =============

// Universal tuning power calculation
export function calculateUniversalEnginePower(basePower: number, tuning: UniversalTuningState): number {
    const universalMultiplier = calculateUniversalPowerMultiplier(tuning);
    return Math.floor(basePower * universalMultiplier);
}

// Calculate final power with wear
export function calculateFinalPower(car: PlayerCar, basePower: number): number {
    let tunedPower: number;

    // Use universal tuning system
    if (car.universalTuning) {
        tunedPower = calculateUniversalEnginePower(basePower, car.universalTuning);
    } else {
        // Car doesn't have tuning yet, use base power
        tunedPower = basePower;
    }

    // Apply wear
    const wearMultiplier = calculateWearMultiplier(car.mileage);
    return Math.floor(tunedPower * wearMultiplier);
}

// ============= EXISTING UTILITY FUNCTIONS =============

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

// Calculate car stats with universal tuning
export function calculateCarStats(car: PlayerCar, model: CarModel): CarStats {
    const basePower = car.engine.basePower;
    const finalPower = calculateFinalPower(car, basePower);

    // Calculate grip using universal system
    let grip: number;
    if (car.universalTuning) {
        grip = calculateUniversalGrip(car.universalTuning, basePower, finalPower);
        // Use stored grip if available
        if (car.grip !== undefined) {
            grip = car.grip;
        }
    } else {
        // Default grip for cars without tuning
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

// ============= DUAL CURRENCY TUNING HELPER =============

/**
 * Arvuta tuunimise baas hind vastavalt auto valuutale
 * 100 pollid = 1,000,000 euros tuunimise arvutamiseks
 */
export function getTuningBasePrice(carModel: CarModel): number {
    if (carModel.currency === 'pollid') {
        const pollidPrice = carModel.basePollidPrice || 0;
        return pollidPrice * 10000; // 100 pollid = 1,000,000 euros
    }
    return carModel.basePrice;
}

// ============= UNIVERSAL TUNING HELPER FUNCTIONS =============

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

// ============= CAR VALUE FUNCTIONS =============

export function suggestSalePrice(car: PlayerCar, model: CarModel): number {
    // Kasuta uut dual currency funktsioonid
    const tuningBasePrice = getTuningBasePrice(model);
    const mileageFactor = Math.max(0.3, 1 - (car.mileage / 200000));
    const ageFactor = Math.max(0.4, 1 - ((Date.now() - car.purchaseDate.getTime()) / (365 * 24 * 60 * 60 * 1000 * 5)));

    // Kasuta auto põhihinda müügihinna arvutamiseks (mitte tuunimise hinda)
    const basePrice = model.currency === 'pollid' ? (model.basePollidPrice || 0) : model.basePrice;

    // Add tuning value to sale price
    let tuningValue = 0;
    if (car.universalTuning) {
        // Add 50% of tuning cost to sale price
        tuningValue = calculateTotalTuningCost(car.universalTuning, tuningBasePrice) * 0.5;
    }

    return Math.floor((basePrice * mileageFactor * ageFactor) + tuningValue);
}