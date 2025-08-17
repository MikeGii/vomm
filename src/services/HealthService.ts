// src/services/HealthService.ts
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';

const HEALTH_RECOVERY_RATE = 5; // HP per hour

// Check and apply health recovery based on time passed
export const checkAndApplyHealthRecovery = async (userId: string): Promise<void> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) return;

    const stats = statsDoc.data() as PlayerStats;

    if (!stats.health) return;

    // Skip if already at max health
    if (stats.health.current >= stats.health.max) {
        return;
    }

    // If no lastHealthUpdate exists, set it now and return
    if (!stats.lastHealthUpdate) {
        await updateDoc(statsRef, {
            lastHealthUpdate: Timestamp.now()
        });
        return;
    }

    // Convert to Date
    let lastUpdateDate: Date;
    if (stats.lastHealthUpdate instanceof Timestamp) {
        lastUpdateDate = stats.lastHealthUpdate.toDate();
    } else if (stats.lastHealthUpdate && typeof stats.lastHealthUpdate === 'object' && 'seconds' in stats.lastHealthUpdate) {
        lastUpdateDate = new Date((stats.lastHealthUpdate as any).seconds * 1000);
    } else {
        lastUpdateDate = new Date(stats.lastHealthUpdate);
    }

    // Calculate time difference in hours
    const now = new Date();
    const timeDiffMs = now.getTime() - lastUpdateDate.getTime();
    const hoursElapsed = timeDiffMs / (1000 * 60 * 60);

    // Calculate recovery (5 HP per hour)
    const recoveryAmount = Math.floor(hoursElapsed * HEALTH_RECOVERY_RATE);

    // Only update if there's actual recovery
    if (recoveryAmount > 0) {
        const newHealth = Math.min(stats.health.current + recoveryAmount, stats.health.max);

        await updateDoc(statsRef, {
            'health.current': newHealth,
            lastHealthUpdate: Timestamp.now()
        });
    }
};