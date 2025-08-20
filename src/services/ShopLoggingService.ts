// src/services/ShopLoggingService.ts
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp
} from 'firebase/firestore';
import { firestore } from '../config/firebase';

export interface PurchaseLog {
    userId: string;
    username: string;
    itemId: string;
    itemName: string;
    quantity: number;
    totalCost: number;
    currency: 'money' | 'pollid';
    timestamp: Timestamp;
    stockBefore: number;
    stockAfter: number;
}

// Log a purchase
export const logPurchase = async (
    userId: string,
    username: string,
    itemId: string,
    itemName: string,
    quantity: number,
    totalCost: number,
    currency: 'money' | 'pollid',
    stockBefore: number,
    stockAfter: number
): Promise<void> => {
    try {
        await addDoc(collection(firestore, 'purchaseLogs'), {
            userId,
            username,
            itemId,
            itemName,
            quantity,
            totalCost,
            currency,
            timestamp: Timestamp.now(),
            stockBefore,
            stockAfter
        });
    } catch (error) {
        console.error('Failed to log purchase:', error);
    }
};

// Get recent purchases (for admin)
export const getRecentPurchases = async (
    limitCount: number = 100,
    itemIdFilter?: string
): Promise<PurchaseLog[]> => {
    try {
        let q = query(
            collection(firestore, 'purchaseLogs'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        if (itemIdFilter) {
            q = query(
                collection(firestore, 'purchaseLogs'),
                where('itemId', '==', itemIdFilter),
                orderBy('timestamp', 'desc'),
                limit(limitCount)
            );
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as PurchaseLog);
    } catch (error) {
        console.error('Failed to get purchase logs:', error);
        return [];
    }
};

// Get suspicious activity (large purchases)
export const getSuspiciousPurchases = async (
    thresholdQuantity: number = 100
): Promise<PurchaseLog[]> => {
    try {
        const q = query(
            collection(firestore, 'purchaseLogs'),
            where('quantity', '>=', thresholdQuantity),
            orderBy('quantity', 'desc'),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as PurchaseLog);
    } catch (error) {
        console.error('Failed to get suspicious purchases:', error);
        return [];
    }
};