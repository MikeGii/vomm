// src/services/InventoryRepairService.ts
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';
import { CRAFTING_INGREDIENTS } from '../data/shop/craftingIngredients';
import { InventoryItem } from '../types';

// Helper function to extract base ID properly
const getBaseIdFromInventoryId = (inventoryId: string): string => {
    const parts = inventoryId.split('_');

    if (parts.length >= 3) {
        const lastPart = parts[parts.length - 1];
        const secondLastPart = parts[parts.length - 2];

        if (lastPart.includes('.') && /^\\d+$/.test(secondLastPart)) {
            return parts.slice(0, -2).join('_');
        }
    }

    return parts[0];
};

// Check if an item needs repair (has incorrect name/description)
const needsRepair = (item: InventoryItem): boolean => {
    if (item.category !== 'crafting') return false;

    const baseId = getBaseIdFromInventoryId(item.id);
    const correctShopItem = CRAFTING_INGREDIENTS.find(ingredient => ingredient.id === baseId);

    if (!correctShopItem) return false;

    // Check if name or description doesn't match
    return item.name !== correctShopItem.name ||
        item.description !== correctShopItem.description;
};

// Repair a single inventory item
const repairInventoryItem = (item: InventoryItem): InventoryItem => {
    const baseId = getBaseIdFromInventoryId(item.id);
    const correctShopItem = CRAFTING_INGREDIENTS.find(ingredient => ingredient.id === baseId);

    if (!correctShopItem) {
        console.warn(`No shop item found for baseId: ${baseId}`);
        return item;
    }

    return {
        ...item,
        name: correctShopItem.name,
        description: correctShopItem.description,
        shopPrice: correctShopItem.basePrice
    };
};

// Repair inventory for a single user
export const repairUserInventory = async (userId: string): Promise<{
    success: boolean;
    repaired: number;
    message: string;
}> => {
    try {
        const playerRef = doc(firestore, 'playerStats', userId);
        const playerDoc = await getDocs(collection(firestore, 'playerStats').withConverter(null));

        const userDoc = playerDoc.docs.find(doc => doc.id === userId);
        if (!userDoc) {
            return {
                success: false,
                repaired: 0,
                message: 'User not found'
            };
        }

        const playerStats = userDoc.data() as PlayerStats;
        const inventory = playerStats.inventory || [];

        let repairedCount = 0;
        const repairedInventory = inventory.map(item => {
            if (needsRepair(item)) {
                repairedCount++;
                console.log(`Repairing item: ${item.name} -> ${getBaseIdFromInventoryId(item.id)}`);
                return repairInventoryItem(item);
            }
            return item;
        });

        if (repairedCount > 0) {
            await updateDoc(playerRef, {
                inventory: repairedInventory
            });
        }

        return {
            success: true,
            repaired: repairedCount,
            message: `Repaired ${repairedCount} items for user ${userId}`
        };

    } catch (error) {
        console.error(`Error repairing inventory for user ${userId}:`, error);
        return {
            success: false,
            repaired: 0,
            message: `Error: ${error}`
        };
    }
};

// Repair inventories for all users (admin function)
export const repairAllUserInventories = async (): Promise<{
    success: boolean;
    usersProcessed: number;
    totalItemsRepaired: number;
    details: string[];
}> => {
    try {
        const playersCollection = collection(firestore, 'playerStats');
        const querySnapshot = await getDocs(playersCollection);

        let usersProcessed = 0;
        let totalItemsRepaired = 0;
        const details: string[] = [];

        // Use batch operations for better performance
        const batch = writeBatch(firestore);
        let batchOperations = 0;

        for (const docSnapshot of querySnapshot.docs) {
            const userId = docSnapshot.id;
            const playerStats = docSnapshot.data() as PlayerStats;
            const inventory = playerStats.inventory || [];

            let userRepairedCount = 0;
            const repairedInventory = inventory.map(item => {
                if (needsRepair(item)) {
                    const oldName = item.name;
                    const repairedItem = repairInventoryItem(item);
                    userRepairedCount++;

                    details.push(`User ${userId}: ${oldName} -> ${repairedItem.name}`);
                    return repairedItem;
                }
                return item;
            });

            if (userRepairedCount > 0) {
                const playerRef = doc(firestore, 'playerStats', userId);
                batch.update(playerRef, { inventory: repairedInventory });
                batchOperations++;

                // Firestore batch limit is 500 operations
                if (batchOperations >= 400) {
                    await batch.commit();
                    batchOperations = 0;
                }
            }

            usersProcessed++;
            totalItemsRepaired += userRepairedCount;
        }

        // Commit any remaining batch operations
        if (batchOperations > 0) {
            await batch.commit();
        }

        return {
            success: true,
            usersProcessed,
            totalItemsRepaired,
            details
        };

    } catch (error) {
        console.error('Error repairing all inventories:', error);
        return {
            success: false,
            usersProcessed: 0,
            totalItemsRepaired: 0,
            details: [`Error: ${error}`]
        };
    }
};

// Preview what would be repaired without actually doing it
export const previewInventoryRepairs = async (userId?: string): Promise<{
    itemsToRepair: { userId: string; oldName: string; newName: string; baseId: string }[];
    totalUsers: number;
    totalItems: number;
}> => {
    try {
        const playersCollection = collection(firestore, 'playerStats');
        const querySnapshot = await getDocs(playersCollection);

        const itemsToRepair: { userId: string; oldName: string; newName: string; baseId: string }[] = [];
        let totalUsers = 0;
        let totalItems = 0;

        for (const docSnapshot of querySnapshot.docs) {
            const docUserId = docSnapshot.id;

            // If specific user requested, skip others
            if (userId && docUserId !== userId) continue;

            const playerStats = docSnapshot.data() as PlayerStats;
            const inventory = playerStats.inventory || [];

            let userHasRepairs = false;

            inventory.forEach(item => {
                if (needsRepair(item)) {
                    const baseId = getBaseIdFromInventoryId(item.id);
                    const correctShopItem = CRAFTING_INGREDIENTS.find(ingredient => ingredient.id === baseId);

                    if (correctShopItem) {
                        itemsToRepair.push({
                            userId: docUserId,
                            oldName: item.name,
                            newName: correctShopItem.name,
                            baseId
                        });
                        totalItems++;
                        userHasRepairs = true;
                    }
                }
            });

            if (userHasRepairs) totalUsers++;
        }

        return {
            itemsToRepair,
            totalUsers,
            totalItems
        };

    } catch (error) {
        console.error('Error previewing repairs:', error);
        return {
            itemsToRepair: [],
            totalUsers: 0,
            totalItems: 0
        };
    }
};