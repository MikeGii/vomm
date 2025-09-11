// src/services/AdminMigrationService.ts - Complete Admin Migration Service

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    runTransaction,
    serverTimestamp
} from 'firebase/firestore';
import { firestore as db } from '../config/firebase';
import {
    PlayerCar,
    createDefaultUniversalTuning,
    UNIVERSAL_TUNING_CONFIG
} from '../types/vehicles';
import {
    getSparePartsForMigration
} from './InventoryService';

export interface AdminMigrationResult {
    success: boolean;
    message: string;
    details?: {
        playersProcessed: number;
        carsConverted: number;
        totalRefunds: number;
        errors: string[];
    };
}

export interface MigrationStatistics {
    totalPlayersNeedingMigration: number;
    totalCarsNeedingMigration: number;
    totalSparePartsValue: number;
    estimatedRefunds: number;
}

/**
 * Migrate a single player to universal tuning system
 */
const migratePlayerToUniversalTuning = async (userId: string): Promise<{
    success: boolean;
    message: string;
    details?: {
        carsConverted: number;
        sparePartsValue: number;
        moneyAdded: number;
        errors: string[];
    };
}> => {
    try {
        const errors: string[] = [];
        let carsConverted = 0;
        let sparePartsValue = 0;
        let installedPartsValue = 0;
        let totalMoneyAdded = 0;

        // GET SPARE PARTS INFO BEFORE TRANSACTION
        const sparePartsInfo = await getSparePartsForMigration(userId);
        sparePartsValue = sparePartsInfo.totalValue;

        await runTransaction(db, async (transaction) => {
            // ============= ALL READS FIRST =============

            // Read player stats
            const statsRef = doc(db, 'playerStats', userId);
            const statsSnap = await transaction.get(statsRef);

            if (!statsSnap.exists()) {
                throw new Error('Player stats not found');
            }

            // Read inventory
            const inventoryRef = doc(db, 'inventories', userId);
            const inventorySnap = await transaction.get(inventoryRef);

            // Read all player cars
            const carsQuery = query(
                collection(db, 'cars'),
                where('ownerId', '==', userId)
            );
            const carsSnapshot = await getDocs(carsQuery);

            // ============= PROCESS DATA =============

            const currentMoney = statsSnap.data().money || 0;
            const carsToUpdate: Array<{ ref: any; data: any }> = [];

            // Process each car
            for (const carDoc of carsSnapshot.docs) {
                const car = carDoc.data() as PlayerCar;

                // Skip if already migrated
                if (car.universalTuning) {
                    continue;
                }

                try {
                    // Calculate refund for installed parts (75% of original value)
                    let carInstalledValue = 0;
                    const partValues = {
                        turbo: { stage1: 24000, stage2: 45000, stage3: 90000 },
                        ecu: { stage1: 9000, stage2: 15000, stage3: 24000 },
                        intake: { sport: 4500, performance: 10500 },
                        exhaust: { sport: 6000, performance: 13500 }
                    };

                    if (car.engine.turbo !== 'stock') {
                        const turboKey = car.engine.turbo as 'stage1' | 'stage2' | 'stage3';
                        carInstalledValue += partValues.turbo[turboKey] || 0;
                    }
                    if (car.engine.ecu !== 'stock') {
                        const ecuKey = car.engine.ecu as 'stage1' | 'stage2' | 'stage3';
                        carInstalledValue += partValues.ecu[ecuKey] || 0;
                    }
                    if (car.engine.intake !== 'stock') {
                        const intakeKey = car.engine.intake as 'sport' | 'performance';
                        carInstalledValue += partValues.intake[intakeKey] || 0;
                    }
                    if (car.engine.exhaust !== 'stock') {
                        const exhaustKey = car.engine.exhaust as 'sport' | 'performance';
                        carInstalledValue += partValues.exhaust[exhaustKey] || 0;
                    }

                    installedPartsValue += Math.floor(carInstalledValue * 0.75);

                    // FULL RESET: Stock universal tuning (all zeros)
                    const stockUniversalTuning = createDefaultUniversalTuning();

                    // Prepare car update
                    const carRef = doc(db, 'cars', car.id);
                    carsToUpdate.push({
                        ref: carRef,
                        data: {
                            // NEW: Stock universal tuning (no performance bonus)
                            universalTuning: stockUniversalTuning,
                            grip: 1.0, // Default stock grip

                            // RESET: All engine parts to stock
                            'engine.turbo': 'stock',
                            'engine.ecu': 'stock',
                            'engine.intake': 'stock',
                            'engine.exhaust': 'stock',

                            // CLEAR: Remove old system artifacts
                            emptyPartSlots: {},

                            // MARK: Migration metadata
                            migratedToUniversalTuning: true,
                            migratedAt: serverTimestamp(),
                            updatedAt: serverTimestamp()
                        }
                    });

                    carsConverted++;
                } catch (carError) {
                    console.error(`Error processing car ${car.id}:`, carError);
                    errors.push(`Auto ${car.id}: ${carError}`);
                }
            }

            // ============= ALL WRITES =============

            // Calculate total money to add
            totalMoneyAdded = sparePartsValue + installedPartsValue;

            // Update player stats (money)
            if (totalMoneyAdded > 0) {
                transaction.update(statsRef, {
                    money: currentMoney + totalMoneyAdded,
                    migratedToUniversalTuning: true,
                    universalTuningMigrationDate: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            } else {
                transaction.update(statsRef, {
                    migratedToUniversalTuning: true,
                    universalTuningMigrationDate: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }

            // Update all cars
            carsToUpdate.forEach(({ ref, data }) => {
                transaction.update(ref, data);
            });

            // Clear spare parts inventory
            if (sparePartsValue > 0 && inventorySnap.exists()) {
                transaction.update(inventoryRef, {
                    spareParts: [],
                    migratedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
        });

        return {
            success: true,
            message: `Migratsioon edukalt lõpetatud! ${carsConverted} autot tagasi stock-tasemele ja ${totalMoneyAdded.toLocaleString()}€ tagasimakse lisatud.`,
            details: {
                carsConverted,
                sparePartsValue,
                moneyAdded: totalMoneyAdded,
                errors
            }
        };

    } catch (error) {
        console.error('Migration failed:', error);
        return {
            success: false,
            message: `Migratsioon ebaõnnestus: ${error instanceof Error ? error.message : 'Tundmatu viga'}`
        };
    }
};

/**
 * Get overall migration statistics for admin panel
 */
export const getMigrationStatistics = async (): Promise<MigrationStatistics> => {
    try {
        // Get all cars that need migration
        const carsQuery = query(collection(db, 'cars'));
        const carsSnapshot = await getDocs(carsQuery);

        let totalPlayersNeedingMigration = 0;
        let totalCarsNeedingMigration = 0;
        let totalSparePartsValue = 0;
        let estimatedRefunds = 0;

        const playersNeedingMigration = new Set<string>();

        for (const carDoc of carsSnapshot.docs) {
            const car = carDoc.data();

            if (!car.universalTuning) {
                totalCarsNeedingMigration++;
                playersNeedingMigration.add(car.ownerId);

                // Estimate refund value for installed parts
                const partValues = {
                    turbo: { stage1: 24000, stage2: 45000, stage3: 90000 },
                    ecu: { stage1: 9000, stage2: 15000, stage3: 24000 },
                    intake: { sport: 4500, performance: 10500 },
                    exhaust: { sport: 6000, performance: 13500 }
                };

                let carValue = 0;
                if (car.engine?.turbo !== 'stock') {
                    const turboKey = car.engine.turbo as 'stage1' | 'stage2' | 'stage3';
                    carValue += partValues.turbo[turboKey] || 0;
                }
                if (car.engine?.ecu !== 'stock') {
                    const ecuKey = car.engine.ecu as 'stage1' | 'stage2' | 'stage3';
                    carValue += partValues.ecu[ecuKey] || 0;
                }
                if (car.engine?.intake !== 'stock') {
                    const intakeKey = car.engine.intake as 'sport' | 'performance';
                    carValue += partValues.intake[intakeKey] || 0;
                }
                if (car.engine?.exhaust !== 'stock') {
                    const exhaustKey = car.engine.exhaust as 'sport' | 'performance';
                    carValue += partValues.exhaust[exhaustKey] || 0;
                }

                estimatedRefunds += Math.floor(carValue * 0.75);
            }
        }

        totalPlayersNeedingMigration = playersNeedingMigration.size;

        // Add spare parts value estimate
        const inventoriesQuery = query(collection(db, 'inventories'));
        const inventoriesSnapshot = await getDocs(inventoriesQuery);

        for (const inventoryDoc of inventoriesSnapshot.docs) {
            const inventory = inventoryDoc.data();
            const spareParts = inventory.spareParts || [];

            for (const part of spareParts) {
                // Estimate 50% refund for spare parts
                estimatedRefunds += Math.floor((part.purchasePrice || 0) * 0.5);
                totalSparePartsValue += part.purchasePrice || 0;
            }
        }

        return {
            totalPlayersNeedingMigration,
            totalCarsNeedingMigration,
            totalSparePartsValue,
            estimatedRefunds
        };
    } catch (error) {
        console.error('Error getting migration statistics:', error);
        return {
            totalPlayersNeedingMigration: 0,
            totalCarsNeedingMigration: 0,
            totalSparePartsValue: 0,
            estimatedRefunds: 0
        };
    }
};

/**
 * Check current migration status
 */
export const getMigrationStatus = async (): Promise<'not_started' | 'in_progress' | 'completed'> => {
    try {
        // Check if there are any cars that still need migration
        const carsQuery = query(collection(db, 'cars'));
        const carsSnapshot = await getDocs(carsQuery);

        let hasUnmigratedCars = false;
        let hasMigratedCars = false;

        for (const carDoc of carsSnapshot.docs) {
            const car = carDoc.data();

            if (car.universalTuning) {
                hasMigratedCars = true;
            } else {
                hasUnmigratedCars = true;
            }
        }

        if (!hasUnmigratedCars && hasMigratedCars) {
            return 'completed';
        } else if (hasMigratedCars && hasUnmigratedCars) {
            return 'in_progress';
        } else {
            return 'not_started';
        }
    } catch (error) {
        console.error('Error checking migration status:', error);
        return 'not_started';
    }
};

/**
 * Migrate ALL players to universal tuning (Admin function)
 */
export const migrateAllPlayersToUniversalTuning = async (): Promise<AdminMigrationResult> => {
    try {
        // Get all unique player IDs who have cars
        const carsQuery = query(collection(db, 'cars'));
        const carsSnapshot = await getDocs(carsQuery);

        const playersToMigrate = new Set<string>();

        for (const carDoc of carsSnapshot.docs) {
            const car = carDoc.data();
            if (!car.universalTuning) {
                playersToMigrate.add(car.ownerId);
            }
        }

        console.log(`Starting migration for ${playersToMigrate.size} players...`);

        let playersProcessed = 0;
        let totalCarsConverted = 0;
        let totalRefunds = 0;
        const errors: string[] = [];

        // Migrate each player
        for (const playerId of playersToMigrate) {
            try {
                const result = await migratePlayerToUniversalTuning(playerId);

                if (result.success) {
                    playersProcessed++;
                    if (result.details) {
                        totalCarsConverted += result.details.carsConverted;
                        totalRefunds += result.details.moneyAdded;
                    }
                } else {
                    errors.push(`Player ${playerId}: ${result.message}`);
                }
            } catch (error) {
                console.error(`Error migrating player ${playerId}:`, error);
                errors.push(`Player ${playerId}: ${error}`);
            }
        }

        return {
            success: true,
            message: `Migration completed. ${playersProcessed} players processed.`,
            details: {
                playersProcessed,
                carsConverted: totalCarsConverted,
                totalRefunds,
                errors
            }
        };

    } catch (error) {
        console.error('Admin migration failed:', error);
        return {
            success: false,
            message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
};

/**
 * Get detailed migration preview for a specific player (useful for testing)
 */
export const getPlayerMigrationPreview = async (userId: string) => {
    try {
        const carsQuery = query(
            collection(db, 'cars'),
            where('ownerId', '==', userId)
        );

        const carsSnapshot = await getDocs(carsQuery);
        const sparePartsInfo = await getSparePartsForMigration(userId);

        let totalRefund = sparePartsInfo.totalValue;
        const cars = [];

        for (const carDoc of carsSnapshot.docs) {
            const car = carDoc.data() as PlayerCar;

            if (!car.universalTuning) {
                // Calculate installed parts value
                let installedValue = 0;
                const partValues = {
                    turbo: { stage1: 24000, stage2: 45000, stage3: 90000 },
                    ecu: { stage1: 9000, stage2: 15000, stage3: 24000 },
                    intake: { sport: 4500, performance: 10500 },
                    exhaust: { sport: 6000, performance: 13500 }
                };

                if (car.engine.turbo !== 'stock') {
                    const turboKey = car.engine.turbo as 'stage1' | 'stage2' | 'stage3';
                    installedValue += partValues.turbo[turboKey] || 0;
                }
                if (car.engine.ecu !== 'stock') {
                    const ecuKey = car.engine.ecu as 'stage1' | 'stage2' | 'stage3';
                    installedValue += partValues.ecu[ecuKey] || 0;
                }
                if (car.engine.intake !== 'stock') {
                    const intakeKey = car.engine.intake as 'sport' | 'performance';
                    installedValue += partValues.intake[intakeKey] || 0;
                }
                if (car.engine.exhaust !== 'stock') {
                    const exhaustKey = car.engine.exhaust as 'sport' | 'performance';
                    installedValue += partValues.exhaust[exhaustKey] || 0;
                }

                const refund = Math.floor(installedValue * 0.75);
                totalRefund += refund;

                cars.push({
                    carId: car.id,
                    installedPartsValue: installedValue,
                    refundAmount: refund,
                    currentTuning: {
                        turbo: car.engine.turbo,
                        ecu: car.engine.ecu,
                        intake: car.engine.intake,
                        exhaust: car.engine.exhaust
                    }
                });
            }
        }

        return {
            needsMigration: cars.length > 0 || sparePartsInfo.installedParts.length > 0 || sparePartsInfo.uninstalledParts.length > 0,
            cars,
            spareParts: {
                installed: sparePartsInfo.installedParts.length,
                uninstalled: sparePartsInfo.uninstalledParts.length,
                value: sparePartsInfo.totalValue
            },
            totalRefund
        };
    } catch (error) {
        console.error('Error getting player migration preview:', error);
        return {
            needsMigration: false,
            cars: [],
            spareParts: { installed: 0, uninstalled: 0, value: 0 },
            totalRefund: 0
        };
    }
};

/**
 * Test migration on a single player (for testing purposes)
 */
export const testMigrationOnPlayer = async (userId: string): Promise<AdminMigrationResult> => {
    try {
        console.log(`Testing migration on player: ${userId}`);

        // Get preview first to see what will happen
        const preview = await getPlayerMigrationPreview(userId);
        console.log('Migration preview:', preview);

        if (!preview.needsMigration) {
            return {
                success: false,
                message: `Player ${userId} doesn't need migration`
            };
        }

        // Run migration on single player
        const result = await migratePlayerToUniversalTuning(userId);

        return {
            success: result.success,
            message: `Test migration completed for player ${userId}: ${result.message}`,
            details: {
                playersProcessed: result.success ? 1 : 0,
                carsConverted: result.details?.carsConverted || 0,
                totalRefunds: result.details?.moneyAdded || 0,
                errors: result.details?.errors || []
            }
        };

    } catch (error) {
        console.error('Test migration failed:', error);
        return {
            success: false,
            message: `Test migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
};