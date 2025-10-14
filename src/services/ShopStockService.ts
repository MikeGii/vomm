// src/services/ShopStockService.ts - UPDATED FOR HYBRID SYSTEM
import { cacheManager } from "./CacheManager";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    getDocs
} from 'firebase/firestore';
import {
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { ALL_SHOP_ITEMS } from '../data/shop';
import { getCurrentServer } from '../utils/serverUtils';

// Enhanced ShopStock interface to track stock source
interface EnhancedShopStock {
    itemId: string;
    currentStock: number;
    lastRestockTime: Timestamp | Date;
    stockSource?: 'auto' | 'player_sold';
    playerSoldStock?: number;
}

/**
 * Get server-specific stock document ID
 */
export const getStockDocumentId = (itemId: string): string => {
    const currentServer = getCurrentServer();
    // Beta server uses original ID (backwards compatibility)
    if (currentServer === 'beta') {
        return itemId;
    }
    // Other servers use suffix
    return `${itemId}_${currentServer}`;
};

/**
 * Check if item is player-craftable (has unlimited stock from players)
 */
const isPlayerCraftableItem = (item: any): boolean => {
    return item.maxStock === 0;
};

/**
 * Initialize shop stock ONLY for player-craftable items
 */
export const initializeShopStock = async (): Promise<void> => {
    const stockCollection = collection(firestore, 'shopStock');
    const stockSnapshot = await getDocs(stockCollection);

    // Only track player-craftable items in stock system
    const playerCraftableItems = ALL_SHOP_ITEMS.filter(isPlayerCraftableItem);

    if (!stockSnapshot.empty) {
        // Populate cache using CacheManager (only for existing player-craftable items)
        stockSnapshot.forEach(doc => {
            const data = doc.data() as EnhancedShopStock;
            const item = ALL_SHOP_ITEMS.find(i => i.id === data.itemId);
            if (item && isPlayerCraftableItem(item)) {
                cacheManager.set(`shop_stock_${data.itemId}`, data);
            }
        });
        return;
    }

    // Initialize stock ONLY for player-craftable items
    const batch = writeBatch(firestore);

    for (const item of playerCraftableItems) {
        const stockRef = doc(firestore, 'shopStock', getStockDocumentId(item.id));
        const stockData: EnhancedShopStock = {
            itemId: item.id,
            currentStock: 0, // Start with 0 stock for player-crafted items
            lastRestockTime: Timestamp.now(),
            stockSource: 'player_sold',
            playerSoldStock: 0
        };

        batch.set(stockRef, stockData);
        cacheManager.set(`shop_stock_${item.id}`, stockData);
    }

    await batch.commit();
};

/**
 * Calculate static price - no more dynamic pricing
 */
export const calculateStaticPrice = (item: any): number => {
    // Always return base price for money items
    if (item.currency === 'money') {
        return item.basePrice;
    }

    // Always return base pollid price for VIP items
    if (item.currency === 'pollid') {
        return item.basePollidPrice || item.pollidPrice || 0;
    }

    return item.basePrice;
};

/**
 * Update stock after selling player-crafted items back to shop
 */
export const updateStockAfterSell = async (itemId: string, quantity: number = 1): Promise<void> => {
    const item = ALL_SHOP_ITEMS.find(i => i.id === itemId);

    if (!item) {
        throw new Error('Item not found');
    }

    // IMPORTANT: Only player-craftable items can be sold back
    if (!isPlayerCraftableItem(item)) {
        throw new Error('Ainult valmistatud tooteid saab tagasi müüa');
    }

    const stockRef = doc(firestore, 'shopStock', getStockDocumentId(itemId));
    const stockDoc = await getDoc(stockRef);

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

    // Clear caches
    cacheManager.clearByPattern(`shop_stock_${itemId}`);
    cacheManager.clearByPattern('shop_all_items_stock');
};

/**
 * Get all items with stock info - SIMPLIFIED FOR HYBRID SYSTEM
 */
export const getAllItemsWithStock = async (): Promise<Array<{
    item: any;
    currentStock: number;
    staticPrice: number;
    hasUnlimitedStock: boolean;
}>> => {
    const cacheKey = 'shop_all_items_stock';

    // Check cache
    const cached = cacheManager.get<Array<{
        item: any;
        currentStock: number;
        staticPrice: number;
        hasUnlimitedStock: boolean;
    }>>(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        // Only fetch stock for player-craftable items
        const stockCollection = collection(firestore, 'shopStock');
        const stockSnapshot = await getDocs(stockCollection);
        const stockMap = new Map<string, EnhancedShopStock>();

        const currentServer = getCurrentServer();
        stockSnapshot.forEach(doc => {
            const docId = doc.id;
            // Filter by current server
            if (currentServer === 'beta' && docId.includes('_')) return;
            if (currentServer !== 'beta' && !docId.endsWith(`_${currentServer}`)) return;

            const data = doc.data() as EnhancedShopStock;
            stockMap.set(data.itemId, data);
        });

        const itemsWithStock = ALL_SHOP_ITEMS.map(item => {
            const isPlayerCraftable = isPlayerCraftableItem(item);
            let currentStock: number;
            let hasUnlimitedStock: boolean;

            if (isPlayerCraftable) {
                // Player-craftable items: show actual stock from database
                const stockData = stockMap.get(item.id);
                currentStock = stockData ? stockData.currentStock : 0;
                hasUnlimitedStock = false;
            } else {
                // Basic ingredients and VIP items: unlimited stock
                currentStock = 999999; // Show as unlimited
                hasUnlimitedStock = true;
            }

            const staticPrice = calculateStaticPrice(item);

            return {
                item: { ...item, price: staticPrice },
                currentStock,
                staticPrice,
                hasUnlimitedStock
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
 * Force refresh all caches
 */
export const clearAllStockCaches = () => {
    cacheManager.clearByPattern('shop');
    console.log('Shop caches cleared');
};
