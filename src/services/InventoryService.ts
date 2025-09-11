// src/services/InventoryService.ts - UPDATED: Disabled spare parts system

import {
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
} from 'firebase/firestore';
import { firestore as db } from '../config/firebase';

// MIGRATION FLAG - Set to true to disable old spare parts system
const SPARE_PARTS_SYSTEM_DISABLED = true;

export interface InventoryItem {
    itemId: string;
    purchaseDate: Date;
    purchasePrice: number;
    installedOn?: string | null;
}

// UPDATED: Block spare parts purchases
export const purchaseItem = async (
    userId: string,
    purchase: {
        itemId: string;
        quantity: number;
        price: number;
    }
): Promise<void> => {
    // Check if this is a spare part purchase
    if (SPARE_PARTS_SYSTEM_DISABLED) {
        const sparePartPrefixes = ['turbo_', 'ecu_', 'intake_', 'exhaust_'];
        if (sparePartPrefixes.some(prefix => purchase.itemId.startsWith(prefix))) {
            throw new Error('Varuosade süsteem on uuendamisel. Uus universaalne tuuningu süsteem tuleb varsti!');
        }
    }

    try {
        await runTransaction(db, async (transaction) => {
            const statsRef = doc(db, 'playerStats', userId);
            const inventoryRef = doc(db, 'inventories', userId);

            const statsSnap = await transaction.get(statsRef);
            const inventorySnap = await transaction.get(inventoryRef);

            if (!statsSnap.exists()) {
                throw new Error('Mängija statistikat ei leitud');
            }

            const currentMoney = statsSnap.data().money || 0;
            const totalCost = purchase.price * purchase.quantity;

            if (currentMoney < totalCost) {
                throw new Error('Pole piisavalt raha');
            }

            // For non-spare parts, continue with normal inventory logic
            const currentTime = new Date();
            const items: InventoryItem[] = [];
            for (let i = 0; i < purchase.quantity; i++) {
                items.push({
                    itemId: `${purchase.itemId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    purchaseDate: currentTime,
                    purchasePrice: purchase.price
                });
            }

            transaction.update(statsRef, {
                money: currentMoney - totalCost
            });

            if (!inventorySnap.exists()) {
                transaction.set(inventoryRef, {
                    userId: userId,
                    spareParts: items, // Keep field name for compatibility
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
        console.error('Viga osta ostmisel:', error);
        throw error;
    }
};

// UPDATED: Return existing inventory for migration purposes
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

// DISABLED FUNCTIONS - Throw errors to prevent usage

export const getUninstalledParts = async (
    userId: string,
    category?: 'turbo' | 'ecu' | 'intake' | 'exhaust'
): Promise<InventoryItem[]> => {
    if (SPARE_PARTS_SYSTEM_DISABLED) {
        console.log('Spare parts system disabled - returning empty array');
        return []; // Return empty instead of throwing error for UI compatibility
    }

    // Legacy code removed - return empty for now
    return [];
};

export const installPartOnCar = async (
    userId: string,
    carId: string,
    inventoryItemId: string
): Promise<void> => {
    throw new Error('Varuosade paigaldamine on välja lülitatud. Uus universaalne tuuningu süsteem tuleb varsti!');
};

export const uninstallPartFromCar = async (
    userId: string,
    carId: string,
    partCategory: 'turbo' | 'ecu' | 'intake' | 'exhaust'
): Promise<void> => {
    throw new Error('Varuosade eemaldamine on välja lülitatud. Uus universaalne tuuningu süsteem tuleb varsti!');
};

export const sellPartFromInventory = async (
    userId: string,
    inventoryItemId: string
): Promise<void> => {
    throw new Error('Varuosade müük on välja lülitatud. Uus universaalne tuuningu süsteem tuleb varsti!');
};

export const hasPartInInventory = async (
    userId: string,
    category: string,
    level: string
): Promise<boolean> => {
    if (SPARE_PARTS_SYSTEM_DISABLED) {
        return false;
    }
    return false;
};

// MIGRATION HELPER FUNCTIONS

/**
 * Get spare parts inventory for migration purposes
 * Returns existing spare parts so they can be converted to money/credits
 */
export const getSparePartsForMigration = async (userId: string): Promise<{
    installedParts: InventoryItem[];
    uninstalledParts: InventoryItem[];
    totalValue: number;
}> => {
    try {
        const inventory = await getPlayerInventory(userId);

        const installedParts = inventory.filter(item => item.installedOn);
        const uninstalledParts = inventory.filter(item => !item.installedOn);

        // Calculate total value (50% of purchase price for uninstalled, 75% for installed)
        const uninstalledValue = uninstalledParts.reduce((sum, item) =>
            sum + Math.floor(item.purchasePrice * 0.5), 0);
        const installedValue = installedParts.reduce((sum, item) =>
            sum + Math.floor(item.purchasePrice * 0.75), 0);

        return {
            installedParts,
            uninstalledParts,
            totalValue: uninstalledValue + installedValue
        };
    } catch (error) {
        console.error('Error getting spare parts for migration:', error);
        return {
            installedParts: [],
            uninstalledParts: [],
            totalValue: 0
        };
    }
};

/**
 * Clear spare parts inventory after migration
 * This removes all spare parts from player inventory
 */
export const clearSparePartsInventory = async (userId: string): Promise<void> => {
    try {
        await runTransaction(db, async (transaction) => {
            const inventoryRef = doc(db, 'inventories', userId);
            const inventorySnap = await transaction.get(inventoryRef);

            if (inventorySnap.exists()) {
                transaction.update(inventoryRef, {
                    spareParts: [], // Clear all spare parts
                    migratedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
        });
    } catch (error) {
        console.error('Error clearing spare parts inventory:', error);
        throw error;
    }
};

/**
 * Get inventory summary for migration info
 */
export const getInventorySummary = async (userId: string): Promise<{
    turbo: number;
    ecu: number;
    intake: number;
    exhaust: number;
    total: number;
    estimatedValue: number;
}> => {
    if (SPARE_PARTS_SYSTEM_DISABLED) {
        // For migration purposes, still calculate summary
        try {
            const inventory = await getPlayerInventory(userId);
            const summary = {
                turbo: 0,
                ecu: 0,
                intake: 0,
                exhaust: 0,
                total: 0,
                estimatedValue: 0
            };

            inventory.forEach(item => {
                // Extract category from itemId (e.g., "turbo_stage1_123456789")
                const parts = item.itemId.split('_');
                if (parts.length >= 2) {
                    const category = parts[0];
                    if (category in summary && category !== 'total') {
                        summary[category as keyof typeof summary]++;
                        summary.total++;
                        // Estimate value (50% of purchase price)
                        summary.estimatedValue += Math.floor(item.purchasePrice * 0.5);
                    }
                }
            });

            return summary;
        } catch (error) {
            console.error('Error getting inventory summary:', error);
        }
    }

    return { turbo: 0, ecu: 0, intake: 0, exhaust: 0, total: 0, estimatedValue: 0 };
};

// UTILITY FUNCTIONS for migration

/**
 * Check if player has any spare parts that need migration
 */
export const hasSparePartsForMigration = async (userId: string): Promise<boolean> => {
    try {
        const inventory = await getPlayerInventory(userId);
        return inventory.length > 0;
    } catch (error) {
        console.error('Error checking spare parts for migration:', error);
        return false;
    }
};

/**
 * Get detailed spare parts breakdown for migration UI
 */
export const getSparePartsBreakdown = async (userId: string): Promise<{
    categories: Record<string, { count: number; value: number; items: InventoryItem[] }>;
    totalItems: number;
    totalValue: number;
}> => {
    try {
        const inventory = await getPlayerInventory(userId);
        const breakdown: Record<string, { count: number; value: number; items: InventoryItem[] }> = {};
        let totalItems = 0;
        let totalValue = 0;

        inventory.forEach(item => {
            const parts = item.itemId.split('_');
            if (parts.length >= 2) {
                const category = parts[0];
                const itemValue = Math.floor(item.purchasePrice * (item.installedOn ? 0.75 : 0.5));

                if (!breakdown[category]) {
                    breakdown[category] = { count: 0, value: 0, items: [] };
                }

                breakdown[category].count++;
                breakdown[category].value += itemValue;
                breakdown[category].items.push(item);

                totalItems++;
                totalValue += itemValue;
            }
        });

        return {
            categories: breakdown,
            totalItems,
            totalValue
        };
    } catch (error) {
        console.error('Error getting spare parts breakdown:', error);
        return {
            categories: {},
            totalItems: 0,
            totalValue: 0
        };
    }
};