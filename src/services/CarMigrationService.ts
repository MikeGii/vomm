// src/services/CarMigrationService.ts

import {
    collection,
    doc,
    getDocs,
    updateDoc,
    query,
    where,
    runTransaction
} from 'firebase/firestore';
import { firestore as db } from '../config/firebase';
import { getAllVehicleModels } from './VehicleDatabaseService';
import { getCarModelById } from '../data/vehicles'; // Temporary import for migration
import { VehicleModel } from '../types/vehicleDatabase';
import { PlayerCar } from '../types/vehicles';

export interface CarMigrationResult {
    success: boolean;
    totalCars: number;
    migratedCars: number;
    skippedCars: number;
    errors: string[];
    details: Array<{
        carId: string;
        oldModelId: string;
        newModelId: string | null;
        status: 'migrated' | 'skipped' | 'error';
        reason?: string;
    }>;
}

export const migrateCarModelIds = async (adminUserId: string): Promise<CarMigrationResult> => {
    const result: CarMigrationResult = {
        success: false,
        totalCars: 0,
        migratedCars: 0,
        skippedCars: 0,
        errors: [],
        details: []
    };

    try {
        console.log('🚗 Starting car model ID migration...');

        // Step 1: Get all cars from database
        const carsSnapshot = await getDocs(collection(db, 'cars'));
        const allCars = carsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as PlayerCar[];

        result.totalCars = allCars.length;
        console.log(`Found ${allCars.length} cars to check`);

        // Step 2: Get all database vehicle models
        const databaseModels = await getAllVehicleModels();
        console.log(`Found ${databaseModels.length} database models`);

        // Create a mapping from hardcoded model properties to database model IDs
        const modelMapping = new Map<string, VehicleModel>();

        for (const dbModel of databaseModels) {
            // Create a key based on brand and model name
            const key = `${dbModel.brandName.toLowerCase()}-${dbModel.model.toLowerCase()}`;
            modelMapping.set(key, dbModel);
        }

        // Step 3: Process each car
        for (const car of allCars) {
            const carDetail = {
                carId: car.id,
                oldModelId: car.carModelId,
                newModelId: null as string | null,
                status: 'error' as 'migrated' | 'skipped' | 'error',
                reason: ''
            };

            try {
                // Check if car already has a database model ID
                const existingDbModel = databaseModels.find(m => m.id === car.carModelId);
                if (existingDbModel) {
                    carDetail.status = 'skipped';
                    carDetail.reason = 'Already using database model ID';
                    result.skippedCars++;
                    result.details.push(carDetail);
                    continue;
                }

                // Try to find the corresponding database model
                const hardcodedModel = getCarModelById(car.carModelId);
                if (!hardcodedModel) {
                    carDetail.status = 'error';
                    carDetail.reason = 'Hardcoded model not found';
                    result.errors.push(`Car ${car.id}: Hardcoded model ${car.carModelId} not found`);
                    result.details.push(carDetail);
                    continue;
                }

                // Look for matching database model
                const searchKey = `${hardcodedModel.brand.toLowerCase()}-${hardcodedModel.model.toLowerCase()}`;
                const matchingDbModel = modelMapping.get(searchKey);

                if (!matchingDbModel) {
                    carDetail.status = 'error';
                    carDetail.reason = `No database model found for ${hardcodedModel.brand} ${hardcodedModel.model}`;
                    result.errors.push(`Car ${car.id}: No database model found for ${hardcodedModel.brand} ${hardcodedModel.model}`);
                    result.details.push(carDetail);
                    continue;
                }

                // Update the car with new model ID
                const carRef = doc(db, 'cars', car.id);
                await updateDoc(carRef, {
                    carModelId: matchingDbModel.id,
                    migratedAt: new Date(),
                    migratedBy: adminUserId
                });

                carDetail.newModelId = matchingDbModel.id;
                carDetail.status = 'migrated';
                carDetail.reason = `Updated to ${matchingDbModel.brandName} ${matchingDbModel.model}`;
                result.migratedCars++;
                result.details.push(carDetail);

                console.log(`✅ Migrated car ${car.id}: ${car.carModelId} → ${matchingDbModel.id}`);

            } catch (error: any) {
                carDetail.status = 'error';
                carDetail.reason = error.message;
                result.errors.push(`Car ${car.id}: ${error.message}`);
                result.details.push(carDetail);
                console.error(`❌ Failed to migrate car ${car.id}:`, error);
            }
        }

        // Step 4: Summary
        result.success = result.errors.length === 0 || result.migratedCars > 0;

        console.log('🎉 Car migration completed!');
        console.log(`- Total cars: ${result.totalCars}`);
        console.log(`- Migrated: ${result.migratedCars}`);
        console.log(`- Skipped: ${result.skippedCars}`);
        console.log(`- Errors: ${result.errors.length}`);

        return result;

    } catch (error: any) {
        console.error('Failed to migrate cars:', error);
        result.success = false;
        result.errors.push(`Migration failed: ${error.message}`);
        return result;
    }
};

// Helper function to get migration status
export const getCarMigrationStatus = async (): Promise<{
    totalCars: number;
    hardcodedCars: number;
    databaseCars: number;
}> => {
    try {
        const carsSnapshot = await getDocs(collection(db, 'cars'));
        const allCars = carsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as PlayerCar[];

        const databaseModels = await getAllVehicleModels();
        const databaseModelIds = new Set(databaseModels.map(m => m.id));

        let hardcodedCars = 0;
        let databaseCars = 0;

        for (const car of allCars) {
            if (databaseModelIds.has(car.carModelId)) {
                databaseCars++;
            } else {
                hardcodedCars++;
            }
        }

        return {
            totalCars: allCars.length,
            hardcodedCars,
            databaseCars
        };
    } catch (error) {
        console.error('Failed to get migration status:', error);
        return { totalCars: 0, hardcodedCars: 0, databaseCars: 0 };
    }
};