// src/services/AdminWorkService.ts
import {
    collection,
    getDocs,
    deleteDoc,
    query,
    where,
    writeBatch,
    doc,
    Timestamp
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';
import { calculateLevelFromExp } from './PlayerService';

/**
 * Complete all player work without triggering events (Admin only)
 * Updated for new position-based work system
 */
export const completeAllPlayersWorkAdmin = async (): Promise<{
    completedCount: number;
    eventsCleanedCount: number;
    errors: string[];
}> => {
    const playerStatsCollection = collection(firestore, 'playerStats');
    const snapshot = await getDocs(playerStatsCollection);

    let completedCount = 0;
    let eventsCleanedCount = 0;
    const errors: string[] = [];

    // Use batch operations for better performance
    const workCompletionBatch = writeBatch(firestore);
    const activeEventDeletions: Promise<void>[] = [];

    for (const docSnapshot of snapshot.docs) {
        const stats = docSnapshot.data() as PlayerStats;

        if (stats.activeWork) {
            try {
                const userId = docSnapshot.id;

                // Clean up any pending events first
                const eventsQuery = query(
                    collection(firestore, 'activeEvents'),
                    where('userId', '==', userId)
                );

                const eventsSnapshot = await getDocs(eventsQuery);

                // Delete all pending events for this player
                for (const eventDoc of eventsSnapshot.docs) {
                    activeEventDeletions.push(
                        deleteDoc(doc(firestore, 'activeEvents', eventDoc.id))
                    );
                    eventsCleanedCount++;
                }

                // Use expected rewards from activeWork (already calculated when work started)
                const expReward = stats.activeWork.expectedExp || 0;
                const moneyReward = stats.activeWork.expectedMoney || 0;

                const newExp = stats.experience + expReward;
                const newLevel = calculateLevelFromExp(newExp);
                const newTotalWorkedHours = (stats.totalWorkedHours || 0) + stats.activeWork.totalHours;

                // VIP LOGIC: Determine non-working clicks based on VIP status
                const nonWorkingClicks = stats.isVip ? 100 : 50;

                // Prepare work completion update
                const updateData: any = {
                    activeWork: null,
                    experience: newExp,
                    level: newLevel,
                    totalWorkedHours: newTotalWorkedHours,
                    'trainingData.isWorking': false,
                    'trainingData.remainingClicks': nonWorkingClicks,
                    'kitchenLabTrainingData.remainingClicks': nonWorkingClicks,
                    'handicraftTrainingData.remainingClicks': nonWorkingClicks
                };

                // Add money if there's a reward
                if (moneyReward > 0) {
                    updateData.money = (stats.money || 0) + moneyReward;
                }

                // Add to batch
                const statsRef = doc(firestore, 'playerStats', userId);
                workCompletionBatch.update(statsRef, updateData);

                // Add work history entry to batch
                const historyEntry = {
                    userId,
                    workId: stats.activeWork.workId,
                    workName: `Töö lõpetatud (${stats.activeWork.workId})`, // Generic name since we don't look up activity
                    prefecture: stats.activeWork.prefecture,
                    department: stats.activeWork.department,
                    startedAt: stats.activeWork.startedAt,
                    completedAt: Timestamp.now(),
                    hoursWorked: stats.activeWork.totalHours,
                    expEarned: expReward,
                    moneyEarned: moneyReward
                };

                const historyRef = doc(collection(firestore, 'workHistory'));
                workCompletionBatch.set(historyRef, historyEntry);

                completedCount++;

            } catch (error) {
                console.error(`Failed to complete work for ${docSnapshot.id}:`, error);
                errors.push(`Failed to complete work for user ${docSnapshot.id}: ${error}`);
            }
        }
    }

    // Execute all operations
    try {
        // Delete events first
        await Promise.all(activeEventDeletions);

        // Then complete all work
        if (completedCount > 0) {
            await workCompletionBatch.commit();
        }
    } catch (error) {
        errors.push(`Batch operation failed: ${error}`);
    }

    return { completedCount, eventsCleanedCount, errors };
};