// src/services/EstateService.ts
import { doc, getDoc, setDoc, updateDoc, Timestamp, runTransaction } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerEstate, EstateProperty, EstateTransaction, WorkshopDevice } from '../types/estate';
import { InventoryItem } from '../types';
import { getBaseIdFromInventoryId } from '../utils/inventoryUtils';
import {AVAILABLE_ESTATES} from "../data/estates";

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

export const initializePlayerEstate = async (userId: string): Promise<PlayerEstate> => {
    const newEstate: PlayerEstate = {
        userId,
        currentEstate: null,
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

// Utility function to scan inventory for workshop devices
export const scanInventoryForWorkshopDevices = (inventory: InventoryItem[]): {
    threeDPrinters: number;
    laserCutters: number;
} => {
    let threeDPrinters = 0;
    let laserCutters = 0;

    inventory.forEach(item => {
        if (item.equipped) return; // Skip equipped items

        const baseId = getBaseIdFromInventoryId(item.id);

        // Check if this is a workshop device based on baseId
        // We'll define the workshop device IDs when we create them
        if (baseId.includes('3d_printer') || baseId === 'workshop_3d_printer') {
            threeDPrinters += item.quantity;
        } else if (baseId.includes('laser_cutter') || baseId === 'workshop_laser_cutter') {
            laserCutters += item.quantity;
        }
    });

    return { threeDPrinters, laserCutters };
};

// Function to equip a workshop device
export const equipWorkshopDevice = async (
    userId: string,
    deviceType: '3d_printer' | 'laser_cutter'
): Promise<void> => {
    try {
        const estateRef = doc(firestore, 'playerEstates', userId);
        const estate = await getPlayerEstate(userId);

        if (!estate) {
            throw new Error('Estate not found');
        }

        if (!estate.currentEstate?.hasWorkshop) {
            throw new Error('Töökoda on vajalik seadme paigaldamiseks');
        }

        // Check if device is available in unequipped devices
        const deviceKey = deviceType === '3d_printer' ? 'threeDPrinters' : 'laserCutters';
        if (estate.unequippedDevices[deviceKey] <= 0) {
            throw new Error('Seade ei ole saadaval laos');
        }

        // Update estate
        const updates: any = {
            updatedAt: Timestamp.now()
        };

        if (deviceType === '3d_printer') {
            updates['ownedDevices.has3DPrinter'] = true;
            updates['unequippedDevices.threeDPrinters'] = estate.unequippedDevices.threeDPrinters - 1;
        } else {
            updates['ownedDevices.hasLaserCutter'] = true;
            updates['unequippedDevices.laserCutters'] = estate.unequippedDevices.laserCutters - 1;
        }

        await updateDoc(estateRef, updates);
    } catch (error) {
        console.error('Error equipping workshop device:', error);
        throw error;
    }
};

// Function to unequip a workshop device
export const unequipWorkshopDevice = async (
    userId: string,
    deviceType: '3d_printer' | 'laser_cutter'
): Promise<void> => {
    try {
        const estateRef = doc(firestore, 'playerEstates', userId);
        const estate = await getPlayerEstate(userId);

        if (!estate) {
            throw new Error('Estate not found');
        }

        // Update estate
        const updates: any = {
            updatedAt: Timestamp.now()
        };

        if (deviceType === '3d_printer') {
            updates['ownedDevices.has3DPrinter'] = false;
            updates['unequippedDevices.threeDPrinters'] = estate.unequippedDevices.threeDPrinters + 1;
        } else {
            updates['ownedDevices.hasLaserCutter'] = false;
            updates['unequippedDevices.laserCutters'] = estate.unequippedDevices.laserCutters + 1;
        }

        await updateDoc(estateRef, updates);
    } catch (error) {
        console.error('Error unequipping workshop device:', error);
        throw error;
    }
};

export const updateEstateDeviceInventory = async (userId: string, inventory: InventoryItem[]): Promise<void> => {
    try {
        const devices = scanInventoryForWorkshopDevices(inventory);
        const estateRef = doc(firestore, 'playerEstates', userId);

        await updateDoc(estateRef, {
            'unequippedDevices.threeDPrinters': devices.threeDPrinters,
            'unequippedDevices.laserCutters': devices.laserCutters,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Error updating estate device inventory:', error);
        throw error;
    }
};

export const purchaseEstate = async (
    userId: string,
    newEstateId: string,
    playerMoney: number
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

            const estateDoc = await transaction.get(estateRef);
            const playerDoc = await transaction.get(playerRef);

            if (!playerDoc.exists()) {
                throw new Error('Mängija andmed ei leitud');
            }

            const playerStats = playerDoc.data();
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