// src/services/ActiveCarService.ts (Fixed)
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerCar } from '../types/vehicles';
import { VehicleModel } from '../types/vehicleDatabase';
import { getVehicleModelById } from './VehicleDatabaseService';

export class ActiveCarService {

    // Set active car for drag racing
    static async setActiveCar(userId: string, carId: string): Promise<void> {
        // Verify user owns this car
        const carRef = doc(firestore, 'cars', carId);
        const carDoc = await getDoc(carRef);

        if (!carDoc.exists()) {
            throw new Error('Auto ei leitud');
        }

        const carData = carDoc.data() as PlayerCar;
        if (carData.ownerId !== userId) {
            throw new Error('See auto ei kuulu sulle');
        }

        // Update player stats with active car
        const userRef = doc(firestore, 'playerStats', userId);
        await updateDoc(userRef, {
            activeCarId: carId
        });
    }

    // Get player's active car details
    static async getActiveCar(userId: string, activeCarId?: string): Promise<{ car: PlayerCar; model: VehicleModel } | null> {
        if (!activeCarId) {
            return null;
        }

        const carRef = doc(firestore, 'cars', activeCarId);
        const carDoc = await getDoc(carRef);

        if (!carDoc.exists()) {
            return null;
        }

        const carData = carDoc.data() as PlayerCar;
        if (carData.ownerId !== userId) {
            return null;
        }

        // Get the vehicle model from the database
        const vehicleModel = await getVehicleModelById(carData.carModelId);

        if (!vehicleModel) {
            return null;
        }

        return { car: { ...carData, id: activeCarId }, model: vehicleModel };
    }

    // Get all player's cars for selection
    static async getPlayerCars(userId: string): Promise<Array<{ car: PlayerCar; model: VehicleModel }>> {
        const carsQuery = query(
            collection(firestore, 'cars'),
            where('ownerId', '==', userId),
            where('isForSale', '==', false)
        );

        const carsSnapshot = await getDocs(carsQuery);

        const carsWithModels: Array<{ car: PlayerCar; model: VehicleModel }> = [];

        for (const carDoc of carsSnapshot.docs) {
            const carData = carDoc.data() as PlayerCar;
            const vehicleModel = await getVehicleModelById(carData.carModelId);

            if (vehicleModel) {
                carsWithModels.push({
                    car: { ...carData, id: carDoc.id },
                    model: vehicleModel
                });
            }
        }

        return carsWithModels;
    }
}