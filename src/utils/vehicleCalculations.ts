import {
    Engine,
    CarModel,
    PlayerCar,
    CarStats,
    TUNING_MULTIPLIERS,
    WEAR_PER_10000KM
} from '../types/vehicles';

// Arvuta mootori võimsus koos tuninguga
export function calculateEnginePower(engine: Engine): number {
    const basePower = engine.basePower;

    const totalMultiplier =
        TUNING_MULTIPLIERS.turbo[engine.turbo] *
        TUNING_MULTIPLIERS.ecu[engine.ecu] *
        TUNING_MULTIPLIERS.intake[engine.intake] *
        TUNING_MULTIPLIERS.exhaust[engine.exhaust];

    return Math.floor(basePower * totalMultiplier);
}

// Arvuta kulumine läbisõidu põhjal
export function calculateWearMultiplier(mileage: number): number {
    const wearFactor = Math.floor(mileage / 10000) * WEAR_PER_10000KM;
    return Math.max(0.5, 1 - wearFactor); // Min 50% võimsusest alles
}

// Arvuta auto lõplik võimsus
export function calculateFinalPower(engine: Engine, mileage: number): number {
    const tunedPower = calculateEnginePower(engine);
    const wearMultiplier = calculateWearMultiplier(mileage);
    return Math.floor(tunedPower * wearMultiplier);
}

// Arvuta kiirendus (0-100)
export function calculateAcceleration(power: number, mass: number): number {
    // Väga lihtne empiiriline valem
    const kwPerTon = (power / mass) * 1000;

    // Põhivalem
    let acceleration = 900 / kwPerTon;

    // Väike adjustment väga nõrkadele/tugevatele
    if (kwPerTon < 60) acceleration *= 0.95;
    if (kwPerTon > 140) acceleration *= 1.05;

    return Math.round(acceleration * 10) / 10;
}

// Koosta auto statistika
export function calculateCarStats(
    car: PlayerCar,
    model: CarModel
): CarStats {
    const finalPower = calculateFinalPower(car.engine, car.mileage);
    const acceleration = calculateAcceleration(finalPower, model.mass);

    return {
        power: finalPower,
        mass: model.mass,
        acceleration
    };
}

// Soovita müügihinda
export function suggestSalePrice(
    car: PlayerCar,
    model: CarModel
): number {
    const basePrice = model.basePrice;

    // Läbisõidu mõju (max 50% alla)
    const mileageDepreciation = Math.min(0.5, car.mileage / 500000);

    // Tuningu väärtus
    const tuningValue = calculateTuningValue(car.engine);

    const suggestedPrice = basePrice * (1 - mileageDepreciation) + tuningValue;
    return Math.floor(suggestedPrice);
}

// Arvuta tuningu lisaväärtus
function calculateTuningValue(engine: Engine): number {
    let value = 0;

    // Turbo väärtused
    if (engine.turbo === 'stage1') value += 5000;
    if (engine.turbo === 'stage2') value += 12000;
    if (engine.turbo === 'stage3') value += 25000;

    // ECU väärtused
    if (engine.ecu === 'stage1') value += 2000;
    if (engine.ecu === 'stage2') value += 4000;
    if (engine.ecu === 'stage3') value += 7000;

    // Intake väärtused
    if (engine.intake === 'sport') value += 800;
    if (engine.intake === 'performance') value += 2000;

    // Exhaust väärtused
    if (engine.exhaust === 'sport') value += 1200;
    if (engine.exhaust === 'performance') value += 3000;

    return value;
}