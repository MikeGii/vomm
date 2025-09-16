// src/services/DragRaceService.ts
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import {
    FuelSystem,
    TrainingType,
    TrainingResult,
    TRAINING_OPTIONS,
    FUEL_CONSTANTS,
    FuelPurchaseOption, DRAG_RACE_TRACKS, DragRaceResult
} from '../types/dragRace';
import { PlayerStats, AttributeData } from '../types';
import { initializeAttributes } from './TrainingService';
import {calculateCarStats} from "../utils/vehicleCalculations";
import {VehicleModel} from "../types/vehicleDatabase";
import {PlayerCar} from "../types/vehicles";
import {DragRacePhysics} from "../utils/dragRacePhysics";

export class DragRaceService {

    // Initialize drag race attributes if they don't exist
    static async initializeDragRaceAttributes(userId: string): Promise<void> {
        const statsRef = doc(firestore, 'playerStats', userId);
        const statsDoc = await getDoc(statsRef);

        if (!statsDoc.exists()) {
            throw new Error('Player stats not found');
        }

        const playerStats = statsDoc.data() as PlayerStats;

        // Check if drag race attributes exist
        const dragRaceAttributes = ['handling', 'reactionTime', 'gearShifting'];
        const updates: any = {};
        let needsUpdate = false;

        // Initialize base attributes if they don't exist
        if (!playerStats.attributes) {
            updates.attributes = initializeAttributes();
            needsUpdate = true;
        } else {
            // Initialize specific drag race attributes if missing
            dragRaceAttributes.forEach(attr => {
                // Add null check for attributes
                if (playerStats.attributes && !playerStats.attributes[attr as keyof typeof playerStats.attributes]) {
                    updates[`attributes.${attr}`] = {
                        level: 1,
                        experience: 0,
                        experienceForNextLevel: 100
                    };
                    needsUpdate = true;
                }
            });
        }

        if (needsUpdate) {
            await updateDoc(statsRef, updates);
        }
    }

    // Get or create fuel system for user
    static async getFuelSystem(userId: string): Promise<FuelSystem> {
        const fuelRef = doc(firestore, 'dragRaceFuel', userId);
        const fuelDoc = await getDoc(fuelRef);

        if (!fuelDoc.exists()) {
            // Create new fuel system
            const now = new Date();
            const nextReset = this.getNextHourlyReset(now);

            const newFuelSystem: FuelSystem = {
                currentFuel: FUEL_CONSTANTS.MAX_FREE_FUEL,
                maxFreeFuel: FUEL_CONSTANTS.MAX_FREE_FUEL,
                lastFuelReset: now,
                paidAttemptsUsed: 0,
                maxPaidAttempts: FUEL_CONSTANTS.MAX_PAID_ATTEMPTS,
                nextResetTime: nextReset
            };

            await setDoc(fuelRef, {
                ...newFuelSystem,
                lastFuelReset: Timestamp.fromDate(newFuelSystem.lastFuelReset),
                nextResetTime: Timestamp.fromDate(newFuelSystem.nextResetTime)
            });

            return newFuelSystem;
        }

        const data = fuelDoc.data();
        return {
            currentFuel: data.currentFuel,
            maxFreeFuel: data.maxFreeFuel,
            lastFuelReset: data.lastFuelReset.toDate(),
            paidAttemptsUsed: data.paidAttemptsUsed,
            maxPaidAttempts: data.maxPaidAttempts,
            nextResetTime: data.nextResetTime.toDate()
        };
    }

    // Check and reset fuel if needed
    static async checkAndResetFuel(userId: string): Promise<FuelSystem> {
        const fuelSystem = await this.getFuelSystem(userId);
        const now = new Date();

        if (now >= fuelSystem.nextResetTime) {
            // Reset fuel
            const nextReset = this.getNextHourlyReset(now);

            const updatedFuelSystem: FuelSystem = {
                ...fuelSystem,
                currentFuel: FUEL_CONSTANTS.MAX_FREE_FUEL,
                lastFuelReset: now,
                paidAttemptsUsed: 0,
                nextResetTime: nextReset
            };

            const fuelRef = doc(firestore, 'dragRaceFuel', userId);
            await updateDoc(fuelRef, {
                currentFuel: FUEL_CONSTANTS.MAX_FREE_FUEL,
                lastFuelReset: Timestamp.fromDate(now),
                paidAttemptsUsed: 0,
                nextResetTime: Timestamp.fromDate(nextReset)
            });

            return updatedFuelSystem;
        }

        return fuelSystem;
    }

