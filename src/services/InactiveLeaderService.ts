// src/services/InactiveLeaderService.ts
import {
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    Timestamp
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';
import { DepartmentUnitService } from './DepartmentUnitService';

export interface InactiveLeader {
    userId: string;
    username: string;
    position: string;
    department: string;
    departmentUnit: string;
    lastSeen: Date;
    daysInactive: number;
}

/**
 * Check for inactive leaders (14+ days)
 */
export const detectInactiveLeaders = async (): Promise<InactiveLeader[]> => {
    const inactiveLeaders: InactiveLeader[] = [];
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Query for all players who are leaders
    const leadersQuery = query(
        collection(firestore, 'playerStats'),
        where('policePosition', 'in', [
            'grupijuht_patrol', 'grupijuht_investigation', 'grupijuht_emergency',
            'grupijuht_k9', 'grupijuht_cyber', 'grupijuht_crimes',
            'talituse_juht_patrol', 'talituse_juht_investigation',
            'talituse_juht_emergency', 'talituse_juht_k9',
            'talituse_juht_cyber', 'talituse_juht_crimes'
        ])
    );

    const snapshot = await getDocs(leadersQuery);

    for (const doc of snapshot.docs) {
        const stats = doc.data() as PlayerStats;

        // Check if lastSeen exists and convert it
        if (stats.lastSeen) {
            let lastSeenDate: Date;

            if (stats.lastSeen instanceof Timestamp) {
                lastSeenDate = stats.lastSeen.toDate();
            } else {
                lastSeenDate = new Date(stats.lastSeen);
            }

            // Check if inactive for 14+ days
            if (lastSeenDate < fourteenDaysAgo) {
                const daysInactive = Math.floor(
                    (Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                inactiveLeaders.push({
                    userId: doc.id,
                    username: stats.username || 'Tundmatu',
                    position: stats.policePosition || '',
                    department: stats.department || '',
                    departmentUnit: stats.departmentUnit || '',
                    lastSeen: lastSeenDate,
                    daysInactive
                });
            }
        }
    }

    return inactiveLeaders;
};

/**
 * Demote inactive leader to standard worker
 */
export const demoteInactiveLeader = async (
    userId: string,
    currentPosition: string,
    department: string,
    departmentUnit: string
): Promise<void> => {
    // Get the base worker position for the unit
    const basePosition = getBasePositionForUnit(departmentUnit);

    // Use DepartmentUnitService to handle the position change and cleanup
    await DepartmentUnitService.handlePositionChange(
        userId,
        basePosition,
        departmentUnit,
        department
    );

    // Add demotion tracking
    const statsRef = doc(firestore, 'playerStats', userId);
    await updateDoc(statsRef, {
        previousPosition: currentPosition,
        demotedAt: Timestamp.now(),
        demotionReason: 'Mitteaktiivsus (14+ päeva)'
    });
};

/**
 * Get base worker position for a unit
 */
const getBasePositionForUnit = (unitId: string): string => {
    switch(unitId) {
        case 'patrol': return 'patrullpolitseinik';
        case 'investigation': return 'uurija';
        case 'emergency': return 'kiirreageerija';
        case 'k9': return 'koerajuht';
        case 'cyber': return 'küberkriminalist';
        case 'crimes': return 'jälitaja';
        default: return 'patrullpolitseinik';
    }
};