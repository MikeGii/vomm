// src/services/ShopStockService.ts - COMPLETE UPDATED VERSION
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    getDocs,
    Timestamp
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { ShopStock } from '../types/shop';
import { ALL_SHOP_ITEMS } from '../data/shop';

// Enhanced ShopStock interface to track stock source
interface EnhancedShopStock extends ShopStock {
    stockSource?: 'auto' | 'player_sold'; // Track how stock was added
    playerSoldStock?: number; // Track how much was sold by players
}

/**
 * Initialize shop stock for all items if not exists
 */
export const initializeShopStock = async (): Promise<void> => {
    const stockCollection = collection(firestore, 'shopStock');
    const stockSnapshot = await getDocs(stockCollection);

    // If stock already exists, don't reinitialize
    if (!stockSnapshot.empty) {
        return;
    }

    // Initialize stock for all items
    for (const item of ALL_SHOP_ITEMS) {
        const stockRef = doc(firestore, 'shopStock', item.id);
        await setDoc(stockRef, {
            itemId: item.id,
            currentStock: item.maxStock,
            lastRestockTime: Timestamp.now(),
            stockSource: 'auto',
            playerSoldStock: 0
        });
    }
};

/**
 * Get current stock for a specific item
 */
export const getItemStock = async (itemId: string): Promise<number> => {
    const stockRef = doc(firestore, 'shopStock', itemId);
    const stockDoc = await getDoc(stockRef);

    if (!stockDoc.exists()) {
        // Initialize if doesn't exist
        const item = ALL_SHOP_ITEMS.find(i => i.id === itemId);
        if (item) {
            await setDoc(stockRef, {
                itemId: itemId,
                currentStock: item.maxStock,
                lastRestockTime: Timestamp.now(),
                stockSource: 'auto',
                playerSoldStock: 0
            });
            return item.maxStock;
        }
        return 0;
    }

    const stockData = stockDoc.data() as EnhancedShopStock;
    const item = ALL_SHOP_ITEMS.find(i => i.id === itemId);

    if (!item) return 0;

    // Check if this is a produced item (maxStock = 0)
    const isProducedItem = item.maxStock === 0;

    // Calculate restocked amount
    const restockedAmount = calculateRestockAmount(
        stockData.currentStock,
        stockData.lastRestockTime,
        item.maxStock,
        isProducedItem
    );

    // For produced items, return current stock without limit
    // For basic ingredients, respect maxStock
    return isProducedItem ? restockedAmount : Math.min(restockedAmount, item.maxStock);
};

/**
 * Calculate how much stock should be restored based on time passed
 * Updated to handle produced items vs basic ingredients differently
 */
const calculateRestockAmount = (
    currentStock: number,
    lastRestockTime: any,
    maxStock: number,
    isProducedItem: boolean = false
): number => {
    // Produced items (maxStock = 0) don't auto-restock
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

    // Calculate hours passed
    const hoursPassed = (now.getTime() - lastRestock.getTime()) / (1000 * 60 * 60);

    // 5% of max stock per hour (only for basic ingredients with maxStock > 0)
    const restockPerHour = maxStock * 0.05;
    const totalRestock = Math.floor(hoursPassed * restockPerHour);

    return Math.min(currentStock + totalRestock, maxStock);
};

/**
 * Calculate dynamic price based on stock level
 * Updated to handle produced items vs basic ingredients differently
 */
export const calculateDynamicPrice = (basePrice: number, currentStock: number, maxStock: number): number => {
    // For produced items (maxStock = 0), use scarcity-based pricing
    if (maxStock === 0) {
        if (currentStock === 0) return basePrice * 3; // 300% when out of stock
        if (currentStock <= 5) return basePrice * 2; // 200% when very low
        if (currentStock <= 20) return basePrice * 1.5; // 150% when low
        return basePrice; // Normal price when adequate stock
    }

    // Original logic for basic ingredients (maxStock > 0)
    const stockPercentage = (currentStock / maxStock) * 100;

    // If stock is below 80%, increase price
    if (stockPercentage < 80) {
        const percentBelow80 = 80 - stockPercentage;
        const priceMultiplier = 1 + (percentBelow80 * 0.05); // 5% increase per percent below 80%
        return Math.round(basePrice * priceMultiplier * 100) / 100; // Round to 2 decimals
    }

    return basePrice;
};

/**
 * Update stock after purchase
 * Works for both basic ingredients and produced items
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

    // Check if this is a produced item
    const isProducedItem = item.maxStock === 0;

    // Calculate current stock with restock (for basic ingredients only)
    const currentStock = calculateRestockAmount(
        stockData.currentStock,
        stockData.lastRestockTime,
        item.maxStock,
        isProducedItem
    );

    // Check if enough stock
    if (currentStock < quantity) {
        throw new Error('Ei ole piisavalt laos');
    }

    // Update stock
    await updateDoc(stockRef, {
        currentStock: currentStock - quantity,
        lastRestockTime: Timestamp.now()
    });
};

/**
 * Update stock after selling items back to shop
 * FOR PRODUCED ITEMS ONLY (maxStock = 0)
 */
export const updateStockAfterSell = async (itemId: string, quantity: number = 1): Promise<void> => {
    const stockRef = doc(firestore, 'shopStock', itemId);
    const stockDoc = await getDoc(stockRef);
    const item = ALL_SHOP_ITEMS.find(i => i.id === itemId);

    if (!item) {
        throw new Error('Item not found');
    }

    // Only allow selling produced items (maxStock = 0)
    if (item.maxStock !== 0) {
        throw new Error('Only produced items can be sold back');
    }

    if (!stockDoc.exists()) {
        // Initialize stock for produced item
        await setDoc(stockRef, {
            itemId: itemId,
            currentStock: quantity,
            lastRestockTime: Timestamp.now(),
            stockSource: 'player_sold',
            playerSoldStock: quantity
        });
        return;
    }

    const stockData = stockDoc.data() as EnhancedShopStock;

    // For produced items, just add the quantity (no max limit)
    const newStock = stockData.currentStock + quantity;
    const newPlayerSoldStock = (stockData.playerSoldStock || 0) + quantity;

    await updateDoc(stockRef, {
        currentStock: newStock,
        lastRestockTime: Timestamp.now(),
        stockSource: 'player_sold',
        playerSoldStock: newPlayerSoldStock
    });
};

/**
 * Get all items with current stock and prices
 * Updated to work with both item types
 */
export const getAllItemsWithStock = async (): Promise<Array<{
    item: any;
    currentStock: number;
    dynamicPrice: number;
}>> => {
    const itemsWithStock = [];

    for (const item of ALL_SHOP_ITEMS) {
        const currentStock = await getItemStock(item.id);
        const dynamicPrice = calculateDynamicPrice(item.basePrice, currentStock, item.maxStock);

        itemsWithStock.push({
            item: {
                ...item,
                price: dynamicPrice // Override price with dynamic price
            },
            currentStock,
            dynamicPrice
        });
    }

    return itemsWithStock;
};