    // Calculate next hourly reset (exact hour)
    static getNextHourlyReset(currentTime: Date): Date {
        const nextReset = new Date(currentTime);
        nextReset.setHours(nextReset.getHours() + 1, 0, 0, 0);
        return nextReset;
    }

    // Calculate XP based on source attribute level
    static calculateTrainingXP(trainingType: TrainingType, playerStats: PlayerStats): number {
        const trainingOption = TRAINING_OPTIONS.find(option => option.id === trainingType);
        if (!trainingOption || !playerStats.attributes) {
            return 0;
        }

        const sourceAttributeData = playerStats.attributes[trainingOption.sourceAttribute];
        const attributeLevel = sourceAttributeData?.level || 1;

        // Formula: baseXP + (attributeLevel - 1) * (baseXP * 0.05)
        const baseXP = trainingOption.baseXP;
        const bonus = (attributeLevel - 1) * (baseXP * 0.05);

        return Math.round(baseXP + bonus);
    }

    // Perform training
    static async performTraining(
        userId: string,
        trainingType: TrainingType,
        playerStats: PlayerStats
    ): Promise<TrainingResult> {
        // Initialize drag race attributes if needed
        await this.initializeDragRaceAttributes(userId);

        // Refetch player stats to get initialized attributes
        const statsRef = doc(firestore, 'playerStats', userId);
        const updatedStatsDoc = await getDoc(statsRef);

        if (!updatedStatsDoc.exists()) {
            throw new Error('Player stats not found');
        }

        const updatedPlayerStats = updatedStatsDoc.data() as PlayerStats;

        // Check fuel availability
        const fuelSystem = await this.checkAndResetFuel(userId);

        if (fuelSystem.currentFuel <= 0) {
            throw new Error('Kütus on otsas! Osta lisaks või oota järgmist tundi.');
        }

        // Check if player has active car
        if (!updatedPlayerStats.activeCarId) {
            throw new Error('Määra esmalt aktiivne auto!');
        }

        // Calculate XP gain using updated stats
        const xpGained = this.calculateTrainingXP(trainingType, updatedPlayerStats);

        // Get current attribute data - now guaranteed to exist
        const trainingOption = TRAINING_OPTIONS.find(option => option.id === trainingType);
        if (!trainingOption || !updatedPlayerStats.attributes) {
            throw new Error('Vigane treeningu tüüp');
        }

        const currentAttributeData = updatedPlayerStats.attributes[trainingType] as AttributeData;

        // Ensure the attribute exists
        if (!currentAttributeData) {
            throw new Error(`Drag race atribuut ${trainingType} ei ole inicializeeritud`);
        }

        // Calculate multiple level-ups properly
        let newLevel = currentAttributeData.level;
        let remainingXP = currentAttributeData.experience + xpGained;
        let expForNextLevel = currentAttributeData.experienceForNextLevel;
        let levelsGained = 0;

        // Handle multiple level-ups
        while (remainingXP >= expForNextLevel) {
            remainingXP -= expForNextLevel;
            newLevel++;
            levelsGained++;
            expForNextLevel = this.calculateExpForNextLevel(newLevel);
        }

        const levelUp = levelsGained > 0;

        // Batch write for atomic updates
        const batch = writeBatch(firestore);

        // Update player stats
        const userRef = doc(firestore, 'playerStats', userId);

        if (levelUp) {
            // Update level, experience, and experienceForNextLevel
            batch.update(userRef, {
                [`attributes.${trainingType}.level`]: newLevel,
                [`attributes.${trainingType}.experience`]: remainingXP,
                [`attributes.${trainingType}.experienceForNextLevel`]: expForNextLevel
            });
        } else {
            // Only update experience
            batch.update(userRef, {
                [`attributes.${trainingType}.experience`]: increment(xpGained)
            });
        }

        // Update fuel
        const fuelRef = doc(firestore, 'dragRaceFuel', userId);
        batch.update(fuelRef, {
            currentFuel: increment(-1)
        });

        // Update car mileage
        const carRef = doc(firestore, 'cars', updatedPlayerStats.activeCarId);
        batch.update(carRef, {
            mileage: increment(FUEL_CONSTANTS.MILEAGE_PER_ATTEMPT)
        });

        await batch.commit();

        return {
            success: true,
            experienceGained: xpGained,
            newLevel: levelUp ? newLevel : undefined,
            levelUp,
            currentLevel: newLevel,
            currentExperience: remainingXP,
            experienceForNextLevel: expForNextLevel,
            fuelUsed: 1,
            remainingFuel: fuelSystem.currentFuel - 1,
            levelsGained
        };
    }

