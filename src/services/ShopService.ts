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
        category: shopItem.category === 'crafting' ? 'crafting' :
            (shopItem.category === 'protection' ? 'equipment' :
                (shopItem.category === 'trainingBooster' || shopItem.category === 'medical' || shopItem.category === 'vip') ? 'consumable' : 'misc'),
        quantity: 1,
        shopPrice: shopItem.currency === 'pollid' ? (shopItem.pollidPrice || 0) : shopItem.price,
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
 * Purchase item from shop WITH STOCK CHECK AND CURRENCY SUPPORT
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

        // Determine currency and calculate cost
        const isPollidPurchase = shopItem.currency === 'pollid';
        let totalCost: number;
        let currentBalance: number;

        if (isPollidPurchase) {
            // Pollid purchase - use fixed price (no dynamic pricing for VIP items)
            totalCost = (shopItem.pollidPrice || 0) * quantity;
            currentBalance = playerStats.pollid || 0;
        } else {
            // Money purchase - use dynamic pricing
            const dynamicPrice = calculateDynamicPrice(shopItem.basePrice, currentStock, shopItem.maxStock);
            totalCost = dynamicPrice * quantity;
            currentBalance = playerStats.money || 0;
        }

        // Check if player has enough currency
        if (currentBalance < totalCost) {
            const currencyName = isPollidPurchase ? 'Pollide' : 'raha';
            const currencySymbol = isPollidPurchase ? '💎' : '€';
            const costDisplay = isPollidPurchase ? `${totalCost}` : `${totalCost.toFixed(2)}`;
            const balanceDisplay = isPollidPurchase ? `${currentBalance}` : `${currentBalance.toFixed(2)}`;

            return {
                success: false,
                message: `Ebapiisav ${currencyName}. Vaja: ${currencySymbol}${costDisplay}, Sul on: ${currencySymbol}${balanceDisplay}`,
                failureReason: isPollidPurchase ? 'insufficient_pollid' : 'insufficient_funds'
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
                shopPrice: isPollidPurchase ? (shopItem.pollidPrice || 0) : totalCost / quantity
            };
        } else {
            // Item doesn't exist - create new inventory item
            const newItem = shopItemToInventoryItem(shopItem);
            newItem.quantity = quantity;
            newItem.shopPrice = isPollidPurchase ? (shopItem.pollidPrice || 0) : totalCost / quantity;
            newItem.id = `${shopItem.id}_${Date.now()}_${Math.random()}`;
            updatedInventory.push(newItem);
        }

        // UPDATE STOCK
        await updateStockAfterPurchase(itemId, quantity);

        // Prepare update object based on currency
        const updateData: any = {
            inventory: updatedInventory,
            lastModified: Timestamp.now()
        };

        if (isPollidPurchase) {
            updateData.pollid = currentBalance - totalCost;
        } else {
            updateData.money = currentBalance - totalCost;
        }

        // Update player stats
        await updateDoc(playerRef, updateData);

        const result: PurchaseResult = {
            success: true,
            message: `Ostsid: ${shopItem.name}${quantity > 1 ? ` x${quantity}` : ''}`,
        };

        // Add appropriate balance to result
        if (isPollidPurchase) {
            result.newPollidBalance = currentBalance - totalCost;
        } else {
            result.newBalance = currentBalance - totalCost;
        }

        return result;

    } catch (error: any) {
        console.error('Purchase error:', error);
        return {
            success: false,
            message: error.message || 'Ostu sooritamine ebaõnnestus'
        };
    }
};