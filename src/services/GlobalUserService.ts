// src/services/GlobalUserService.ts - NEW FILE
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { User } from '../types';

export class GlobalUserService {
    /**
     * Get user's global data (pollid, VIP status)
     */
    static async getGlobalUserData(userId: string): Promise<{ pollid: number; isVip: boolean }> {
        const userRef = doc(firestore, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return { pollid: 0, isVip: false };
        }

        const data = userDoc.data() as User;
        return {
            pollid: data.pollid || 0,
            isVip: data.isVip || false
        };
    }

    /**
     * Update user's pollid amount
     */
    static async updatePollid(userId: string, amount: number): Promise<number> {
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, {
            pollid: increment(amount)
        });

        const updated = await getDoc(userRef);
        return updated.data()?.pollid || 0;
    }

    /**
     * Set user's pollid to specific amount
     */
    static async setPollid(userId: string, amount: number): Promise<void> {
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, {
            pollid: amount
        });
    }

    /**
     * Update VIP status
     */
    static async setVipStatus(userId: string, isVip: boolean): Promise<void> {
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, {
            isVip: isVip
        });
    }
}