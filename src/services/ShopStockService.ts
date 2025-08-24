// src/services/ShopStockService.ts - OPTIMIZED VERSION WITH CACHE
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

// Cache for stock data
const stockCache = new Map<string, {
    data: EnhancedShopStock;
    timestamp: number;
}>();

// Cache for batch stock data (used for getAllItemsWithStock)
let batchStockCache: {
    data: Array<{ item: any; currentStock: number; dynamicPrice: number }>;
    timestamp: number;
} | null = null;

const CACHE_DURATION = 60000; // 1 minute cache
const BATCH_CACHE_DURATION = 30000; // 30 seconds for batch operations

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
        // Populate cache while we're here
        stockSnapshot.forEach(doc => {
            const data = doc.data() as EnhancedShopStock;
            stockCache.set(data.itemId, {
                data,
                timestamp: Date.now()
            });
        });
        return;
    }

    // Initialize stock for all items using batch writes (more efficient)
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

        // Cache it - no changes needed here
        stockCache.set(item.id, {
            data: stockData,
            timestamp: Date.now()
        });
    }

    await batch.commit();
};

/**
 * Get current stock for a specific item - WITH CACHING
 */
export const getItemStock = async (itemId: string): Promise<number> => {
    // Check cache first
    const cached = stockCache.get(itemId);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        const item = ALL_SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return 0;

        const isProducedItem = item.maxStock === 0;
        const restockedAmount = calculateRestockAmount(
            cached.data.currentStock,
            cached.data.lastRestockTime,
            item.maxStock,
            isProducedItem
        );

        return isProducedItem ? restockedAmount : Math.min(restockedAmount, item.maxStock);
    }

    // Cache miss - fetch from database
    const stockRef = doc(firestore, 'shopStock', itemId);
    const stockDoc = await getDoc(stockRef);

    if (!stockDoc.exists()) {
        const item = ALL_SHOP_ITEMS.find(i => i.id === itemId);
        if (item) {
            const newStock = {
                itemId: itemId,
                currentStock: item.maxStock,
                lastRestockTime: Timestamp.now(),
                stockSource: 'auto' as const,
                playerSoldStock: 0
            };
            await setDoc(stockRef, newStock);

            // Cache the new data
            stockCache.set(itemId, {
                data: newStock,
                timestamp: Date.now()
            });

            return item.maxStock;
        }
        return 0;
    }

    const stockData = stockDoc.data() as EnhancedShopStock;

    // Update cache with fresh data
    stockCache.set(itemId, {
        data: stockData,
        timestamp: Date.now()
    });

    const item = ALL_SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return 0;

    const isProducedItem = item.maxStock === 0;
    const restockedAmount = calculateRestockAmount(
        stockData.currentStock,
        stockData.lastRestockTime,
        item.maxStock,
        isProducedItem
    );

    return isProducedItem ? restockedAmount : Math.min(restockedAmount, item.maxStock);
};

/**
 * Calculate how much stock should be restored based on time passed
 */
const calculateRestockAmount = (
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
 * Update stock after purchase - WITH CACHE INVALIDATION
 */
export const updateStockAfterPurchase = async (itemId: string, quantity: number = 1): Promise<void> => {
    const stockRef = doc(firestore, 'shopStock', itemId);
    const stockDoc = await getDoc(stockRef);

    if (!stockDoc.exists()) {
        throw new Error('Stock record not found');
    }

    const stockData = stockDoc.data() as EnhancedShopStock;
    const item = ALL_SHOP_ITEMS.find(i => i.id === itemId);

    if (!item) {
        throw new Error('Item not found');
    }

    const isProducedItem = item.maxStock === 0;
    const currentStock = calculateRestockAmount(
        stockData.currentStock,
        stockData.lastRestockTime,
        item.maxStock,
        isProducedItem
    );

    if (currentStock < quantity) {
        throw new Error('Ei ole piisavalt laos');
    }

    await updateDoc(stockRef, {
        currentStock: currentStock - quantity,
        lastRestockTime: Timestamp.now()
    });

    // Clear cache for this item and batch cache
    stockCache.delete(itemId);
    batchStockCache = null;
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

    // Clear cache for this item and batch cache
    stockCache.delete(itemId);
    batchStockCache = null;
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
    // Check batch cache first
    if (batchStockCache && (Date.now() - batchStockCache.timestamp < BATCH_CACHE_DURATION)) {
        return batchStockCache.data;
    }

    try {
        // Fetch ALL stock documents in ONE query (1 read operation for ALL items!)
        const stockCollection = collection(firestore, 'shopStock');
        const stockSnapshot = await getDocs(stockCollection);

        // Create a map of stock data
        const stockMap = new Map<string, EnhancedShopStock>();

        stockSnapshot.forEach(doc => {
            const data = doc.data() as EnhancedShopStock;
            stockMap.set(data.itemId, data);

            // Update individual cache while we're at it
            stockCache.set(data.itemId, {
                data,
                timestamp: Date.now()
            });
        });

        // Process all items with the fetched stock data
        const itemsWithStock = ALL_SHOP_ITEMS.map(item => {
            const stockData = stockMap.get(item.id);

            let currentStock: number;
            if (!stockData) {
                // Item not in stock collection yet (shouldn't happen after initialization)
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
                item: {
                    ...item,
                    price: dynamicPrice
                },
                currentStock,
                dynamicPrice
            };
        });

        // Cache the batch result
        batchStockCache = {
            data: itemsWithStock,
            timestamp: Date.now()
        };

        return itemsWithStock;

    } catch (error) {
        console.error('Error getting items with stock:', error);

        // On error, try to use cached data if available
        if (batchStockCache) {
            return batchStockCache.data;
        }

        return [];
    }
};

/**
 * Force refresh all caches (useful after major updates)
 */
export const clearAllStockCaches = () => {
    stockCache.clear();
    batchStockCache = null;
};

/**
 * Manually refresh stock cache for specific item
 */
export const refreshItemStock = async (itemId: string): Promise<void> => {
    stockCache.delete(itemId);
    batchStockCache = null;
    await getItemStock(itemId); // This will re-populate the cache
};