    // Calculate experience required for next level (same formula as other attributes)
    static calculateExpForNextLevel(currentLevel: number): number {
        if (currentLevel === 0) return 100;
        const baseExp = (currentLevel + 1) * 100;
        const bonus = baseExp * 0.15;
        return Math.floor(baseExp + bonus);
    }

    // Get available fuel purchase options
    static async getFuelPurchaseOptions(userId: string, playerStats: PlayerStats): Promise<FuelPurchaseOption[]> {
        const fuelSystem = await this.checkAndResetFuel(userId);

        const options: FuelPurchaseOption[] = [];

        // Money purchase option
        const moneyAttemptsRemaining = FUEL_CONSTANTS.MAX_PAID_ATTEMPTS - fuelSystem.paidAttemptsUsed;
        options.push({
            type: 'money',
            cost: FUEL_CONSTANTS.MONEY_COST_PER_ATTEMPT,
            available: moneyAttemptsRemaining > 0 && (playerStats.money >= FUEL_CONSTANTS.MONEY_COST_PER_ATTEMPT),
            remaining: moneyAttemptsRemaining
        });

        // Pollid purchase option (unlimited after money attempts)
        const pollidAvailable = fuelSystem.paidAttemptsUsed >= FUEL_CONSTANTS.MAX_PAID_ATTEMPTS;
        options.push({
            type: 'pollid',
            cost: FUEL_CONSTANTS.POLLID_COST_PER_ATTEMPT,
            available: pollidAvailable && ((playerStats.pollid || 0) >= FUEL_CONSTANTS.POLLID_COST_PER_ATTEMPT)
        });

        return options;
    }

    // Purchase fuel
    static async purchaseFuel(
        userId: string,
        purchaseType: 'money' | 'pollid',
        quantity: number,
        playerStats: PlayerStats
    ): Promise<{ success: boolean; newFuelCount: number; totalCost: number; actualQuantity: number }> {
        const fuelSystem = await this.checkAndResetFuel(userId);
        const options = await this.getFuelPurchaseOptions(userId, playerStats);
        const option = options.find(opt => opt.type === purchaseType);

        if (!option || !option.available) {
            throw new Error('Seda ostu võimalust ei ole saadaval');
        }

        let actualQuantity = quantity;

        // For money purchases, limit by remaining attempts
        if (purchaseType === 'money' && option.remaining !== undefined) {
            actualQuantity = Math.min(quantity, option.remaining);
        }

        const totalCost = option.cost * actualQuantity;

        // Check if player can afford it
        const playerCurrency = purchaseType === 'money' ? playerStats.money : (playerStats.pollid || 0);
        if (playerCurrency < totalCost) {
            throw new Error(`Pole piisavalt ${purchaseType === 'money' ? 'raha' : 'pollid'}`);
        }

        const batch = writeBatch(firestore);

        // Update the correct collection - use playerStats consistently
        const userRef = doc(firestore, 'playerStats', userId);
        const currencyField = purchaseType === 'money' ? 'money' : 'pollid';

        // Use increment to ensure atomic updates
        batch.update(userRef, {
            [currencyField]: increment(-totalCost),
            lastModified: Timestamp.now()
        });

        // Update fuel and paid attempts
        const fuelRef = doc(firestore, 'dragRaceFuel', userId);
        const fuelUpdate: any = {
            currentFuel: increment(actualQuantity)
        };

        // Only update paid attempts counter for money purchases
        if (purchaseType === 'money') {
            fuelUpdate.paidAttemptsUsed = increment(actualQuantity);
        }

        batch.update(fuelRef, fuelUpdate);

        await batch.commit();

        return {
            success: true,
            newFuelCount: fuelSystem.currentFuel + actualQuantity,
            totalCost,
            actualQuantity
        };
    }

