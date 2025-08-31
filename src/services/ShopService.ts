// src/services/ShopService.ts - UPDATED FOR HYBRID SYSTEM
import {
    doc,
    Timestamp,
    runTransaction
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { ShopItem, PurchaseResult } from '../types/shop';
import { InventoryItem } from '../types';
import { PlayerStats } from '../types';
import { ALL_SHOP_ITEMS } from '../data/shop';
import { createTimestampedId } from '../utils/inventoryUtils';
import { calculateStaticPrice } from "./ShopStockService";
import { cacheManager } from "./CacheManager";

/**
 * Get shop item by ID
 */
export const getShopItemById = (itemId: string): ShopItem | undefined => {
    return ALL_SHOP_ITEMS.find(item => item.id === itemId);
};

/**
 * Check if item is player-craftable (maxStock = 0)
 */
const isPlayerCraftableItem = (item: ShopItem): boolean => {
    return item.maxStock === 0;
};

/**
 * Convert shop item to inventory item
 */
const shopItemToInventoryItem = (shopItem: ShopItem): InventoryItem => {
    const staticPrice = calculateStaticPrice(shopItem);

    const inventoryItem: InventoryItem = {
        id: createTimestampedId(shopItem.id),
        name: shopItem.name,
        description: shopItem.description,
        category: shopItem.category === 'crafting' ? 'crafting' :
            (shopItem.category === 'protection' ? 'equipment' :
                (shopItem.category === 'workshop' ? 'equipment' : // Added workshop category
                    (shopItem.category === 'trainingBooster' || shopItem.category === 'medical' || shopItem.category === 'vip') ? 'consumable' : 'misc')),
        quantity: 1,
        shopPrice: shopItem.currency === 'pollid' ? staticPrice : staticPrice,
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

    // ADD THIS MISSING SECTION FOR WORKSHOP DEVICES:
    if (shopItem.workshopStats) {
        inventoryItem.workshopStats = shopItem.workshopStats;
    }

    // Add consumable effect for training boosters
    if (shopItem.consumableEffect) {
        inventoryItem.consumableEffect = shopItem.consumableEffect;
    }

    return inventoryItem;
};

/**
 * Purchase item from shop - UPDATED FOR HYBRID SYSTEM
 */
export const purchaseItem = async (
    userId: string,
    itemId: string,
    quantity: number = 1
): Promise<PurchaseResult> => {
    try {
        // Get shop item definition first (outside transaction)
        const shopItem = getShopItemById(itemId);
        if (!shopItem) {
            return {
                success: false,
                message: 'Ese ei ole saadaval',
                failureReason: 'out_of_stock'
            };
        }

        const isPlayerCraftable = isPlayerCraftableItem(shopItem);

        // Use atomic transaction to prevent race conditions
        return await runTransaction(firestore, async (transaction) => {
            // Get references
            const playerRef = doc(firestore, 'playerStats', userId);
            let stockRef = null;

            // Only check stock for player-craftable items
            if (isPlayerCraftable) {
                stockRef = doc(firestore, 'shopStock', itemId);
            }

            // Read documents within transaction
            const playerDoc = await transaction.get(playerRef);
            const stockDoc = stockRef ? await transaction.get(stockRef) : null;

            // Validate player exists
            if (!playerDoc.exists()) {
                throw new Error('Mängija andmed ei ole saadaval');
            }

            const playerStats = playerDoc.data() as PlayerStats;

            // STOCK CHECK - only for player-craftable items
            let currentStock = 999999; // Default to unlimited for basic ingredients

            if (isPlayerCraftable) {
                if (stockDoc && stockDoc.exists()) {
                    const stockData = stockDoc.data();
                    currentStock = stockData.currentStock || 0;
                } else {
                    currentStock = 0; // Player-craftable items start with 0 stock
                }

                // Check if enough stock for player-craftable items
                if (currentStock < quantity) {
                    throw new Error(`Laos pole piisavalt! Saadaval: ${currentStock}`);
                }
            }

            // Calculate cost using static pricing
            const isPollidPurchase = shopItem.currency === 'pollid';
            let totalCost: number;
            let currentBalance: number;

            if (isPollidPurchase) {
                totalCost = (shopItem.basePollidPrice || shopItem.pollidPrice || 0) * quantity;
                currentBalance = playerStats.pollid || 0;
            } else {
                totalCost = shopItem.basePrice * quantity;
                currentBalance = playerStats.money || 0;
            }

            // Check balance
            if (currentBalance < totalCost) {
                const currencyName = isPollidPurchase ? 'polle' : 'raha';
                throw new Error(`Ebapiisav ${currencyName}. Vaja: ${totalCost}, Sul on: ${currentBalance}`);
            }

            // UPDATE STOCK - only for player-craftable items
            if (isPlayerCraftable && stockRef) {
                if (stockDoc && stockDoc.exists()) {
                    const stockData = stockDoc.data();
                    transaction.update(stockRef, {
                        currentStock: stockData.currentStock - quantity,
                        lastRestockTime: Timestamp.now()
                    });
                } else {
                    // This shouldn't happen, but handle gracefully
                    throw new Error('Stock data not found for player-craftable item');
                }
            }

            // Update player inventory
            const currentInventory = playerStats.inventory || [];
            let updatedInventory = [...currentInventory];

            const existingItemIndex = updatedInventory.findIndex(
                (invItem: InventoryItem) =>
                    invItem.name === shopItem.name && !invItem.equipped
            );

            if (existingItemIndex !== -1) {
                updatedInventory[existingItemIndex] = {
                    ...updatedInventory[existingItemIndex],
                    quantity: updatedInventory[existingItemIndex].quantity + quantity,
                    shopPrice: totalCost / quantity
                };
            } else {
                const newItem = shopItemToInventoryItem(shopItem);
                newItem.quantity = quantity;
                newItem.shopPrice = totalCost / quantity;
                newItem.id = createTimestampedId(shopItem.id);
                updatedInventory.push(newItem);
            }

            // Update player stats
            const updateData: any = {
                inventory: updatedInventory,
                lastModified: Timestamp.now()
            };

            if (isPollidPurchase) {
                updateData.pollid = currentBalance - totalCost;
            } else {
                updateData.money = currentBalance - totalCost;
            }

            transaction.update(playerRef, updateData);

            // Clear caches after successful transaction
            if (isPlayerCraftable) {
                cacheManager.clearByPattern(`shop_stock_${itemId}`);
            }
            cacheManager.clearByPattern('shop_all_items_stock');

            // Return success result
            const result: PurchaseResult = {
                success: true,
                message: `Ostsid: ${shopItem.name}${quantity > 1 ? ` x${quantity}` : ''}`,
            };

            if (isPollidPurchase) {
                result.newPollidBalance = currentBalance - totalCost;
            } else {
                result.newBalance = currentBalance - totalCost;
            }

            return result;
        });

    } catch (error: any) {
        console.error('Purchase error:', error);
        return {
            success: false,
            message: error.message || 'Ostu sooritamine ebaõnnestus'
        };
    }
};

/**
 * DEPRECATED - keeping for backward compatibility
 */
export const calculateDynamicPrice = (basePrice: number, currentStock: number, maxStock: number): number => {
    console.warn('calculateDynamicPrice is deprecated in ShopService - use calculateStaticPrice instead');
    return basePrice;
};