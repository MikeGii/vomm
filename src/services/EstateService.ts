// src/services/EstateService.ts
import { doc, getDoc, setDoc, Timestamp, runTransaction } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import {PlayerEstate, EstateProperty, EstateTransaction, GarageSlot} from '../types/estate';
import { InventoryItem } from '../types';
import { getBaseIdFromInventoryId } from '../utils/inventoryUtils';
import { AVAILABLE_ESTATES } from "../data/estates";

export const getPlayerEstate = async (userId: string): Promise<PlayerEstate | null> => {
    try {
        const estateDoc = await getDoc(doc(firestore, 'playerEstates', userId));

        if (estateDoc.exists()) {
            const data = estateDoc.data();
            return {
                ...data,
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate()
            } as PlayerEstate;
        }

        return null;
    } catch (error) {
        console.error('Error fetching player estate:', error);
        throw error;
    }
};

export const ensurePlayerEstate = async (userId: string): Promise<PlayerEstate> => {
    // Check if estate record already exists
    const existingEstate = await getPlayerEstate(userId);
    if (existingEstate) {
        return existingEstate;
    }

    // Create new estate record (works for both new and existing players)
    const newEstate: PlayerEstate = {
        userId,
        currentEstate: null, // No property initially
        ownedDevices: {
            has3DPrinter: false,
            hasLaserCutter: false
        },
        unequippedDevices: {
            threeDPrinters: 0,
            laserCutters: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
    };

    await setDoc(doc(firestore, 'playerEstates', userId), {
        ...newEstate,
        createdAt: Timestamp.fromDate(newEstate.createdAt),
        updatedAt: Timestamp.fromDate(newEstate.updatedAt)
    });

    return newEstate;
};

const createEmptyGarageSlots = (capacity: number): GarageSlot[] => {
    const slots: GarageSlot[] = [];
    for (let i = 1; i <= capacity; i++) {
        slots.push({
            slotId: i,
            isEmpty: true
        });
    }
    return slots;
};

// Keep the old name as an alias for backward compatibility
export const initializePlayerEstate = ensurePlayerEstate;

export const calculateEstateTransaction = (
    newEstate: EstateProperty,
    currentEstate: EstateProperty | null
): EstateTransaction => {
    const currentEstateValue = currentEstate ? Math.floor(currentEstate.price * 0.9) : 0;
    const finalPrice = newEstate.price - currentEstateValue;

    return {
        newEstate,
        currentEstate,
        finalPrice,
        currentEstateValue
    };
};


export const getDetailedWorkshopDevices = (inventory: InventoryItem[]): {
    threeDPrinters: InventoryItem[];
    laserCutters: InventoryItem[];
} => {
    const threeDPrinters: InventoryItem[] = [];
    const laserCutters: InventoryItem[] = [];

    inventory.forEach(item => {
        if (item.equipped) return; // Skip equipped items

        const baseId = getBaseIdFromInventoryId(item.id);

        if (baseId.includes('3d_printer') || baseId === 'workshop_3d_printer') {
            threeDPrinters.push(item);
        } else if (baseId.includes('laser_cutter') || baseId === 'workshop_laser_cutter') {
            laserCutters.push(item);
        }
    });

    return { threeDPrinters, laserCutters };
};

// Function to equip a workshop device
export const equipWorkshopDevice = async (
    userId: string,
    deviceType: '3d_printer' | 'laser_cutter',
    specificItemId?: string
): Promise<void> => {
    try {
        return await runTransaction(firestore, async (transaction) => {
            const estateRef = doc(firestore, 'playerEstates', userId);
            const playerRef = doc(firestore, 'playerStats', userId);

            const estateDoc = await transaction.get(estateRef);
            const playerDoc = await transaction.get(playerRef);

            if (!estateDoc.exists() || !playerDoc.exists()) {
                throw new Error('Estate or player data not found');
            }

            const estate = estateDoc.data() as PlayerEstate;
            const playerStats = playerDoc.data();

            if (!estate.currentEstate?.hasWorkshop) {
                throw new Error('Töökoda on vajalik seadme paigaldamiseks');
            }

            // Check if device is already equipped
            const isAlreadyEquipped = deviceType === '3d_printer'
                ? estate.ownedDevices?.has3DPrinter
                : estate.ownedDevices?.hasLaserCutter;

            if (isAlreadyEquipped) {
                throw new Error('Seade on juba paigaldatud');
            }

            // Find and remove specific device from player inventory
            const inventory = [...(playerStats.inventory || [])];
            let deviceRemoved = false;
            let targetItemIndex = -1;
            let originalItem: InventoryItem | null = null;

            if (specificItemId) {
                targetItemIndex = inventory.findIndex(item => item.id === specificItemId);
                if (targetItemIndex >= 0 && inventory[targetItemIndex].quantity > 0) {
                    originalItem = { ...inventory[targetItemIndex] };
                    deviceRemoved = true;
                }
            } else {
                // Look for any device of this type (fallback)
                for (let i = 0; i < inventory.length; i++) {
                    const item = inventory[i];
                    const baseId = getBaseIdFromInventoryId(item.id);

                    const isTargetDevice = (deviceType === '3d_printer' &&
                            (baseId.includes('3d_printer') || baseId === 'workshop_3d_printer')) ||
                        (deviceType === 'laser_cutter' &&
                            (baseId.includes('laser_cutter') || baseId === 'workshop_laser_cutter'));

                    if (isTargetDevice && item.quantity > 0 && !item.equipped) {
                        targetItemIndex = i;
                        originalItem = { ...inventory[i] };
                        deviceRemoved = true;
                        break;
                    }
                }
            }

            if (!deviceRemoved || targetItemIndex === -1 || !originalItem) {
                throw new Error('Seadet ei õnnestunud inventarist leida');
            }

            // Remove one quantity from the found item
            if (inventory[targetItemIndex].quantity > 1) {
                inventory[targetItemIndex] = {
                    ...inventory[targetItemIndex],
                    quantity: inventory[targetItemIndex].quantity - 1
                };
            } else {
                inventory.splice(targetItemIndex, 1);
            }

            // Update player inventory
            transaction.update(playerRef, {
                inventory: inventory
            });

            // Update estate with device status and equipped device details
            const estateUpdates: any = {
                updatedAt: Timestamp.now()
            };

            if (deviceType === '3d_printer') {
                estateUpdates['ownedDevices.has3DPrinter'] = true;
                estateUpdates['equippedDeviceDetails.printer'] = originalItem;
            } else {
                estateUpdates['ownedDevices.hasLaserCutter'] = true;
                estateUpdates['equippedDeviceDetails.laserCutter'] = originalItem;
            }

            transaction.update(estateRef, estateUpdates);
        });
    } catch (error) {
        console.error('Error equipping workshop device:', error);
        throw error;
    }
};

export const unequipWorkshopDevice = async (
    userId: string,
    deviceType: '3d_printer' | 'laser_cutter'
): Promise<void> => {
    try {
        return await runTransaction(firestore, async (transaction) => {
            const estateRef = doc(firestore, 'playerEstates', userId);
            const playerRef = doc(firestore, 'playerStats', userId);

            const estateDoc = await transaction.get(estateRef);
            const playerDoc = await transaction.get(playerRef);

            if (!estateDoc.exists() || !playerDoc.exists()) {
                throw new Error('Estate or player data not found');
            }

            const estate = estateDoc.data() as PlayerEstate;
            const playerStats = playerDoc.data();

            // Check if device is currently equipped
            const isEquipped = deviceType === '3d_printer'
                ? estate.ownedDevices?.has3DPrinter
                : estate.ownedDevices?.hasLaserCutter;

            if (!isEquipped) {
                throw new Error('Seade ei ole paigaldatud');
            }

            // Get original item data
            const originalItem = deviceType === '3d_printer'
                ? estate.equippedDeviceDetails?.printer
                : estate.equippedDeviceDetails?.laserCutter;

            if (!originalItem) {
                throw new Error('Originaal seadme andmed puuduvad');
            }

            // Add device back to player inventory
            const inventory = [...(playerStats.inventory || [])];

            // Find existing item with same base properties or create with original data
            const existingItemIndex = inventory.findIndex(item =>
                item.name === originalItem.name &&
                item.description === originalItem.description &&
                item.shopPrice === originalItem.shopPrice
            );

            if (existingItemIndex >= 0) {
                // Increase quantity of existing item
                inventory[existingItemIndex] = {
                    ...inventory[existingItemIndex],
                    quantity: inventory[existingItemIndex].quantity + 1
                };
            } else {
                // Add original item back to inventory
                const restoredItem: InventoryItem = {
                    ...originalItem,
                    id: originalItem.id,
                    quantity: 1,
                    equipped: false
                };
                inventory.push(restoredItem);
            }

            // Update player inventory
            transaction.update(playerRef, {
                inventory: inventory
            });

            // Update estate - remove device and clear stored data
            const estateUpdates: any = {
                updatedAt: Timestamp.now()
            };

            if (deviceType === '3d_printer') {
                estateUpdates['ownedDevices.has3DPrinter'] = false;
                estateUpdates['equippedDeviceDetails.printer'] = null;
            } else {
                estateUpdates['ownedDevices.hasLaserCutter'] = false;
                estateUpdates['equippedDeviceDetails.laserCutter'] = null;
            }

            transaction.update(estateRef, estateUpdates);
        });
    } catch (error) {
        console.error('Error unequipping workshop device:', error);
        throw error;
    }
};

export const purchaseEstate = async (
    userId: string,
    newEstateId: string,
): Promise<{ success: boolean; message: string; newBalance?: number }> => {
    try {
        const newEstate = AVAILABLE_ESTATES.find(e => e.id === newEstateId);
        if (!newEstate) {
            return { success: false, message: 'Kinnisvara ei leitud' };
        }

        return await runTransaction(firestore, async (transaction) => {
            // Get current estate and player stats
            const estateRef = doc(firestore, 'playerEstates', userId);
            const playerRef = doc(firestore, 'playerStats', userId);
            const userRef = doc(firestore, 'users', userId); // LISA SEE

            const estateDoc = await transaction.get(estateRef);
            const playerDoc = await transaction.get(playerRef);
            const userDoc = await transaction.get(userRef); // LISA SEE

            if (!playerDoc.exists()) {
                throw new Error('Mängija andmed ei leitud');
            }

            const playerStats = playerDoc.data();
            const userData = userDoc.exists() ? userDoc.data() : {}; // LISA SEE
            const currentEstate = estateDoc.exists() ? estateDoc.data() : null;

            // Calculate transaction
            const estateTransaction = calculateEstateTransaction(
                newEstate,
                currentEstate?.currentEstate || null
            );

            // Check if player has enough money
            if (playerStats.money < estateTransaction.finalPrice) {
                return {
                    success: false,
                    message: 'Sul pole piisavalt raha!'
                };
            }

            const newBalance = playerStats.money - estateTransaction.finalPrice;

            // Update player money
            transaction.update(playerRef, {
                money: newBalance
            });

            // LISA SIIA GARAAŽI SLOTTIDE LOOGIKA
            let garageSlots = userData.estateData?.garageSlots || [];

            if (newEstate.hasGarage && newEstate.garageCapacity > 0) {
                // Kui vanal kinnisvaral polnud garaaži või uus on suurem
                if (!currentEstate?.currentEstate?.hasGarage ||
                    newEstate.garageCapacity !== (currentEstate?.currentEstate?.garageCapacity || 0)) {

                    // Salvesta olemasolevad autod
                    const existingCars = garageSlots.filter((slot: GarageSlot) => !slot.isEmpty);

                    // Loo uued slotid
                    garageSlots = createEmptyGarageSlots(newEstate.garageCapacity);

                    // Paiguta olemasolevad autod tagasi
                    existingCars.forEach((carSlot: GarageSlot, index: number) => {
                        if (index < garageSlots.length) {
                            garageSlots[index] = {
                                slotId: garageSlots[index].slotId,
                                isEmpty: false,
                                carId: carSlot.carId
                            };
                        }
                    });
                }
            } else {
                // Kui uuel kinnisvaral pole garaaži, tühjenda slotid
                garageSlots = [];
            }

            // Uuenda kasutaja dokument
            transaction.update(userRef, {
                'estateData.garageSlots': garageSlots
            });
            // LÕPP - garaaži slottide loogika

            // Update or create estate record
            const estateData = {
                userId,
                currentEstate: newEstate,
                ownedDevices: currentEstate?.ownedDevices || {
                    has3DPrinter: false,
                    hasLaserCutter: false
                },
                unequippedDevices: currentEstate?.unequippedDevices || {
                    threeDPrinters: 0,
                    laserCutters: 0
                },
                updatedAt: Timestamp.now()
            };

            if (estateDoc.exists()) {
                transaction.update(estateRef, estateData);
            } else {
                transaction.set(estateRef, {
                    ...estateData,
                    createdAt: Timestamp.now()
                });
            }

            const actionType = currentEstate?.currentEstate ?
                (estateTransaction.finalPrice < 0 ? 'alla müüdud' : 'uuendatud') :
                'ostetud';

            return {
                success: true,
                message: `Kinnisvara edukalt ${actionType}!`,
                newBalance
            };
        });
    } catch (error) {
        console.error('Error purchasing estate:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Tundmatu viga'
        };
    }
};