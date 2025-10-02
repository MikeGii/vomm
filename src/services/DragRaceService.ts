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
import {DragRaceLeaderboardService} from "./DragRaceLeaderboardService";
import { getCurrentServer, getServerSpecificId } from '../utils/serverUtils';
import { GlobalUserService } from './GlobalUserService';

export class DragRaceService {

    // Initialize drag race attributes if they don't exist
    static async initializeDragRaceAttributes(userId: string): Promise<void> {
        const statsRef = doc(firestore, 'playerStats', getServerSpecificId(userId, getCurrentServer()));
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
    static async getFuelSystem(userId: string, playerStats: PlayerStats): Promise<FuelSystem> {
        // Validate inputs
        if (!userId || !playerStats) {
            throw new Error('Missing required parameters for fuel system');
        }

        const fuelRef = doc(firestore, 'dragRaceFuel', userId);
        const fuelDoc = await getDoc(fuelRef);

        // Use passed playerStats for VIP check
        const globalData = await GlobalUserService.getGlobalUserData(userId);
        const isVip = globalData.isVip;

        // Determine max fuel based on VIP status
        const maxFuel = isVip ? FUEL_CONSTANTS.MAX_FREE_FUEL_VIP : FUEL_CONSTANTS.MAX_FREE_FUEL;

        if (!fuelDoc.exists()) {
            // Create new fuel system
            const now = new Date();
            const nextReset = this.getNextHourlyReset(now);

            const newFuelSystem: FuelSystem = {
                currentFuel: maxFuel,
                maxFreeFuel: maxFuel,
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

        // Check if VIP status changed and update max fuel
        const currentMaxFuel = data.maxFreeFuel || FUEL_CONSTANTS.MAX_FREE_FUEL;
        if (currentMaxFuel !== maxFuel) {
            await updateDoc(fuelRef, {
                maxFreeFuel: maxFuel,
                currentFuel: data.currentFuel === currentMaxFuel ? maxFuel : data.currentFuel
            });
        }

        return {
            currentFuel: data.currentFuel,
            maxFreeFuel: maxFuel,
            lastFuelReset: data.lastFuelReset.toDate(),
            paidAttemptsUsed: data.paidAttemptsUsed || 0,
            maxPaidAttempts: data.maxPaidAttempts || FUEL_CONSTANTS.MAX_PAID_ATTEMPTS,
            nextResetTime: data.nextResetTime.toDate()
        };
    }

    // Check and reset fuel if needed
    static async checkAndResetFuel(userId: string, playerStats: PlayerStats): Promise<FuelSystem> {
        const fuelSystem = await this.getFuelSystem(userId, playerStats);
        const now = new Date();

        // Check if we need to reset
        if (now >= fuelSystem.nextResetTime) {
            // Use passed playerStats instead of fetching
            const globalData = await GlobalUserService.getGlobalUserData(userId);
            const isVip = globalData.isVip;
            const maxFuel = isVip ? FUEL_CONSTANTS.MAX_FREE_FUEL_VIP : FUEL_CONSTANTS.MAX_FREE_FUEL;

            const nextReset = this.getNextHourlyReset(now);
            const fuelRef = doc(firestore, 'dragRaceFuel', userId);

            await updateDoc(fuelRef, {
                currentFuel: maxFuel,
                maxFreeFuel: maxFuel,
                lastFuelReset: Timestamp.fromDate(now),
                nextResetTime: Timestamp.fromDate(nextReset),
                paidAttemptsUsed: 0
            });

            return {
                ...fuelSystem,
                currentFuel: maxFuel,
                maxFreeFuel: maxFuel,
                lastFuelReset: now,
                nextResetTime: nextReset,
                paidAttemptsUsed: 0
            };
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
        // Validate playerStats exists
        if (!playerStats) {
            throw new Error('Player stats not found');
        }

        // Initialize drag race attributes if needed
        await this.initializeDragRaceAttributes(userId);

        // Check fuel availability using passed playerStats
        const fuelSystem = await this.checkAndResetFuel(userId, playerStats);

        if (fuelSystem.currentFuel <= 0) {
            throw new Error('Kütus on otsas! Osta lisaks või oota järgmist tundi.');
        }

        // Check if player has active car using passed playerStats
        if (!playerStats.activeCarId) {
            throw new Error('Määra esmalt aktiivne auto!');
        }

        // Initialize attributes if they don't exist
        if (!playerStats.attributes) {
            throw new Error('Atribuudid pole initsialiseeritud');
        }

        // Calculate XP gain using passed playerStats
        const xpGained = this.calculateTrainingXP(trainingType, playerStats);

        // Get current attribute data from passed playerStats
        const trainingOption = TRAINING_OPTIONS.find(option => option.id === trainingType);
        if (!trainingOption) {
            throw new Error('Vigane treeningu tüüp');
        }

        // Get or create attribute data
        let currentAttributeData = playerStats.attributes[trainingType] as AttributeData;

        if (!currentAttributeData) {
            // If attribute doesn't exist, we need to fetch the latest state
            // This only happens on first training of this type
            const statsRef = doc(firestore, 'playerStats', getServerSpecificId(userId, getCurrentServer()));
            const statsDoc = await getDoc(statsRef);

            if (statsDoc.exists()) {
                const latestStats = statsDoc.data() as PlayerStats;
                currentAttributeData = latestStats.attributes?.[trainingType] || {
                    level: 1,
                    experience: 0,
                    experienceForNextLevel: 100
                };
            } else {
                currentAttributeData = {
                    level: 1,
                    experience: 0,
                    experienceForNextLevel: 100
                };
            }
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
        const userRef = doc(firestore, 'playerStats', getServerSpecificId(userId, getCurrentServer()));

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

        // Update car mileage using activeCarId from passed playerStats
        const carRef = doc(firestore, 'cars', playerStats.activeCarId);
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
        // Pass playerStats to checkAndResetFuel
        const fuelSystem = await this.checkAndResetFuel(userId, playerStats);

        const options: FuelPurchaseOption[] = [];

        // Money purchase option
        const moneyAttemptsRemaining = FUEL_CONSTANTS.MAX_PAID_ATTEMPTS - fuelSystem.paidAttemptsUsed;
        options.push({
            type: 'money',
            cost: FUEL_CONSTANTS.MONEY_COST_PER_ATTEMPT,
            available: moneyAttemptsRemaining > 0 && (playerStats.money >= FUEL_CONSTANTS.MONEY_COST_PER_ATTEMPT),
            remaining: moneyAttemptsRemaining
        });

        // Get global data for pollid check
        const globalData = await GlobalUserService.getGlobalUserData(userId);

        // Pollid purchase option (unlimited after money attempts)
        const pollidAvailable = fuelSystem.paidAttemptsUsed >= FUEL_CONSTANTS.MAX_PAID_ATTEMPTS;
        options.push({
            type: 'pollid',
            cost: FUEL_CONSTANTS.POLLID_COST_PER_ATTEMPT,
            available: pollidAvailable && (globalData.pollid >= FUEL_CONSTANTS.POLLID_COST_PER_ATTEMPT)
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
        // Pass playerStats to checkAndResetFuel
        const fuelSystem = await this.checkAndResetFuel(userId, playerStats);
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
        const globalData = await GlobalUserService.getGlobalUserData(userId);
        const playerCurrency = purchaseType === 'money'
            ? playerStats.money
            : globalData.pollid;

        if (playerCurrency < totalCost) {
            throw new Error(`Pole piisavalt ${purchaseType === 'money' ? 'raha' : 'pollid'}`);
        }

        // Handle money and pollid purchases differently
        if (purchaseType === 'money') {
            // Money purchase - use batch for atomic update
            const batch = writeBatch(firestore);

            // Update money in playerStats (server-specific)
            const userRef = doc(firestore, 'playerStats', getServerSpecificId(userId, getCurrentServer()));
            batch.update(userRef, {
                money: increment(-totalCost),
                lastModified: Timestamp.now()
            });

            // Update fuel and paid attempts
            const fuelRef = doc(firestore, 'dragRaceFuel', userId);
            batch.update(fuelRef, {
                currentFuel: increment(actualQuantity),
                paidAttemptsUsed: increment(actualQuantity)
            });

            await batch.commit();
        } else {
            // Pollid purchase - handle separately since pollid is global
            // Update pollid globally
            await GlobalUserService.updatePollid(userId, -totalCost);

            // Update fuel separately
            const fuelRef = doc(firestore, 'dragRaceFuel', userId);
            await updateDoc(fuelRef, {
                currentFuel: increment(actualQuantity)
            });
        }

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
        // Pass playerStats to checkAndResetFuel
        const fuelSystem = await this.checkAndResetFuel(userId, playerStats);
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
            // Clear leaderboard cache when new record is set
            DragRaceLeaderboardService.clearTrackCache(trackId);
        }

        // Deduct fuel and update mileage
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
        const currentServer = getCurrentServer();
        const timeRef = doc(firestore, 'dragRaceTimes', `${userId}_${trackId}_${currentServer}`);
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
        const currentServer = getCurrentServer();
        const timeRef = doc(firestore, 'dragRaceTimes', `${userId}_${trackId}_${currentServer}`);

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
            server: currentServer,
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

