// src/utils/vehicleCalculations.ts

import {
    Engine,
    CarModel,
    PlayerCar,
    CarStats,
    POWER_MULTIPLIERS, // UPDATED: Use new multipliers
    WEAR_PER_10000KM
} from '../types/vehicles';

// UPDATED: Calculate engine power using correct multipliers
export function calculateEnginePower(engine: Engine): number {
    const basePower = engine.basePower;

    const totalMultiplier =
        POWER_MULTIPLIERS.turbo[engine.turbo] *
        POWER_MULTIPLIERS.ecu[engine.ecu] *
        POWER_MULTIPLIERS.intake[engine.intake] *
        POWER_MULTIPLIERS.exhaust[engine.exhaust];

    return Math.floor(basePower * totalMultiplier);
}

// Keep all other functions unchanged
export function calculateWearMultiplier(mileage: number): number {
    const wearFactor = Math.floor(mileage / 10000) * WEAR_PER_10000KM;
    return Math.max(0.5, 1 - wearFactor);
}

export function calculateFinalPower(engine: Engine, mileage: number): number {
    const tunedPower = calculateEnginePower(engine);
    const wearMultiplier = calculateWearMultiplier(mileage);
    return Math.floor(tunedPower * wearMultiplier);
}

export function calculateAcceleration(power: number, mass: number): number {
    const kwPerTon = (power / mass) * 1000;
    let acceleration = 900 / kwPerTon;

    if (kwPerTon < 60) acceleration *= 0.95;
    if (kwPerTon > 140) acceleration *= 1.05;

    return Math.round(acceleration * 10) / 10;
}

export function calculateCarStats(car: PlayerCar, model: CarModel): CarStats {
    const finalPower = calculateFinalPower(car.engine, car.mileage);
    const acceleration = calculateAcceleration(finalPower, model.mass);

    return {
        power: finalPower,
        mass: model.mass,
        acceleration
    };
}

export function suggestSalePrice(car: PlayerCar, model: CarModel): number {
    const basePrice = model.basePrice;
    const mileageFactor = Math.max(0.3, 1 - (car.mileage / 200000));
    const ageFactor = Math.max(0.4, 1 - ((Date.now() - car.purchaseDate.getTime()) / (365 * 24 * 60 * 60 * 1000 * 5)));

    return Math.floor(basePrice * mileageFactor * ageFactor);
}