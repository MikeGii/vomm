// src/services/ShopService.ts - Fixed version
import {
    doc,
    getDoc,
    updateDoc,
    Timestamp
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { ShopItem, PurchaseResult } from '../types/shop';
import { InventoryItem } from '../types';
import { PlayerStats } from '../types';
import { ALL_SHOP_ITEMS } from '../data/shop';
import {
    getItemStock,
    calculateDynamicPrice,
    updateStockAfterPurchase
} from "./ShopStockService";

/**
 * Get shop item by ID
 */
export const getShopItemById = (itemId: string): ShopItem | undefined => {
    return ALL_SHOP_ITEMS.find(item => item.id === itemId);
};

/**
 * Convert shop item to inventory item
 */
const shopItemToInventoryItem = (shopItem: ShopItem): InventoryItem => {
    const inventoryItem: InventoryItem = {
        id: `${shopItem.id}_${Date.now()}`,
        name: shopItem.name,
        description: shopItem.description,
        category: shopItem.category === 'protection' ? 'equipment' :
            (shopItem.category === 'trainingBooster' || shopItem.category === 'medical') ? 'consumable' : 'misc',
        quantity: 1,
        shopPrice: shopItem.price,
        equipped: false,
        source: 'shop',
        obtainedAt: new Date()
    };

    if (shopItem.equipmentSlot) {
        inventoryItem.equipmentSlot = shopItem.equipmentSlot;
    }

    if (shopItem.stats) {
        inventoryItem.stats = shopItem.stats;
    }

    // Add consumable effect for training boosters
    if (shopItem.consumableEffect) {
        inventoryItem.consumableEffect = shopItem.consumableEffect;
    }

    return inventoryItem;
};

/**
 * Purchase item from shop WITH STOCK CHECK
 */
export const purchaseItem = async (
    userId: string,
    itemId: string,
    quantity: number = 1
): Promise<PurchaseResult> => {
    try {
        // Get shop item
        const shopItem = getShopItemById(itemId);
        if (!shopItem) {
            return {
                success: false,
                message: 'Ese ei ole saadaval',
                failureReason: 'out_of_stock'
            };
        }

        // CHECK STOCK
        const currentStock = await getItemStock(itemId);
        if (currentStock < quantity) {
            return {
                success: false,
                message: `Laos pole piisavalt! Saadaval: ${currentStock}`,
                failureReason: 'out_of_stock'
            };
        }

        // CALCULATE DYNAMIC PRICE
        const dynamicPrice = calculateDynamicPrice(shopItem.basePrice, currentStock, shopItem.maxStock);
        const totalCost = dynamicPrice * quantity;

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

        // Check if player has enough money
        if (playerStats.money < totalCost) {
            return {
                success: false,
                message: `Ebapiisav raha. Vaja: €${totalCost.toFixed(2)}, Sul on: €${playerStats.money.toFixed(2)}`,
                failureReason: 'insufficient_funds'
            };
        }

        // Get current inventory
        const currentInventory = playerStats.inventory || [];

        // Check if item already exists in inventory - stack ALL items
        let updatedInventory = [...currentInventory];
        const existingItemIndex = updatedInventory.findIndex(
            (invItem: InventoryItem) =>
                invItem.name === shopItem.name &&
                !invItem.equipped // Don't stack with currently equipped items
        );

        if (existingItemIndex !== -1) {
            // Item exists - increase quantity
            updatedInventory[existingItemIndex] = {
                ...updatedInventory[existingItemIndex],
                quantity: updatedInventory[existingItemIndex].quantity + quantity,
                shopPrice: dynamicPrice // Update to latest purchase price
            };
        } else {
            // Item doesn't exist - create new inventory item
            const newItem = shopItemToInventoryItem(shopItem);
            newItem.quantity = quantity; // Set the correct quantity
            newItem.shopPrice = dynamicPrice; // Use dynamic price
            newItem.id = `${shopItem.id}_${Date.now()}_${Math.random()}`; // Ensure unique ID
            updatedInventory.push(newItem);
        }

        // UPDATE STOCK
        await updateStockAfterPurchase(itemId, quantity);

        // Update player stats (decrease money and update inventory)
        await updateDoc(playerRef, {
            money: playerStats.money - totalCost,
            inventory: updatedInventory,
            lastModified: Timestamp.now()
        });

        return {
            success: true,
            message: `Ostsid: ${shopItem.name}${quantity > 1 ? ` x${quantity}` : ''}`,
            newBalance: playerStats.money - totalCost
        };

    } catch (error: any) {
        console.error('Purchase error:', error);
        return {
            success: false,
            message: error.message || 'Ostu sooritamine ebaõnnestus'
        };
    }
};