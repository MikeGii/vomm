// src/services/AdminShopService.ts - Fixed version
import {
    doc,
    setDoc,
    writeBatch,
    Timestamp
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { ALL_SHOP_ITEMS } from '../data/shop';

/**
 * Optimized bulk restock using batch operations
 */
export const restockAllItems = async (): Promise<{
    restockedCount: number;
    skippedCount: number;
}> => {
    let restockedCount = 0;
    let skippedCount = 0;

    // Process items in chunks to avoid batch size limits (500 operations max)
    const itemsToRestock = ALL_SHOP_ITEMS.filter(item => item.maxStock > 0);
    const chunkSize = 450; // Leave some room for safety

    for (let i = 0; i < itemsToRestock.length; i += chunkSize) {
        const chunk = itemsToRestock.slice(i, i + chunkSize);
        const chunkBatch = writeBatch(firestore);

        for (const item of chunk) {
            const stockRef = doc(firestore, 'shopStock', item.id);
            chunkBatch.set(stockRef, {
                itemId: item.id,
                currentStock: item.maxStock,
                lastRestockTime: Timestamp.now(),
                stockSource: 'admin',
                playerSoldStock: 0
            }, { merge: true });
            restockedCount++;
        }

        await chunkBatch.commit();
    }

    // Count skipped items
    skippedCount = ALL_SHOP_ITEMS.length - restockedCount;

    return { restockedCount, skippedCount };
};

/**
 * Single item update (keeping for individual edits)
 */
export const updateShopItemStock = async (
    itemId: string,
    newStock: number
): Promise<void> => {
    if (newStock < 0) {
        throw new Error('Ladu ei saa olla negatiivne');
    }

    const stockRef = doc(firestore, 'shopStock', itemId);
    await setDoc(stockRef, {
        itemId: itemId,
        currentStock: newStock,
        lastRestockTime: Timestamp.now(),
        stockSource: 'admin',
        playerSoldStock: 0
    }, { merge: true });
};

export const setShopItemMaxStock = async (
    itemId: string,
    newMaxStock: number
): Promise<void> => {
    if (newMaxStock < 0) {
        throw new Error('Maksimaalne ladu ei saa olla negatiivne');
    }

    const configRef = doc(firestore, 'shopConfig', itemId);
    await setDoc(configRef, {
        itemId: itemId,
        maxStockOverride: newMaxStock,
        lastModified: Timestamp.now()
    }, { merge: true });
};