// src/services/InventoryService.ts

import {
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
} from 'firebase/firestore';
import { firestore as db } from '../config/firebase';
import { createTimestampedId, getBaseIdFromInventoryId } from '../utils/inventoryUtils';
import { PlayerCar, TurboLevel, ECULevel, IntakeLevel, ExhaustLevel } from "../types/vehicles";
import { getPartById, getPartSellPrice, getStockPartPrice } from "../data/vehicles/spareParts";

export interface InventoryItem {
    itemId: string;
    purchaseDate: Date;
    purchasePrice: number;
    installedOn?: string | null; // Changed: explicitly allow null
}

export const purchaseItem = async (
    userId: string,
    purchase: {
        itemId: string;
        quantity: number;
        price: number;
    }
): Promise<void> => {
    try {
        await runTransaction(db, async (transaction) => {
            // ALL READS FIRST
            const statsRef = doc(db, 'playerStats', userId);
            const inventoryRef = doc(db, 'inventories', userId);

            const statsSnap = await transaction.get(statsRef);
            const inventorySnap = await transaction.get(inventoryRef);

            // VALIDATION
            if (!statsSnap.exists()) {
                throw new Error('Mängija statistikat ei leitud');
            }

            const currentMoney = statsSnap.data().money || 0;
            const totalCost = purchase.price * purchase.quantity;

            if (currentMoney < totalCost) {
                throw new Error('Pole piisavalt raha');
            }

            // PREPARE DATA - No undefined values
            const currentTime = new Date();
            const items: InventoryItem[] = [];
            for (let i = 0; i < purchase.quantity; i++) {
                items.push({
                    itemId: createTimestampedId(purchase.itemId),
                    purchaseDate: currentTime,
                    purchasePrice: purchase.price
                    // No installedOn field - avoids undefined
                });
            }

            // ALL WRITES
            transaction.update(statsRef, {
                money: currentMoney - totalCost
            });

            if (!inventorySnap.exists()) {
                transaction.set(inventoryRef, {
                    userId: userId,
                    spareParts: items,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            } else {
                const existingParts = inventorySnap.data().spareParts || [];
                transaction.update(inventoryRef, {
                    spareParts: [...existingParts, ...items],
                    updatedAt: serverTimestamp()
                });
            }
        });
    } catch (error) {
        console.error('Viga osa ostmisel:', error);
        throw error;
    }
};

export const getPlayerInventory = async (userId: string): Promise<InventoryItem[]> => {
    try {
        const inventoryRef = doc(db, 'inventories', userId);
        const inventorySnap = await getDoc(inventoryRef);

        if (!inventorySnap.exists()) {
            return [];
        }

        return inventorySnap.data().spareParts || [];
    } catch (error) {
        console.error('Viga inventaari laadimisel:', error);
        return [];
    }
};

export const getUninstalledParts = async (
    userId: string,
    category?: 'turbo' | 'ecu' | 'intake' | 'exhaust'
): Promise<InventoryItem[]> => {
    try {
        const inventory = await getPlayerInventory(userId);
        let uninstalled = inventory.filter(item => !item.installedOn);

        if (category) {
            uninstalled = uninstalled.filter(item => {
                const baseId = getBaseIdFromInventoryId(item.itemId);
                return baseId.startsWith(category);
            });
        }

        return uninstalled;
    } catch (error) {
        console.error('Viga installimata osade laadimisel:', error);
        return [];
    }
};

export const installPartOnCar = async (
    userId: string,
    carId: string,
    inventoryItemId: string
): Promise<void> => {
    try {
        await runTransaction(db, async (transaction) => {
            // ALL READS FIRST
            const inventoryRef = doc(db, 'inventories', userId);
            const carRef = doc(db, 'cars', carId);

            const inventorySnap = await transaction.get(inventoryRef);
            const carSnap = await transaction.get(carRef);

            // VALIDATION
            if (!inventorySnap.exists()) {
                throw new Error('Inventaari ei leitud');
            }
            if (!carSnap.exists()) {
                throw new Error('Autot ei leitud');
            }

            const spareParts: InventoryItem[] = inventorySnap.data().spareParts || [];
            const partIndex = spareParts.findIndex(p => p.itemId === inventoryItemId);

            if (partIndex === -1) {
                throw new Error('Osa ei leitud inventaarist');
            }

            const part = spareParts[partIndex];
            if (part.installedOn) {
                throw new Error('Osa on juba paigaldatud');
            }

            const baseId = getBaseIdFromInventoryId(part.itemId);
            const partData = getPartById(baseId);
            if (!partData) {
                throw new Error('Osa andmeid ei leitud');
            }

            const carData = carSnap.data() as PlayerCar;
            if (carData.ownerId !== userId) {
                throw new Error('See ei ole sinu auto');
            }

            // PREPARE UPDATES
            // Remove old part if exists
            const currentPartLevel = carData.engine[partData.category as keyof typeof carData.engine];
            if (currentPartLevel !== 'stock') {
                const oldPartIndex = spareParts.findIndex((p: InventoryItem) =>
                    p.installedOn === carId &&
                    getBaseIdFromInventoryId(p.itemId).startsWith(partData.category)
                );
                if (oldPartIndex !== -1) {
                    delete spareParts[oldPartIndex].installedOn; // Remove the field entirely
                }
            }

            // Install new part
            spareParts[partIndex].installedOn = carId;

            // Update engine
            const updatedEngine = { ...carData.engine };
            const emptySlots = { ...(carData.emptyPartSlots || {}) };

            if (partData.category === 'turbo') {
                updatedEngine.turbo = partData.level as TurboLevel;
                emptySlots.turbo = false; // NEW: Mark slot as filled
            } else if (partData.category === 'ecu') {
                updatedEngine.ecu = partData.level as ECULevel;
                emptySlots.ecu = false;
            } else if (partData.category === 'intake') {
                updatedEngine.intake = partData.level as IntakeLevel;
                emptySlots.intake = false;
            } else if (partData.category === 'exhaust') {
                updatedEngine.exhaust = partData.level as ExhaustLevel;
                emptySlots.exhaust = false;
            }

            // ALL WRITES
            transaction.update(inventoryRef, {
                spareParts: spareParts,
                updatedAt: serverTimestamp()
            });

            transaction.update(carRef, {
                engine: updatedEngine,
                emptyPartSlots: emptySlots, // NEW: Update empty slots
                updatedAt: serverTimestamp()
            });
        });
    } catch (error) {
        console.error('Viga osa paigaldamisel:', error);
        throw error;
    }
};

export const uninstallPartFromCar = async (
    userId: string,
    carId: string,
    partCategory: 'turbo' | 'ecu' | 'intake' | 'exhaust'
): Promise<void> => {
    try {
        await runTransaction(db, async (transaction) => {
            const inventoryRef = doc(db, 'inventories', userId);
            const carRef = doc(db, 'cars', carId);

            const inventorySnap = await transaction.get(inventoryRef);
            const carSnap = await transaction.get(carRef);

            if (!carSnap.exists()) {
                throw new Error('Autot ei leitud');
            }

            const carData = carSnap.data() as PlayerCar;

            // NEW: Check if this part slot is already empty
            const emptySlots = carData.emptyPartSlots || {};
            if (emptySlots[partCategory]) {
                throw new Error('Selles kategoorias ei ole ühtegi osa paigaldatud');
            }

            const currentPartLevel = carData.engine[partCategory];
            let spareParts: InventoryItem[] = [];

            if (inventorySnap.exists()) {
                spareParts = inventorySnap.data().spareParts || [];
            }

            if (currentPartLevel === 'stock') {
                // Removing stock part - add it to inventory
                const stockPartId = `${partCategory}_stock`;
                const stockPrice = getStockPartPrice(partCategory);

                const stockItem: InventoryItem = {
                    itemId: createTimestampedId(stockPartId),
                    purchaseDate: new Date(),
                    purchasePrice: stockPrice
                };

                spareParts.push(stockItem);
            } else {
                // Removing upgraded part - find it in inventory and uninstall + add stock part
                const partIndex = spareParts.findIndex((p: InventoryItem) =>
                    p.installedOn === carId &&
                    getBaseIdFromInventoryId(p.itemId).startsWith(partCategory)
                );

                if (partIndex !== -1) {
                    delete spareParts[partIndex].installedOn;
                }

                // Also add a stock part
                const stockPartId = `${partCategory}_stock`;
                const stockPrice = getStockPartPrice(partCategory);

                const stockItem: InventoryItem = {
                    itemId: createTimestampedId(stockPartId),
                    purchaseDate: new Date(),
                    purchasePrice: stockPrice
                };

                spareParts.push(stockItem);
            }

            // NEW: Mark this part slot as empty and reset engine to base values
            const updatedEngine = { ...carData.engine };
            const updatedEmptySlots = { ...emptySlots, [partCategory]: true };

            // Don't set to 'stock' - instead remove the part entirely (or set to null/empty state)
            if (partCategory === 'turbo') {
                updatedEngine.turbo = 'stock'; // Keep as stock for now, but mark slot empty
            } else if (partCategory === 'ecu') {
                updatedEngine.ecu = 'stock';
            } else if (partCategory === 'intake') {
                updatedEngine.intake = 'stock';
            } else if (partCategory === 'exhaust') {
                updatedEngine.exhaust = 'stock';
            }

            // Write updates
            if (!inventorySnap.exists()) {
                transaction.set(inventoryRef, {
                    userId: userId,
                    spareParts: spareParts,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            } else {
                transaction.update(inventoryRef, {
                    spareParts: spareParts,
                    updatedAt: serverTimestamp()
                });
            }

            transaction.update(carRef, {
                engine: updatedEngine,
                emptyPartSlots: updatedEmptySlots, // NEW: Track empty slots
                updatedAt: serverTimestamp()
            });
        });
    } catch (error) {
        console.error('Viga osa eemaldamisel:', error);
        throw error;
    }
};

export const sellPartFromInventory = async (
    userId: string,
    inventoryItemId: string
): Promise<void> => {
    try {
        await runTransaction(db, async (transaction) => {
            // ALL READS FIRST
            const inventoryRef = doc(db, 'inventories', userId);
            const statsRef = doc(db, 'playerStats', userId);

            const inventorySnap = await transaction.get(inventoryRef);
            const statsSnap = await transaction.get(statsRef);

            if (!inventorySnap.exists()) {
                throw new Error('Inventaari ei leitud');
            }

            const spareParts: InventoryItem[] = inventorySnap.data().spareParts || [];
            const partToSell = spareParts.find((p: InventoryItem) =>
                p.itemId === inventoryItemId
            );

            if (!partToSell) {
                throw new Error('Osa ei leitud inventaarist');
            }

            if (partToSell.installedOn) {
                throw new Error('Paigaldatud osa ei saa müüa');
            }

            const sellPrice = getPartSellPrice(
                getBaseIdFromInventoryId(partToSell.itemId),
                partToSell.purchasePrice
            );

            // PREPARE UPDATES
            const updatedParts = spareParts.filter((p: InventoryItem) =>
                p.itemId !== inventoryItemId
            );

            // ALL WRITES
            transaction.update(inventoryRef, {
                spareParts: updatedParts,
                updatedAt: serverTimestamp()
            });

            if (statsSnap.exists()) {
                const currentMoney = statsSnap.data().money || 0;
                transaction.update(statsRef, {
                    money: currentMoney + sellPrice
                });
            }
        });
    } catch (error) {
        console.error('Viga osa müümisel:', error);
        throw error;
    }
};

export const hasPartInInventory = async (
    userId: string,
    category: string,
    level: string
): Promise<boolean> => {
    try {
        const inventory = await getPlayerInventory(userId);
        return inventory.some(item => {
            if (item.installedOn) return false;
            const baseId = getBaseIdFromInventoryId(item.itemId);
            return baseId === `${category}_${level}`;
        });
    } catch (error) {
        console.error('Viga osa kontrollimisel:', error);
        return false;
    }
};

export const getInventorySummary = async (userId: string): Promise<{
    turbo: number;
    ecu: number;
    intake: number;
    exhaust: number;
    total: number;
}> => {
    try {
        const inventory = await getPlayerInventory(userId);
        const uninstalled = inventory.filter(item => !item.installedOn);

        const summary = {
            turbo: 0,
            ecu: 0,
            intake: 0,
            exhaust: 0,
            total: 0
        };

        uninstalled.forEach(item => {
            const baseId = getBaseIdFromInventoryId(item.itemId);
            const category = baseId.split('_')[0];
            if (category in summary && category !== 'total') {
                summary[category as keyof typeof summary]++;
                summary.total++;
            }
        });

        return summary;
    } catch (error) {
        console.error('Viga inventaari kokkuvõtte laadimisel:', error);
        return { turbo: 0, ecu: 0, intake: 0, exhaust: 0, total: 0 };
    }
};