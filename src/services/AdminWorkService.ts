// src/services/AdminWorkService.ts - VIP-aware version
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
import { getWorkActivityById, calculateWorkRewards } from '../data/workActivities';
import { calculateLevelFromExp } from './PlayerService';

/**
 * Complete all player work without triggering events (Admin only)
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

                // Calculate work completion rewards
                const workActivity = getWorkActivityById(stats.activeWork.workId);
                if (!workActivity) {
                    errors.push(`Work activity not found for user ${userId}`);
                    continue;
                }

                const actualRewards = calculateWorkRewards(
                    workActivity,
                    stats.activeWork.totalHours,
                    stats.rank
                );

                const newExp = stats.experience + actualRewards.experience;
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
                if (actualRewards.money > 0) {
                    updateData.money = (stats.money || 0) + actualRewards.money;
                }

                // Add to batch
                const statsRef = doc(firestore, 'playerStats', userId);
                workCompletionBatch.update(statsRef, updateData);

                // Add work history entry to batch
                const historyEntry = {
                    userId,
                    workId: stats.activeWork.workId,
                    workName: workActivity.name,
                    prefecture: stats.activeWork.prefecture,
                    department: stats.activeWork.department,
                    startedAt: stats.activeWork.startedAt,
                    completedAt: Timestamp.now(),
                    hoursWorked: stats.activeWork.totalHours,
                    expEarned: actualRewards.experience,
                    moneyEarned: actualRewards.money
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