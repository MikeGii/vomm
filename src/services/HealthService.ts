// src/services/HealthService.ts
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';
import { getCurrentServer, getServerSpecificId } from '../utils/serverUtils';

const HEALTH_RECOVERY_RATE = 5; // HP per hour
const RECOVERY_INTERVAL_MS = 60 * 60 * 1000; // 1 hour in milliseconds

// Check and apply health recovery based on time passed (works offline)
export const checkAndApplyHealthRecovery = async (userId: string): Promise<{
    recovered: boolean;
    amountRecovered: number;
}> => {
    const serverSpecificId = getServerSpecificId(userId, getCurrentServer());
    const statsRef = doc(firestore, 'playerStats', serverSpecificId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) return { recovered: false, amountRecovered: 0 };

    const stats = statsDoc.data() as PlayerStats;

    if (!stats.health) return { recovered: false, amountRecovered: 0 };

    // Skip if already at max health
    if (stats.health.current >= stats.health.max) {
        // Clear lastHealthUpdate if at max health
        if (stats.lastHealthUpdate) {
            await updateDoc(statsRef, {
                lastHealthUpdate: null
            });
        }
        return { recovered: false, amountRecovered: 0 };
    }

    const now = new Date();

    // If health is not max and no lastHealthUpdate, start recovery now
    if (!stats.lastHealthUpdate) {
        await updateDoc(statsRef, {
            lastHealthUpdate: Timestamp.now()
        });
        return { recovered: false, amountRecovered: 0 };
    }

    // Convert lastHealthUpdate to Date
    let lastUpdateDate: Date;
    if (stats.lastHealthUpdate instanceof Timestamp) {
        lastUpdateDate = stats.lastHealthUpdate.toDate();
    } else if (stats.lastHealthUpdate && typeof stats.lastHealthUpdate === 'object' && 'seconds' in stats.lastHealthUpdate) {
        lastUpdateDate = new Date((stats.lastHealthUpdate as any).seconds * 1000);
    } else {
        lastUpdateDate = new Date(stats.lastHealthUpdate);
    }

    // Calculate time difference
    const timeDiffMs = now.getTime() - lastUpdateDate.getTime();
    const hoursElapsed = Math.floor(timeDiffMs / RECOVERY_INTERVAL_MS);

    // Calculate recovery (5 HP per complete hour)
    if (hoursElapsed > 0) {
        const recoveryAmount = hoursElapsed * HEALTH_RECOVERY_RATE;
        const actualRecovery = Math.min(recoveryAmount, stats.health.max - stats.health.current);
        const newHealth = Math.min(stats.health.current + recoveryAmount, stats.health.max);

        // Update health and reset timer to the last full hour
        const newLastUpdate = new Date(lastUpdateDate.getTime() + (hoursElapsed * RECOVERY_INTERVAL_MS));

        await updateDoc(statsRef, {
            'health.current': newHealth,
            lastHealthUpdate: newHealth >= stats.health.max ? null : Timestamp.fromDate(newLastUpdate)
        });

        return { recovered: true, amountRecovered: actualRecovery };
    }

    return { recovered: false, amountRecovered: 0 };
};