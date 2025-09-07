// src/services/VehicleService.ts

import {
    collection,
    doc,
    getDocs,
    query,
    where,
    Timestamp,
    runTransaction, getDoc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { firestore as db } from '../config/firebase';
import { PlayerCar, CarModel } from '../types/vehicles';
import { GarageSlot } from '../types/estate';
import { createStockEngine } from '../data/vehicles';

async function ensureGarageSlots(
    transaction: any,
    userRef: any,
    userData: any,
    userId: string
): Promise<GarageSlot[]> {
    // Check if garage slots exist and are valid
    const existingSlots = userData.estateData?.garageSlots;
    if (existingSlots && Array.isArray(existingSlots) && existingSlots.length > 0) {
        return existingSlots;
    }

    // Get estate data
    const estateRef = doc(db, 'playerEstates', userId);
    const estateDoc = await transaction.get(estateRef);

    if (!estateDoc.exists()) {
        return [];
    }

    const estateData = estateDoc.data();
    const currentEstate = estateData.currentEstate;

    // Check garage capacity
    if (!currentEstate?.hasGarage || !currentEstate?.garageCapacity) {
        return [];
    }

    // Create new empty garage slots
    const newSlots: GarageSlot[] = [];
    for (let i = 1; i <= currentEstate.garageCapacity; i++) {
        newSlots.push({
            slotId: i,
            isEmpty: true
        });
    }

    // Update user document with new slots
    transaction.update(userRef, {
        'estateData.garageSlots': newSlots
    });

    return newSlots;
}

export async function purchaseNewCar(
    userId: string,
    carModel: CarModel
): Promise<{ success: boolean; message: string; carId?: string }> {
    try {
        return await runTransaction(db, async (transaction) => {
            const userRef = doc(db, 'users', userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw new Error('Kasutajat ei leitud');
            }

            const userData = userDoc.data();

            // Check money
            if (userData.money < carModel.basePrice) {
                throw new Error('Pole piisavalt raha');
            }

            // Get garage slots
            const garageSlots = await ensureGarageSlots(
                transaction,
                userRef,
                userData,
                userId
            );

            // Check if garage exists
            if (garageSlots.length === 0) {
                throw new Error('Sul pole garaaži! Osta kõigepealt garaažiga kinnisvara.');
            }

            // Find empty slot
            const emptySlotIndex = garageSlots.findIndex((slot: GarageSlot) => slot.isEmpty);

            if (emptySlotIndex === -1) {
                throw new Error('Garaažis pole ruumi');
            }

            // Create new car
            const newCar: PlayerCar = {
                id: `car_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ownerId: userId,
                carModelId: carModel.id,
                mileage: 0,
                purchaseDate: new Date(),
                engine: createStockEngine(carModel.defaultEngine),
                isForSale: false
            };

            // Save car
            const carRef = doc(db, 'cars', newCar.id);
            transaction.set(carRef, {
                ...newCar,
                purchaseDate: Timestamp.fromDate(newCar.purchaseDate)
            });

            // Update garage slot
            garageSlots[emptySlotIndex] = {
                slotId: garageSlots[emptySlotIndex].slotId,
                isEmpty: false,
                carId: newCar.id
            };

            // Update user data
            transaction.update(userRef, {
                money: userData.money - carModel.basePrice,
                'estateData.garageSlots': garageSlots
            });

            return {
                success: true,
                message: `${carModel.brand} ${carModel.model} ostetud!`,
                carId: newCar.id
            };
        });
    } catch (error: any) {
        console.error('Error purchasing car:', error);
        return {
            success: false,
            message: error.message || 'Viga auto ostmisel'
        };
    }
}

export async function purchaseUsedCar(
    buyerId: string,
    carId: string
): Promise<{ success: boolean; message: string }> {
    try {
        return await runTransaction(db, async (transaction) => {
            const carRef = doc(db, 'cars', carId);
            const buyerRef = doc(db, 'users', buyerId);

            const carDoc = await transaction.get(carRef);
            const buyerDoc = await transaction.get(buyerRef);

            if (!carDoc.exists()) {
                throw new Error('Autot ei leitud');
            }

            const carData = carDoc.data() as PlayerCar;

            if (!carData.isForSale) {
                throw new Error('Auto ei ole enam müügis');
            }

            if (carData.ownerId === buyerId) {
                throw new Error('Ei saa osta enda autot');
            }

            if (!buyerDoc.exists()) {
                throw new Error('Ostja andmed ei leitud');
            }

            const buyerData = buyerDoc.data();
            const salePrice = carData.salePrice || 0;

            if (buyerData.money < salePrice) {
                throw new Error('Pole piisavalt raha');
            }

            const buyerGarageSlots: GarageSlot[] = buyerData.estateData?.garageSlots || [];
            const emptySlotIndex = buyerGarageSlots.findIndex((slot: GarageSlot) => slot.isEmpty);

            if (emptySlotIndex === -1) {
                throw new Error('Garaažis pole ruumi');
            }

            const sellerRef = doc(db, 'users', carData.ownerId);
            const sellerDoc = await transaction.get(sellerRef);

            if (!sellerDoc.exists()) {
                throw new Error('Müüja andmed ei leitud');
            }

            const sellerData = sellerDoc.data();
            const sellerGarageSlots: GarageSlot[] = sellerData.estateData?.garageSlots || [];
            const sellerSlotIndex = sellerGarageSlots.findIndex(
                (slot: GarageSlot) => slot.carId === carId
            );

            // Update car ownership
            transaction.update(carRef, {
                ownerId: buyerId,
                isForSale: false,
                salePrice: null,
                listedAt: null,
                previousOwner: carData.ownerId
            });

            // Update seller
            if (sellerSlotIndex !== -1) {
                sellerGarageSlots[sellerSlotIndex] = {
                    slotId: sellerGarageSlots[sellerSlotIndex].slotId,
                    isEmpty: true
                };
            }

            transaction.update(sellerRef, {
                money: sellerData.money + salePrice,
                'estateData.garageSlots': sellerGarageSlots
            });

            // Update buyer
            buyerGarageSlots[emptySlotIndex] = {
                slotId: buyerGarageSlots[emptySlotIndex].slotId,
                isEmpty: false,
                carId: carId
            };

            transaction.update(buyerRef, {
                money: buyerData.money - salePrice,
                'estateData.garageSlots': buyerGarageSlots
            });

            return {
                success: true,
                message: 'Auto ostetud!'
            };
        });
    } catch (error: any) {
        console.error('Error purchasing used car:', error);
        return {
            success: false,
            message: error.message || 'Viga auto ostmisel'
        };
    }
}

export async function listCarForSale(
    userId: string,
    carId: string,
    price: number
): Promise<{ success: boolean; message: string }> {
    try {
        return await runTransaction(db, async (transaction) => {
            const carRef = doc(db, 'cars', carId);
            const carDoc = await transaction.get(carRef);

            if (!carDoc.exists()) {
                throw new Error('Autot ei leitud');
            }

            const carData = carDoc.data() as PlayerCar;

            if (carData.ownerId !== userId) {
                throw new Error('See ei ole sinu auto');
            }

            if (carData.isForSale) {
                throw new Error('Auto on juba müügis');
            }

            if (price < 100) {
                throw new Error('Hind peab olema vähemalt $100');
            }

            if (price > 10000000) {
                throw new Error('Hind on liiga kõrge');
            }

            transaction.update(carRef, {
                isForSale: true,
                salePrice: price,
                listedAt: Timestamp.now()
            });

            return {
                success: true,
                message: 'Auto pandud müüki!'
            };
        });
    } catch (error: any) {
        console.error('Error listing car:', error);
        return {
            success: false,
            message: error.message || 'Viga auto müüki panemisel'
        };
    }
}

export async function unlistCarFromSale(
    userId: string,
    carId: string
): Promise<{ success: boolean; message: string }> {
    try {
        return await runTransaction(db, async (transaction) => {
            const carRef = doc(db, 'cars', carId);
            const carDoc = await transaction.get(carRef);

            if (!carDoc.exists()) {
                throw new Error('Autot ei leitud');
            }

            const carData = carDoc.data() as PlayerCar;

            if (carData.ownerId !== userId) {
                throw new Error('See ei ole sinu auto');
            }

            if (!carData.isForSale) {
                throw new Error('Auto ei ole müügis');
            }

            transaction.update(carRef, {
                isForSale: false,
                salePrice: null,
                listedAt: null
            });

            return {
                success: true,
                message: 'Auto eemaldatud müügist'
            };
        });
    } catch (error: any) {
        console.error('Error unlisting car:', error);
        return {
            success: false,
            message: error.message || 'Viga auto müügist eemaldamisel'
        };
    }
}

export async function getUserCars(userId: string): Promise<PlayerCar[]> {
    try {
        const carsQuery = query(
            collection(db, 'cars'),
            where('ownerId', '==', userId)
        );

        const snapshot = await getDocs(carsQuery);
        const cars: PlayerCar[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            cars.push({
                ...data,
                id: doc.id,
                purchaseDate: data.purchaseDate?.toDate() || new Date()
            } as PlayerCar);
        });

        return cars;
    } catch (error) {
        console.error('Error fetching user cars:', error);
        return [];
    }
}

export async function getCarsForSale(): Promise<Array<PlayerCar & { sellerName?: string }>> {
    try {
        const carsQuery = query(
            collection(db, 'cars'),
            where('isForSale', '==', true)
        );

        const snapshot = await getDocs(carsQuery);
        const cars: Array<PlayerCar & { sellerName?: string }> = [];

        const ownerIds = new Set<string>();
        const carDocs: any[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            ownerIds.add(data.ownerId);
            carDocs.push({ id: doc.id, ...data });
        });

        const userPromises = Array.from(ownerIds).map(async (userId) => {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                    userId,
                    username: userData.username || userData.displayName || 'Kasutaja'
                };
            }
            return { userId, username: 'Kasutaja' };
        });

        const users = await Promise.all(userPromises);
        const userMap = new Map(users.map(u => [u.userId, u.username]));

        carDocs.forEach((carData) => {
            cars.push({
                ...carData,
                id: carData.id,
                purchaseDate: carData.purchaseDate?.toDate() || new Date(),
                listedAt: carData.listedAt?.toDate(),
                sellerName: userMap.get(carData.ownerId) || 'Kasutaja'
            } as PlayerCar & { sellerName?: string });
        });

        cars.sort((a, b) => {
            const dateA = a.listedAt || new Date(0);
            const dateB = b.listedAt || new Date(0);
            return dateB.getTime() - dateA.getTime();
        });

        return cars;
    } catch (error) {
        console.error('Error fetching cars for sale:', error);
        return [];
    }
}

export const updateCarParts = async (
    userId: string,
    carId: string,
    partCategory: 'turbo' | 'ecu' | 'intake' | 'exhaust',
    newLevel: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const carRef = doc(db, 'cars', carId);
        const carSnap = await getDoc(carRef);

        if (!carSnap.exists()) {
            return { success: false, message: 'Auto ei leitud' };
        }

        const carData = carSnap.data() as PlayerCar;

        if (carData.ownerId !== userId) {
            return { success: false, message: 'See ei ole sinu auto' };
        }

        const updatedEngine = { ...carData.engine };

        if (partCategory === 'turbo') {
            updatedEngine.turbo = newLevel as 'stock' | 'stage1' | 'stage2' | 'stage3';
        } else if (partCategory === 'ecu') {
            updatedEngine.ecu = newLevel as 'stock' | 'stage1' | 'stage2' | 'stage3';
        } else if (partCategory === 'intake') {
            updatedEngine.intake = newLevel as 'stock' | 'sport' | 'performance';
        } else if (partCategory === 'exhaust') {
            updatedEngine.exhaust = newLevel as 'stock' | 'sport' | 'performance';
        }

        await updateDoc(carRef, {
            engine: updatedEngine,
            updatedAt: serverTimestamp()
        });

        return { success: true, message: 'Osa vahetatud!' };
    } catch (error) {
        console.error('Error updating car parts:', error);
        return { success: false, message: 'Viga osade vahetamisel' };
    }
};