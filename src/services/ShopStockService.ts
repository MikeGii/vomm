// src/services/ShopStockService.ts - NEW FILE
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
            lastRestockTime: Timestamp.now()
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
                lastRestockTime: Timestamp.now()
            });
            return item.maxStock;
        }
        return 0;
    }

    const stockData = stockDoc.data() as ShopStock;

    // Calculate restocked amount
    const restockedAmount = calculateRestockAmount(
        stockData.currentStock,
        stockData.lastRestockTime,
        ALL_SHOP_ITEMS.find(i => i.id === itemId)?.maxStock || 0
    );

    return Math.min(restockedAmount, ALL_SHOP_ITEMS.find(i => i.id === itemId)?.maxStock || 0);
};

/**
 * Calculate how much stock should be restored based on time passed
 */
const calculateRestockAmount = (
    currentStock: number,
    lastRestockTime: any,
    maxStock: number
): number => {
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

    // 5% of max stock per hour
    const restockPerHour = maxStock * 0.05;
    const totalRestock = Math.floor(hoursPassed * restockPerHour);

    return Math.min(currentStock + totalRestock, maxStock);
};

/**
 * Calculate dynamic price based on stock level
 */
export const calculateDynamicPrice = (basePrice: number, currentStock: number, maxStock: number): number => {
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
 */
export const updateStockAfterPurchase = async (itemId: string, quantity: number = 1): Promise<void> => {
    const stockRef = doc(firestore, 'shopStock', itemId);
    const stockDoc = await getDoc(stockRef);

    if (!stockDoc.exists()) {
        throw new Error('Stock record not found');
    }

    const stockData = stockDoc.data() as ShopStock;
    const item = ALL_SHOP_ITEMS.find(i => i.id === itemId);

    if (!item) {
        throw new Error('Item not found');
    }

    // Calculate current stock with restock
    const currentStock = calculateRestockAmount(
        stockData.currentStock,
        stockData.lastRestockTime,
        item.maxStock
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
 * Get all items with current stock and prices
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