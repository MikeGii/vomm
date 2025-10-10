// src/services/GlobalUserService.ts - NEW FILE
import {doc, getDoc, updateDoc, increment, setDoc, Timestamp} from 'firebase/firestore';
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
     * Initialize global user data for new players
     */
    static async initializeGlobalUser(userId: string): Promise<void> {
        const userRef = doc(firestore, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            // Create initial global data for new user
            await setDoc(userRef, {
                pollid: 0,
                isVip: false,
                vipExpiresAt: null,
                createdAt: Timestamp.now(),
                lastModified: Timestamp.now()
            });
        }
    }

    /**
     * Update user's pollid amount
     */
    static async updatePollid(userId: string, amount: number): Promise<number> {
        await this.ensureUserExists(userId);

        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, {
            pollid: increment(amount)
        });

        const updated = await getDoc(userRef);
        return updated.data()?.pollid || 0;
    }

    /**
     * Ensure user document exists before operations
     */
    static async ensureUserExists(userId: string): Promise<void> {
        const userRef = doc(firestore, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            await this.initializeGlobalUser(userId);
        }
    }

    /**
     * Set user's pollid to specific amount
     */
    static async setPollid(userId: string, amount: number): Promise<void> {
        await this.ensureUserExists(userId);

        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, {
            pollid: amount
        });
    }

    /**
     * Update VIP status
     */
    static async setVipStatus(userId: string, isVip: boolean): Promise<void> {
        await this.ensureUserExists(userId);

        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, {
            isVip: isVip
        });
    }
}