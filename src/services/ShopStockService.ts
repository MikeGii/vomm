// src/services/ShopStockService.ts - OPTIMIZED VERSION WITH CACHE
import { cacheManager} from "./CacheManager";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    getDocs,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { ALL_SHOP_ITEMS } from '../data/shop';

// Enhanced ShopStock interface to track stock source
interface EnhancedShopStock {
    itemId: string;
    currentStock: number;
    lastRestockTime: Timestamp | Date;
    stockSource?: 'auto' | 'player_sold';
    playerSoldStock?: number;
}

/**
 * Initialize shop stock for all items if not exists
 */
export const initializeShopStock = async (): Promise<void> => {
    const stockCollection = collection(firestore, 'shopStock');
    const stockSnapshot = await getDocs(stockCollection);

    if (!stockSnapshot.empty) {
        // Populate cache using CacheManager
        stockSnapshot.forEach(doc => {
            const data = doc.data() as EnhancedShopStock;
            cacheManager.set(`shop_stock_${data.itemId}`, data);
        });
        return;
    }

    // Initialize stock for all items using batch writes
    const batch = writeBatch(firestore);

    for (const item of ALL_SHOP_ITEMS) {
        const stockRef = doc(firestore, 'shopStock', item.id);
        const stockData: EnhancedShopStock = {
            itemId: item.id,
            currentStock: item.maxStock,
            lastRestockTime: Timestamp.now(),
            stockSource: 'auto',
            playerSoldStock: 0
        };

        batch.set(stockRef, stockData);

        // Cache using CacheManager
        cacheManager.set(`shop_stock_${item.id}`, stockData);
    }

    await batch.commit();
};

/**
 * Calculate how much stock should be restored based on time passed
 */
export const calculateRestockAmount = (
    currentStock: number,
    lastRestockTime: Timestamp | Date | any,
    maxStock: number,
    isProducedItem: boolean = false
): number => {
    if (isProducedItem || maxStock === 0) {
        return currentStock;
    }

    const now = new Date();
    let lastRestock: Date;

    if (lastRestockTime instanceof Timestamp) {
        lastRestock = lastRestockTime.toDate();
    } else if (lastRestockTime && typeof lastRestockTime === 'object' && 'seconds' in lastRestockTime) {
        lastRestock = new Date(lastRestockTime.seconds * 1000);
    } else {
        lastRestock = new Date(lastRestockTime);
    }

    const hoursPassed = (now.getTime() - lastRestock.getTime()) / (1000 * 60 * 60);
    const restockPerHour = maxStock * 0.15;
    const totalRestock = Math.floor(hoursPassed * restockPerHour);

    return Math.min(currentStock + totalRestock, maxStock);
};

/**
 * Calculate dynamic price based on stock level
 */
export const calculateDynamicPrice = (basePrice: number, currentStock: number, maxStock: number): number => {
    if (maxStock === 0) {
        if (currentStock === 0) return basePrice * 3;
        if (currentStock <= 5) return basePrice * 2;
        if (currentStock <= 20) return basePrice * 1.5;
        return basePrice;
    }

    const stockPercentage = (currentStock / maxStock) * 100;

    if (stockPercentage < 80) {
        const percentBelow80 = 80 - stockPercentage;
        const priceMultiplier = 1 + (percentBelow80 * 0.05);
        return Math.round(basePrice * priceMultiplier * 100) / 100;
    }

    return basePrice;
};

/**
 * Update stock after selling items back to shop - WITH CACHE INVALIDATION
 */
export const updateStockAfterSell = async (itemId: string, quantity: number = 1): Promise<void> => {
    const stockRef = doc(firestore, 'shopStock', itemId);
    const stockDoc = await getDoc(stockRef);
    const item = ALL_SHOP_ITEMS.find(i => i.id === itemId);

    if (!item) {
        throw new Error('Item not found');
    }

    if (item.maxStock !== 0) {
        throw new Error('Only produced items can be sold back');
    }

    if (!stockDoc.exists()) {
        await setDoc(stockRef, {
            itemId: itemId,
            currentStock: quantity,
            lastRestockTime: Timestamp.now(),
            stockSource: 'player_sold',
            playerSoldStock: quantity
        });
    } else {
        const stockData = stockDoc.data() as EnhancedShopStock;
        const newStock = stockData.currentStock + quantity;
        const newPlayerSoldStock = (stockData.playerSoldStock || 0) + quantity;

        await updateDoc(stockRef, {
            currentStock: newStock,
            lastRestockTime: Timestamp.now(),
            stockSource: 'player_sold',
            playerSoldStock: newPlayerSoldStock
        });
    }

    cacheManager.clearByPattern(`shop_stock_${itemId}`);
    cacheManager.clearByPattern('shop_all_items_stock');
};

/**
 * Get all items with current stock and prices - MASSIVELY OPTIMIZED
 * This is the main optimization - fetch ALL documents at once instead of one-by-one
 */
export const getAllItemsWithStock = async (): Promise<Array<{
    item: any;
    currentStock: number;
    dynamicPrice: number;
}>> => {
    const cacheKey = 'shop_all_items_stock';

    // Check cache
    const cached = cacheManager.get<Array<{ item: any; currentStock: number; dynamicPrice: number }>>(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const stockCollection = collection(firestore, 'shopStock');
        const stockSnapshot = await getDocs(stockCollection);
        const stockMap = new Map<string, EnhancedShopStock>();

        stockSnapshot.forEach(doc => {
            const data = doc.data() as EnhancedShopStock;
            stockMap.set(data.itemId, data);

            // Cache individual items too
            cacheManager.set(`shop_stock_${data.itemId}`, data);
        });

        const itemsWithStock = ALL_SHOP_ITEMS.map(item => {
            const stockData = stockMap.get(item.id);
            let currentStock: number;

            if (!stockData) {
                currentStock = item.maxStock;
            } else {
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

            const dynamicPrice = calculateDynamicPrice(
                item.basePrice,
                currentStock,
                item.maxStock
            );

            return {
                item: { ...item, price: dynamicPrice },
                currentStock,
                dynamicPrice
            };
        });

        // Cache the results
        cacheManager.set(cacheKey, itemsWithStock);
        return itemsWithStock;

    } catch (error) {
        console.error('Error getting items with stock:', error);
        return [];
    }
};

/**
 * Force refresh all caches (useful after major updates)
 */
export const clearAllStockCaches = () => {
    cacheManager.clearByPattern('shop');
    console.log('Shop caches cleared');
};