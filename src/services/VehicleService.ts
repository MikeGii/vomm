// src/services/VehicleService.ts

import {
    collection,
    doc,
    getDocs,
    query,
    where,
    Timestamp,
    runTransaction,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { firestore as db } from '../config/firebase';
import {
    createDefaultUniversalTuning,
    PlayerCar,
    UNIVERSAL_TUNING_CONFIG,
    UniversalTuningCategory,
    checkTuningRequirements
} from '../types/vehicles';
import { getTuningBasePrice } from '../utils/vehicleCalculations';
import { VehicleModel, VehicleEngine } from '../types/vehicleDatabase';
import { GarageSlot } from '../types/estate';
import {
    getVehicleEngineById,
    getVehicleModelById,
} from './VehicleDatabaseService';
import {calculateTotalGarageSlots} from "../utils/garageUtils";
import { getCurrentServer, getServerSpecificId } from '../utils/serverUtils';
import { GlobalUserService } from './GlobalUserService';

// Create stock engine from database engine
function createEngineFromDatabase(dbEngine: VehicleEngine) {
    return {
        code: dbEngine.code,
        brand: dbEngine.brandName,
        basePower: dbEngine.basePower
    };
}

// Updated purchase function - works with VehicleModel from database
export async function purchaseNewCar(
    userId: string,
    carModel: VehicleModel
): Promise<{ success: boolean; message: string; carId?: string }> {
    try {
        return await runTransaction(db, async (transaction) => {
            const serverSpecificId = getServerSpecificId(userId, getCurrentServer());
            const userRef = doc(db, 'playerStats', serverSpecificId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw new Error('Kasutajat ei leitud');
            }

            const userData = userDoc.data();

            // Check money
            const carPrice = carModel.currency === 'pollid'
                ? (carModel.basePollidPrice || 0)
                : carModel.basePrice;

            const playerCurrency = carModel.currency === 'pollid'
                ? (userData.pollid || 0)
                : userData.money;

            if (playerCurrency < carPrice) {
                const currencyName = carModel.currency === 'pollid' ? 'pollidid' : 'raha';
                throw new Error(`Pole piisavalt ${currencyName}`);
            }

            // Get estate data for garage capacity
            const estateRef = doc(db, 'playerEstates', serverSpecificId);
            const estateDoc = await transaction.get(estateRef);

            if (!estateDoc.exists()) {
                throw new Error('Kinnisvara andmed ei leitud');
            }

            const estateData = estateDoc.data();
            const currentEstate = estateData.currentEstate;

            // Check garage capacity using total slots (estate + extra purchased)
            if (!currentEstate?.hasGarage || !currentEstate?.garageCapacity) {
                throw new Error('Sul pole garaaži! Osta kõigepealt garaažiga kinnisvara.');
            }

            // Count actual cars
            const carsQuery = query(
                collection(db, 'cars'),
                where('ownerId', '==', serverSpecificId)
            );
            const carsSnapshot = await getDocs(carsQuery);
            const currentCarCount = carsSnapshot.size;

            // Calculate total garage slots (estate + extra purchased)
            const totalGarageSlots = calculateTotalGarageSlots({
                userId,
                currentEstate,
                extraGarageSlots: estateData.extraGarageSlots || 0,
                ownedDevices: estateData.ownedDevices || { has3DPrinter: false, hasLaserCutter: false },
                unequippedDevices: estateData.unequippedDevices || { threeDPrinters: 0, laserCutters: 0 },
                createdAt: new Date(),
                updatedAt: new Date()
            });

            if (currentCarCount >= totalGarageSlots) {
                const estateSlots = currentEstate.garageCapacity;
                const extraSlots = estateData.extraGarageSlots || 0;
                throw new Error(`Garaaž on täis! Sul on ${totalGarageSlots} kohta (${estateSlots} kinnisvara + ${extraSlots} extra). Müü mõni auto või osta lisa garaaži kohti.`);
            }

            // Get the default engine from database
            const defaultEngine = await getVehicleEngineById(carModel.defaultEngineId);
            if (!defaultEngine) {
                throw new Error(`Auto vaikimisi mootor ei ole saadaval (ID: ${carModel.defaultEngineId})`);
            }

            // Create new car with cleaned structure
            const newCar: PlayerCar = {
                id: `car_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ownerId: serverSpecificId,
                carModelId: carModel.id,
                mileage: 0,
                purchaseDate: new Date(),

                engine: createEngineFromDatabase(defaultEngine),
                universalTuning: createDefaultUniversalTuning(),
                grip: 1.0,

                isForSale: false
            };

            // Save car
            const carRef = doc(db, 'cars', newCar.id);
            transaction.set(carRef, {
                ...newCar,
                purchaseDate: Timestamp.fromDate(newCar.purchaseDate)
            });

            // Update user money
            if (carModel.currency === 'pollid') {
                // Update pollid globally (outside transaction)
                await GlobalUserService.updatePollid(userId, -carPrice);
            } else {
                transaction.update(userRef, {
                    money: playerCurrency - carPrice
                });
            }

            return {
                success: true,
                message: `${carModel.brandName} ${carModel.model} ostetud!`,
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
            const buyerServerSpecificId = getServerSpecificId(buyerId, getCurrentServer());

            if (!carData.isForSale) {
                throw new Error('Auto ei ole enam müügis');
            }

            if (carData.ownerId === buyerServerSpecificId) {
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

            // Check buyer's garage capacity including extra slots
            const buyerEstateRef = doc(db, 'playerEstates', buyerServerSpecificId);
            const buyerEstateDoc = await transaction.get(buyerEstateRef);

            if (!buyerEstateDoc.exists()) {
                throw new Error('Ostja kinnisvara andmed ei leitud');
            }

            const buyerEstateData = buyerEstateDoc.data();
            const totalSlots = calculateTotalGarageSlots({
                userId: buyerId,
                currentEstate: buyerEstateData.currentEstate,
                extraGarageSlots: buyerEstateData.extraGarageSlots || 0,
                ownedDevices: buyerEstateData.ownedDevices || { has3DPrinter: false, hasLaserCutter: false },
                unequippedDevices: buyerEstateData.unequippedDevices || { threeDPrinters: 0, laserCutters: 0 },
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Count buyer's current cars to validate against total capacity
            const buyerCarsQuery = query(collection(db, 'cars'), where('ownerId', '==', buyerServerSpecificId));
            const buyerCarsSnapshot = await getDocs(buyerCarsQuery);

            if (buyerCarsSnapshot.size >= totalSlots) {
                const estateSlots = buyerEstateData.currentEstate?.garageCapacity || 0;
                const extraSlots = buyerEstateData.extraGarageSlots || 0;
                throw new Error(`Garaažis pole ruumi! Sul on ${totalSlots} kohta (${estateSlots} + ${extraSlots} extra).`);
            }

            // Keep the existing garage slot system for compatibility
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
                ownerId: buyerServerSpecificId,
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
            const serverSpecificId = getServerSpecificId(userId, getCurrentServer());

            if (!carDoc.exists()) {
                throw new Error('Autot ei leitud');
            }

            const carData = carDoc.data() as PlayerCar;

            if (carData.ownerId !== serverSpecificId) {
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
            const serverSpecificId = getServerSpecificId(userId, getCurrentServer());

            if (!carDoc.exists()) {
                throw new Error('Autot ei leitud');
            }

            const carData = carDoc.data() as PlayerCar;

            if (carData.ownerId !== serverSpecificId) {
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
        const serverSpecificId = getServerSpecificId(userId, getCurrentServer());
        const carsQuery = query(
            collection(db, 'cars'),
            where('ownerId', '==', serverSpecificId)
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
        const currentServer = getCurrentServer();
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
            const ownerId = data.ownerId;

            // Filter by current server
            if (currentServer === 'beta' && ownerId.includes('_')) return;
            if (currentServer !== 'beta' && !ownerId.endsWith(`_${currentServer}`)) return;

            ownerIds.add(ownerId);
            carDocs.push({ id: doc.id, ...data });
        });

        // Extract base userIds for getting usernames
        const userPromises = Array.from(ownerIds).map(async (serverSpecificId) => {
            // Remove server suffix to get base userId
            const baseUserId = currentServer === 'beta'
                ? serverSpecificId
                : serverSpecificId.replace(`_${currentServer}`, '');

            const userDoc = await getDoc(doc(db, 'users', baseUserId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                    userId: serverSpecificId, // Keep server-specific ID as key
                    username: userData.username || userData.displayName || 'Kasutaja'
                };
            }
            return { userId: serverSpecificId, username: 'Kasutaja' };
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

export const updateCarUniversalTuning = async (
    userId: string,
    carId: string,
    tuningCategory: UniversalTuningCategory,
    newLevel: number
): Promise<{ success: boolean; message: string }> => {
    try {
        const carRef = doc(db, 'cars', carId);
        const carSnap = await getDoc(carRef);
        const serverSpecificId = getServerSpecificId(userId, getCurrentServer());

        if (!carSnap.exists()) {
            return { success: false, message: 'Auto ei leitud' };
        }

        const carData = carSnap.data() as PlayerCar;

        if (carData.ownerId !== serverSpecificId) {
            return { success: false, message: 'See ei ole sinu auto' };
        }

        // Validate tuning level (0-3)
        if (newLevel < 0 || newLevel > 3) {
            return { success: false, message: 'Vigane tuuningu tase' };
        }

        // Get current tuning or create default
        const currentTuning = carData.universalTuning || createDefaultUniversalTuning();
        const currentLevel = currentTuning[tuningCategory];

        // Validate that we're not upgrading without meeting requirements
        if (newLevel > currentLevel) {
            // Get player stats to check requirements
            const serverSpecificId = getServerSpecificId(userId, getCurrentServer());
            const userRef = doc(db, 'playerStats', serverSpecificId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                return { success: false, message: 'Mängija andmed ei leitud' };
            }

            const playerStats = userSnap.data();
            const playerAttributes = {
                handling: playerStats.attributes?.handling?.level || 0,
                reactionTime: playerStats.attributes?.reactionTime?.level || 0,
                gearShifting: playerStats.attributes?.gearShifting?.level || 0
            };

            // Check requirements
            const reqCheck = checkTuningRequirements(
                tuningCategory,
                newLevel,
                playerStats.level,
                playerAttributes
            );

            if (!reqCheck.canUpgrade) {
                return {
                    success: false,
                    message: `Nõuded ei ole täidetud: ${reqCheck.missingRequirements.join(', ')}`
                };
            }

            // Check if player has enough money for upgrade
            const config = UNIVERSAL_TUNING_CONFIG[tuningCategory];
            const stage = config.stages[newLevel];

            // Get the car model to calculate cost
            const carModel = await getVehicleModelById(carData.carModelId);

            if (!carModel) {
                return { success: false, message: 'Auto mudel ei leitud' };
            }

            const carModelForTuning = {
                id: carModel.id,
                brand: carModel.brandName,
                model: carModel.model,
                mass: carModel.mass,
                compatibleEngines: carModel.compatibleEngineIds,
                defaultEngine: carModel.defaultEngineId,
                basePrice: carModel.basePrice,
                basePollidPrice: carModel.basePollidPrice,
                currency: carModel.currency
            };

            const tuningBasePrice = getTuningBasePrice(carModelForTuning);
            const upgradeCost = Math.floor(tuningBasePrice * (stage.pricePercent / 100));

            if (playerStats.money < upgradeCost) {
                return {
                    success: false,
                    message: `Sul pole piisavalt raha! Vajad ${upgradeCost.toLocaleString()}€, sul on ${playerStats.money.toLocaleString()}€`
                };
            }

            // Deduct money for upgrade
            await updateDoc(userRef, {
                money: playerStats.money - upgradeCost
            });
        }

        // Update the specific category
        const updatedTuning = {
            ...currentTuning,
            [tuningCategory]: newLevel
        };

        await updateDoc(carRef, {
            universalTuning: updatedTuning,
            updatedAt: serverTimestamp()
        });

        return { success: true, message: 'Tuuning uuendatud!' };
    } catch (error) {
        console.error('Error updating car tuning:', error);
        return { success: false, message: 'Viga tuuningu uuendamisel' };
    }
};