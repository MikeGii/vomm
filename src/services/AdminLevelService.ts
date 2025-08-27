// src/services/AdminLevelService.ts
import {
    collection,
    getDocs,
    writeBatch,
    doc
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';

// New 9% constant growth calculation
export const calculateExpForLevel = (level: number): number => {
    if (level <= 1) return 0;

    const baseExp = 100;
    let totalExp = 0;
    let currentLevelExp = baseExp;

    for (let i = 2; i <= level; i++) {
        totalExp += Math.floor(currentLevelExp);
        currentLevelExp = currentLevelExp * 1.09;
    }

    return totalExp;
};

export const calculateLevelFromExp = (totalExp: number): number => {
    let level = 1;
    while (calculateExpForLevel(level + 1) <= totalExp) {
        level++;
    }
    return level;
};

export const recalculateAllPlayerLevels = async (): Promise<{
    success: boolean;
    processedCount: number;
    updatedCount: number;
    errors: string[];
}> => {
    const playerStatsCollection = collection(firestore, 'playerStats');
    const snapshot = await getDocs(playerStatsCollection);

    let processedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Use batch operations for better performance (max 500 per batch)
    const batches: any[] = [];
    let currentBatch = writeBatch(firestore);
    let batchOperationCount = 0;

    for (const docSnapshot of snapshot.docs) {
        try {
            processedCount++;
            const stats = docSnapshot.data() as PlayerStats;
            const currentLevel = stats.level || 1;
            const totalExp = stats.experience || 0;

            // Calculate what level should be based on current XP
            const correctLevel = calculateLevelFromExp(totalExp);

            // Only update if level is different
            if (currentLevel !== correctLevel) {
                const playerRef = doc(firestore, 'playerStats', docSnapshot.id);
                currentBatch.update(playerRef, {
                    level: correctLevel
                });

                batchOperationCount++;
                updatedCount++;

                console.log(`Player ${stats.username || docSnapshot.id}: ${currentLevel} → ${correctLevel} (${totalExp} XP)`);
            }

            // Firestore batch limit is 500 operations
            if (batchOperationCount >= 500) {
                batches.push(currentBatch);
                currentBatch = writeBatch(firestore);
                batchOperationCount = 0;
            }

        } catch (error) {
            errors.push(`Error processing player ${docSnapshot.id}: ${error}`);
            console.error(`Error processing player ${docSnapshot.id}:`, error);
        }
    }

    // Add the final batch if it has operations
    if (batchOperationCount > 0) {
        batches.push(currentBatch);
    }

    // Execute all batches
    try {
        for (let i = 0; i < batches.length; i++) {
            await batches[i].commit();
            console.log(`Committed batch ${i + 1}/${batches.length}`);
        }
    } catch (error) {
        errors.push(`Error committing batches: ${error}`);
        return {
            success: false,
            processedCount,
            updatedCount,
            errors
        };
    }

    return {
        success: true,
        processedCount,
        updatedCount,
        errors
    };
};