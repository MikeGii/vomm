// src/services/WorkBoosterService.ts
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats, InventoryItem } from '../types';

export interface WorkBoosterResult {
    success: boolean;
    message: string;
    newEndTime?: Date;
}

/**
 * Apply work time booster to active work
 */
export const applyWorkTimeBooster = async (
    userId: string,
    boosterItemId: string
): Promise<WorkBoosterResult> => {
    try {
        const statsRef = doc(firestore, 'playerStats', userId);
        const statsDoc = await getDoc(statsRef);

        if (!statsDoc.exists()) {
            return {
                success: false,
                message: 'Mängija andmeid ei leitud'
            };
        }

        const stats = statsDoc.data() as PlayerStats;

        // Check if player has active work
        if (!stats.activeWork || stats.activeWork.status !== 'in_progress') {
            return {
                success: false,
                message: 'Sul pole aktiivset tööülesannet!'
            };
        }

        // Find the booster item in inventory
        const inventory = stats.inventory || [];
        const boosterItem = inventory.find(item =>
            item.id === boosterItemId &&
            item.consumableEffect?.type === 'workTimeReduction'
        );

        if (!boosterItem) {
            return {
                success: false,
                message: 'Boosterit ei leitud inventarist!'
            };
        }

        // Calculate new end time
        const currentEndTime = stats.activeWork.endsAt instanceof Timestamp
            ? stats.activeWork.endsAt.toDate()
            : new Date(stats.activeWork.endsAt);

        const currentStartTime = stats.activeWork.startedAt instanceof Timestamp
            ? stats.activeWork.startedAt.toDate()
            : new Date(stats.activeWork.startedAt);

        const totalWorkDuration = currentEndTime.getTime() - currentStartTime.getTime();
        const reductionPercentage = boosterItem.consumableEffect!.value / 100;
        const timeReduction = totalWorkDuration * reductionPercentage;

        const newEndTime = new Date(currentEndTime.getTime() - timeReduction);
        const now = new Date();

        // If new end time is in the past, set it to current time + 1 minute
        const finalEndTime = newEndTime <= now ? new Date(now.getTime() + 60000) : newEndTime;

        // Update active work end time
        const updatedActiveWork = {
            ...stats.activeWork,
            endsAt: Timestamp.fromDate(finalEndTime)
        };

        // Remove the booster from inventory (manual filtering - works fine)
        const updatedInventory = inventory.filter(item => item.id !== boosterItemId);

        // Update player stats
        await updateDoc(statsRef, {
            activeWork: updatedActiveWork,
            inventory: updatedInventory
        });

        const timeSavedHours = Math.floor(timeReduction / (1000 * 60 * 60));
        const timeSavedMinutes = Math.floor((timeReduction % (1000 * 60 * 60)) / (1000 * 60));

        return {
            success: true,
            message: `Tööaja booster rakendatud! Säästetud aeg: ${timeSavedHours}h ${timeSavedMinutes}min`,
            newEndTime: finalEndTime
        };

    } catch (error) {
        console.error('Error applying work booster:', error);
        return {
            success: false,
            message: 'Viga boosteri rakendamisel'
        };
    }
};

/**
 * Get work time boosters from inventory
 */
export const getWorkTimeBoosters = (inventory: InventoryItem[]): InventoryItem[] => {
    return inventory.filter(item =>
        item.consumableEffect?.type === 'workTimeReduction'
    );
};