    /**
     * Perform a drag race (consumes fuel like training)
     */
    static async performDragRace(
        userId: string,
        trackId: string,
        playerStats: PlayerStats,
        activeCar: { car: PlayerCar; model: VehicleModel }
    ): Promise<{
        result: DragRaceResult;
        remainingFuel: number;
    }> {
        // Check fuel
        const fuelSystem = await this.checkAndResetFuel(userId);
        if (fuelSystem.currentFuel <= 0) {
            throw new Error('Kütus on otsas!');
        }

        // Find track
        const track = DRAG_RACE_TRACKS.find(t => t.id === trackId);
        if (!track) {
            throw new Error('Rada ei leitud');
        }

        // Calculate car stats
        const carModel = {
            id: activeCar.model.id,
            brand: activeCar.model.brandName,
            model: activeCar.model.model,
            mass: activeCar.model.mass,
            compatibleEngines: activeCar.model.compatibleEngineIds,
            defaultEngine: activeCar.model.defaultEngineId,
            basePrice: activeCar.model.basePrice,
            currency: activeCar.model.currency
        };
        const carStats = calculateCarStats(activeCar.car, carModel);

        // Calculate race time using physics
        const raceConditions = {
            distance: track.distance,
            playerStats,
            carStats
        };

        const { time, breakdown } = DragRacePhysics.calculateRaceTime(raceConditions);

        // Check for personal best
        const existingTime = await this.getPlayerTime(userId, trackId);
        const isPersonalBest = !existingTime || time < existingTime.time;

        // Save time if personal best
        if (isPersonalBest) {
            await this.savePlayerTime(userId, trackId, time, activeCar, playerStats);
        }

        // Deduct fuel and update mileage (same as training)
        await this.deductFuelAndUpdateMileage(userId, activeCar.car.id);

        return {
            result: {
                time,
                breakdown,
                isPersonalBest,
                previousBest: existingTime?.time
            },
            remainingFuel: fuelSystem.currentFuel - 1
        };
    }

    /**
     * Get player's best time for a track
     */
    static async getPlayerTime(userId: string, trackId: string): Promise<any> {
        const timeRef = doc(firestore, 'dragRaceTimes', `${userId}_${trackId}`);
        const timeDoc = await getDoc(timeRef);

        if (!timeDoc.exists()) {
            return null;
        }

        const data = timeDoc.data();
        return {
            ...data,
            completedAt: data.completedAt.toDate()
        };
    }

    /**
     * Save player's race time
     */
    static async savePlayerTime(
        userId: string,
        trackId: string,
        time: number,
        activeCar: { car: PlayerCar; model: VehicleModel },
        playerStats: PlayerStats
    ): Promise<void> {
        const timeRef = doc(firestore, 'dragRaceTimes', `${userId}_${trackId}`);

        const carModel = {
            id: activeCar.model.id,
            brand: activeCar.model.brandName,
            model: activeCar.model.model,
            mass: activeCar.model.mass,
            compatibleEngines: activeCar.model.compatibleEngineIds,
            defaultEngine: activeCar.model.defaultEngineId,
            basePrice: activeCar.model.basePrice,
            currency: activeCar.model.currency
        };
        const carStats = calculateCarStats(activeCar.car, carModel);

        await setDoc(timeRef, {
            userId,
            trackId,
            time,
            carId: activeCar.car.id,
            carBrand: activeCar.model.brandName,
            carModel: activeCar.model.model,
            playerName: playerStats.username,
            completedAt: Timestamp.now(),
            carStats: {
                power: carStats.power,
                acceleration: carStats.acceleration,
                handling: carStats.grip,
                weight: carStats.mass
            },
            playerSkills: {
                handling: playerStats.attributes?.handling?.level || 1,
                reactionTime: playerStats.attributes?.reactionTime?.level || 1,
                gearShifting: playerStats.attributes?.gearShifting?.level || 1
            }
        });
    }

    /**
     * Deduct fuel and update car mileage (shared with training)
     */
    static async deductFuelAndUpdateMileage(userId: string, carId: string): Promise<void> {
        const batch = writeBatch(firestore);

        // Update fuel
        const fuelRef = doc(firestore, 'dragRaceFuel', userId);
        batch.update(fuelRef, {
            currentFuel: increment(-1)
        });

        // Update car mileage
        const carRef = doc(firestore, 'cars', carId);
        batch.update(carRef, {
            mileage: increment(FUEL_CONSTANTS.MILEAGE_PER_ATTEMPT)
        });

        await batch.commit();
    }
}

