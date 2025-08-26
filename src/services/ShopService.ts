// src/services/ShopService.ts - Fixed version
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
import {
    calculateDynamicPrice,
    calculateRestockAmount,
} from "./ShopStockService";
import {cacheManager} from "./CacheManager";

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
        id: createTimestampedId(shopItem.id),
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
        // Get shop item definition first (outside transaction)
        const shopItem = getShopItemById(itemId);
        if (!shopItem) {
            return {
                success: false,
                message: 'Ese ei ole saadaval',
                failureReason: 'out_of_stock'
            };
        }

        // Use atomic transaction to prevent race conditions
        return await runTransaction(firestore, async (transaction) => {
            // Get references
            const playerRef = doc(firestore, 'playerStats', userId);
            const stockRef = doc(firestore, 'shopStock', itemId);

            // Read both documents within transaction (creates locks)
            const playerDoc = await transaction.get(playerRef);
            const stockDoc = await transaction.get(stockRef);

            // Validate player exists
            if (!playerDoc.exists()) {
                throw new Error('Mängija andmed ei ole saadaval');
            }

            const playerStats = playerDoc.data() as PlayerStats;

            // Calculate actual current stock
            let currentStock = 0;
            if (stockDoc.exists()) {
                const stockData = stockDoc.data();
                const item = ALL_SHOP_ITEMS.find(i => i.id === itemId);
                if (item) {
                    const isProducedItem = item.maxStock === 0;
                    currentStock = calculateRestockAmount(
                        stockData.currentStock,
                        stockData.lastRestockTime,
                        item.maxStock,
                        isProducedItem
                    );
                    if (!isProducedItem) {
                        currentStock = Math.min(currentStock, item.maxStock);
                    }
                }
            } else {
                // Initialize if doesn't exist
                currentStock = shopItem.maxStock;
            }

            // CHECK STOCK ATOMICALLY
            if (currentStock < quantity) {
                throw new Error(`Laos pole piisavalt! Saadaval: ${currentStock}`);
            }

            // Check currency and balance
            const isPollidPurchase = shopItem.currency === 'pollid';
            let totalCost: number;
            let currentBalance: number;

            if (isPollidPurchase) {
                totalCost = (shopItem.pollidPrice || 0) * quantity;
                currentBalance = playerStats.pollid || 0;
            } else {
                const dynamicPrice = calculateDynamicPrice(shopItem.basePrice, currentStock, shopItem.maxStock);
                totalCost = dynamicPrice * quantity;
                currentBalance = playerStats.money || 0;
            }

            // Check balance
            if (currentBalance < totalCost) {
                const currencyName = isPollidPurchase ? 'polle' : 'raha';
                throw new Error(`Ebapiisav ${currencyName}. Vaja: ${totalCost}, Sul on: ${currentBalance}`);
            }

            // UPDATE STOCK ATOMICALLY
            transaction.set(stockRef, {
                itemId: itemId,
                currentStock: currentStock - quantity,
                lastRestockTime: Timestamp.now(),
                stockSource: 'auto',
                playerSoldStock: stockDoc.exists() ? (stockDoc.data().playerSoldStock || 0) : 0
            }, { merge: true });

            // Update inventory
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
                    shopPrice: isPollidPurchase ? (shopItem.pollidPrice || 0) : totalCost / quantity
                };
            } else {
                const newItem = shopItemToInventoryItem(shopItem);
                newItem.quantity = quantity;
                newItem.shopPrice = isPollidPurchase ? (shopItem.pollidPrice || 0) : totalCost / quantity;
                newItem.id = createTimestampedId(shopItem.id);
                updatedInventory.push(newItem);
            }

            // UPDATE PLAYER ATOMICALLY
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
            cacheManager.clearByPattern(`shop_stock_${itemId}`);
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