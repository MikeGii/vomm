// src/services/CourseBoosterService.ts
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats, InventoryItem } from '../types';

export interface CourseBoosterResult {
    success: boolean;
    message: string;
    newEndTime?: Date;
}

/**
 * Apply course time booster to active course
 */
export const applyCourseTimeBooster = async (
    userId: string,
    boosterItemId: string
): Promise<CourseBoosterResult> => {
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

        // Check if player has active course
        if (!stats.activeCourse || stats.activeCourse.status !== 'in_progress') {
            return {
                success: false,
                message: 'Sul pole aktiivset kursust!'
            };
        }

        // Find the booster item in inventory
        const inventory = stats.inventory || [];
        const boosterItem = inventory.find(item =>
            item.id === boosterItemId &&
            item.consumableEffect?.type === 'courseTimeReduction'
        );

        if (!boosterItem) {
            return {
                success: false,
                message: 'Boosterit ei leitud inventarist!'
            };
        }

        // Calculate new end time
        const currentEndTime = stats.activeCourse.endsAt instanceof Timestamp
            ? stats.activeCourse.endsAt.toDate()
            : new Date(stats.activeCourse.endsAt);

        const currentStartTime = stats.activeCourse.startedAt instanceof Timestamp
            ? stats.activeCourse.startedAt.toDate()
            : new Date(stats.activeCourse.startedAt);

        const totalCourseDuration = currentEndTime.getTime() - currentStartTime.getTime();
        const reductionPercentage = boosterItem.consumableEffect!.value / 100;
        const timeReduction = totalCourseDuration * reductionPercentage;

        const newEndTime = new Date(currentEndTime.getTime() - timeReduction);
        const now = new Date();

        // If new end time is in the past, set it to current time + 1 minute
        const finalEndTime = newEndTime <= now ? new Date(now.getTime() + 60000) : newEndTime;

        // Update active course end time
        const updatedActiveCourse = {
            ...stats.activeCourse,
            endsAt: Timestamp.fromDate(finalEndTime)
        };

        // Remove the booster from inventory
        const updatedInventory = inventory.filter(item => item.id !== boosterItemId);

        // Update player stats
        await updateDoc(statsRef, {
            activeCourse: updatedActiveCourse,
            inventory: updatedInventory
        });

        const timeSavedHours = Math.floor(timeReduction / (1000 * 60 * 60));
        const timeSavedMinutes = Math.floor((timeReduction % (1000 * 60 * 60)) / (1000 * 60));

        return {
            success: true,
            message: `Kursuse booster rakendatud! Säästetud aeg: ${timeSavedHours}h ${timeSavedMinutes}min`,
            newEndTime: finalEndTime
        };

    } catch (error) {
        console.error('Error applying course booster:', error);
        return {
            success: false,
            message: 'Viga boosteri rakendamisel'
        };
    }
};

/**
 * Get course time boosters from inventory
 */
export const getCourseTimeBoosters = (inventory: InventoryItem[]): InventoryItem[] => {
    return inventory.filter(item =>
        item.consumableEffect?.type === 'courseTimeReduction'
    );
};