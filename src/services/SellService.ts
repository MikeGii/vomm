// src/services/SellService.ts - UPDATED
import {
    doc,
    getDoc,
    updateDoc,
    Timestamp
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';
import { CRAFTING_INGREDIENTS } from '../data/shop/craftingIngredients';
import { updateStockAfterSell } from './ShopStockService';

export interface SellResult {
    success: boolean;
    message: string;
    earnedMoney?: number;
    newBalance?: number;
}

// Helper function to extract base ID properly from inventory items
const getBaseIdFromInventoryId = (inventoryId: string): string => {
    const parts = inventoryId.split('_');

    // For timestamped IDs like "cleaning_solution_1234567890_0.123"
    // Remove the last 2 parts (timestamp and random) but keep the original base ID
    if (parts.length >= 3) {
        const lastPart = parts[parts.length - 1];
        const secondLastPart = parts[parts.length - 2];

        // If last part is decimal and second-to-last is all digits (timestamp)
        if (lastPart.includes('.') && /^\\d+$/.test(secondLastPart)) {
            return parts.slice(0, -2).join('_');
        }
    }

    // Fallback to first part if pattern doesn't match
    return parts[0];
};

/**
 * Sell crafted item back to shop
 */
export const sellCraftedItem = async (
    userId: string,
    inventoryItemId: string,
    quantity: number = 1
): Promise<SellResult> => {
    try {
        // Get player stats
        const playerRef = doc(firestore, 'playerStats', userId);
        const playerDoc = await getDoc(playerRef);

        if (!playerDoc.exists()) {
            return {
                success: false,
                message: 'Mängija andmed ei ole saadaval'
            };
        }

        const playerStats = playerDoc.data() as PlayerStats;
        const currentInventory = playerStats.inventory || [];

        // Find the inventory item
        const inventoryItem = currentInventory.find(item => item.id === inventoryItemId);
        if (!inventoryItem) {
            return {
                success: false,
                message: 'Ese ei ole sinu inventaris'
            };
        }

        // Check if enough quantity
        if (inventoryItem.quantity < quantity) {
            return {
                success: false,
                message: `Sul on ainult ${inventoryItem.quantity} tükki`
            };
        }

        // Get base item ID and shop item details - FIXED
        const baseId = getBaseIdFromInventoryId(inventoryItem.id);
        const shopItem = CRAFTING_INGREDIENTS.find(item => item.id === baseId);

        if (!shopItem) {
            return {
                success: false,
                message: 'Ese ei ole müüdav'
            };
        }

        // IMPORTANT: Check if item can be sold (only produced items with maxStock = 0)
        if (shopItem.maxStock !== 0) {
            return {
                success: false,
                message: 'Ainult valmistatud tooteid saab tagasi müüa'
            };
        }

        // Calculate earnings (basePrice per item)
        const earnedPerItem = shopItem.basePrice;
        const totalEarned = earnedPerItem * quantity;

        // Update inventory
        let updatedInventory = [...currentInventory];
        const itemIndex = updatedInventory.findIndex(item => item.id === inventoryItemId);

        if (updatedInventory[itemIndex].quantity === quantity) {
            // Remove item completely if selling all
            updatedInventory.splice(itemIndex, 1);
        } else {
            // Reduce quantity
            updatedInventory[itemIndex] = {
                ...updatedInventory[itemIndex],
                quantity: updatedInventory[itemIndex].quantity - quantity
            };
        }

        // Update shop stock (add items back to shop) - ONLY FOR PRODUCED ITEMS
        await updateStockAfterSell(baseId, quantity);

        // Update player stats
        const newBalance = (playerStats.money || 0) + totalEarned;
        await updateDoc(playerRef, {
            inventory: updatedInventory,
            money: newBalance,
            lastModified: Timestamp.now()
        });

        return {
            success: true,
            message: `Müüsid ${shopItem.name}${quantity > 1 ? ` x${quantity}` : ''} €${totalEarned.toFixed(2)} eest`,
            earnedMoney: totalEarned,
            newBalance: newBalance
        };

    } catch (error: any) {
        console.error('Sell error:', error);
        return {
            success: false,
            message: error.message || 'Müük ebaõnnestus'
        };
    }
};