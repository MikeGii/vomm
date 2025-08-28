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

        if (stats.activeWork.boosterUsed) {
            return {
                success: false,
                message: 'Sa oled juba kasutanud kiirendajat selle tööülesande jaoks!'
            };
        }

        // Find the booster item in inventory
        const inventory = stats.inventory || [];
        const boosterIndex = inventory.findIndex(item =>
            item.id === boosterItemId &&
            item.consumableEffect?.type === 'workTimeReduction'
        );

        if (boosterIndex === -1) {
            return {
                success: false,
                message: 'Boosterit ei leitud inventarist!'
            };
        }

        const boosterItem = inventory[boosterIndex];

        // Check if player has any items
        if (boosterItem.quantity < 1) {
            return {
                success: false,
                message: 'Sul pole seda boosterit!'
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
            endsAt: Timestamp.fromDate(finalEndTime),
            boosterUsed: true
        };

        // Update inventory - handle quantity properly
        const updatedInventory = [...inventory];
        if (boosterItem.quantity === 1) {
            // Remove item completely if this was the last one
            updatedInventory.splice(boosterIndex, 1);
        } else {
            // Reduce quantity by 1
            updatedInventory[boosterIndex] = {
                ...boosterItem,
                quantity: boosterItem.quantity - 1
            };
        }

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