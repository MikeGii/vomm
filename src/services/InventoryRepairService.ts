// src/services/InventoryRepairService.ts
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';
import { CRAFTING_INGREDIENTS } from '../data/shop/craftingIngredients';
import { InventoryItem } from '../types';
import { getBaseIdFromInventoryId } from '../utils/inventoryUtils'; // Import from utils!

// Consolidate items with the same base ID
const consolidateInventory = (inventory: InventoryItem[]): InventoryItem[] => {
    const consolidatedMap = new Map<string, InventoryItem>();

    inventory.forEach(item => {
        if (item.category !== 'crafting') {
            // Non-crafting items stay as-is
            consolidatedMap.set(item.id, item);
            return;
        }

        const baseId = getBaseIdFromInventoryId(item.id);
        const correctShopItem = CRAFTING_INGREDIENTS.find(ingredient => ingredient.id === baseId);

        if (!correctShopItem) {
            // Keep unknown items as-is
            consolidatedMap.set(item.id, item);
            return;
        }

        // Create a key based on the base ID
        const consolidationKey = `consolidated_${baseId}`;

        if (consolidatedMap.has(consolidationKey)) {
            // Add quantity to existing consolidated item
            const existing = consolidatedMap.get(consolidationKey)!;
            existing.quantity += item.quantity;
        } else {
            // Create new consolidated item with correct name/description
            consolidatedMap.set(consolidationKey, {
                ...item,
                id: item.id, // Keep the first item's ID
                name: correctShopItem.name,
                description: correctShopItem.description,
                shopPrice: correctShopItem.basePrice,
                quantity: item.quantity
            });
        }
    });

    return Array.from(consolidatedMap.values());
};

// Repair and consolidate inventory for a single user
export const repairAndConsolidateUserInventory = async (userId: string): Promise<{
    success: boolean;
    itemsConsolidated: number;
    originalItemCount: number;
    newItemCount: number;
    message: string;
}> => {
    try {
        const playerRef = doc(firestore, 'playerStats', userId);
        const playerDoc = await getDocs(collection(firestore, 'playerStats'));

        const userDoc = playerDoc.docs.find(doc => doc.id === userId);
        if (!userDoc) {
            return {
                success: false,
                itemsConsolidated: 0,
                originalItemCount: 0,
                newItemCount: 0,
                message: 'User not found'
            };
        }

        const playerStats = userDoc.data() as PlayerStats;
        const originalInventory = playerStats.inventory || [];
        const consolidatedInventory = consolidateInventory(originalInventory);

        const originalCount = originalInventory.filter(i => i.category === 'crafting').length;
        const newCount = consolidatedInventory.filter(i => i.category === 'crafting').length;
        const itemsConsolidated = originalCount - newCount;

        if (itemsConsolidated > 0 || consolidatedInventory.length !== originalInventory.length) {
            await updateDoc(playerRef, {
                inventory: consolidatedInventory
            });

            console.log(`User ${userId}: Consolidated ${originalCount} crafting items into ${newCount}`);
        }

        return {
            success: true,
            itemsConsolidated,
            originalItemCount: originalCount,
            newItemCount: newCount,
            message: `Consolidated ${itemsConsolidated} duplicate items for user ${userId}`
        };

    } catch (error) {
        console.error(`Error repairing inventory for user ${userId}:`, error);
        return {
            success: false,
            itemsConsolidated: 0,
            originalItemCount: 0,
            newItemCount: 0,
            message: `Error: ${error}`
        };
    }
};

// Repair and consolidate inventories for all users
export const repairAndConsolidateAllInventories = async (): Promise<{
    success: boolean;
    usersProcessed: number;
    totalItemsConsolidated: number;
    details: string[];
}> => {
    try {
        const playersCollection = collection(firestore, 'playerStats');
        const querySnapshot = await getDocs(playersCollection);

        let usersProcessed = 0;
        let totalItemsConsolidated = 0;
        const details: string[] = [];

        const batch = writeBatch(firestore);
        let batchOperations = 0;

        for (const docSnapshot of querySnapshot.docs) {
            const userId = docSnapshot.id;
            const playerStats = docSnapshot.data() as PlayerStats;
            const originalInventory = playerStats.inventory || [];

            const consolidatedInventory = consolidateInventory(originalInventory);

            const originalCraftingCount = originalInventory.filter(i => i.category === 'crafting').length;
            const newCraftingCount = consolidatedInventory.filter(i => i.category === 'crafting').length;
            const consolidated = originalCraftingCount - newCraftingCount;

            if (consolidated > 0) {
                const playerRef = doc(firestore, 'playerStats', userId);
                batch.update(playerRef, { inventory: consolidatedInventory });
                batchOperations++;

                details.push(`User ${userId}: ${originalCraftingCount} items -> ${newCraftingCount} items (consolidated ${consolidated})`);
                totalItemsConsolidated += consolidated;

                // Firestore batch limit is 500 operations
                if (batchOperations >= 400) {
                    await batch.commit();
                    batchOperations = 0;
                }
            }

            usersProcessed++;
        }

        // Commit any remaining batch operations
        if (batchOperations > 0) {
            await batch.commit();
        }

        return {
            success: true,
            usersProcessed,
            totalItemsConsolidated,
            details
        };

    } catch (error) {
        console.error('Error consolidating all inventories:', error);
        return {
            success: false,
            usersProcessed: 0,
            totalItemsConsolidated: 0,
            details: [`Error: ${error}`]
        };
    }
};

// Preview consolidation without making changes
export const previewConsolidation = async (userId?: string): Promise<{
    consolidationPreview: {
        userId: string;
        baseId: string;
        itemName: string;
        currentItems: number;
        willConsolidateTo: number;
        totalQuantity: number;
    }[];
    totalUsers: number;
    totalItemsToConsolidate: number;
}> => {
    try {
        const playersCollection = collection(firestore, 'playerStats');
        const querySnapshot = await getDocs(playersCollection);

        const consolidationPreview: any[] = [];
        let totalUsers = 0;
        let totalItemsToConsolidate = 0;

        for (const docSnapshot of querySnapshot.docs) {
            const docUserId = docSnapshot.id;

            if (userId && docUserId !== userId) continue;

            const playerStats = docSnapshot.data() as PlayerStats;
            const inventory = playerStats.inventory || [];

            // Group items by base ID
            const itemGroups = new Map<string, InventoryItem[]>();

            inventory.forEach(item => {
                if (item.category === 'crafting') {
                    const baseId = getBaseIdFromInventoryId(item.id);
                    if (!itemGroups.has(baseId)) {
                        itemGroups.set(baseId, []);
                    }
                    itemGroups.get(baseId)!.push(item);
                }
            });

            let userHasConsolidation = false;

            itemGroups.forEach((items, baseId) => {
                if (items.length > 1) {
                    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
                    const shopItem = CRAFTING_INGREDIENTS.find(i => i.id === baseId);

                    consolidationPreview.push({
                        userId: docUserId,
                        baseId,
                        itemName: shopItem?.name || items[0].name,
                        currentItems: items.length,
                        willConsolidateTo: 1,
                        totalQuantity
                    });

                    totalItemsToConsolidate += (items.length - 1);
                    userHasConsolidation = true;
                }
            });

            if (userHasConsolidation) totalUsers++;
        }

        return {
            consolidationPreview,
            totalUsers,
            totalItemsToConsolidate
        };

    } catch (error) {
        console.error('Error previewing consolidation:', error);
        return {
            consolidationPreview: [],
            totalUsers: 0,
            totalItemsToConsolidate: 0
        };
    }
};