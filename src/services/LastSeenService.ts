// src/services/LastSeenService.ts
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { getCurrentServer, getServerSpecificId } from '../utils/serverUtils';

/**
 * Uuenda mängija viimast nägemist
 * @param userId - Mängija ID
 */
export const updateLastSeen = async (userId: string): Promise<void> => {
    try {
        const serverSpecificId = getServerSpecificId(userId, getCurrentServer());
        const statsRef = doc(firestore, 'playerStats', serverSpecificId);
        await updateDoc(statsRef, {
            lastSeen: Timestamp.now()
        });
    } catch (error) {
        console.error('Viga lastSeen uuendamisel:', error);
        // Ei viska viga, et mitte häirida peamist funktsionaalsust
    }
};

/**
 * Laiska uuendamine - uuenda ainult kui viimane uuendus oli üle 5 minuti tagasi
 * @param userId - Mängija ID
 * @param lastSeenTimestamp - Viimane nägemise aeg (valikuline)
 */
export const updateLastSeenIfNeeded = async (
    userId: string,
    lastSeenTimestamp?: Timestamp
): Promise<void> => {
    try {
        const now = new Date();

        // Kui lastSeen puudub või on vanem kui 5 minutit, siis uuenda
        if (!lastSeenTimestamp ||
            (now.getTime() - lastSeenTimestamp.toDate().getTime()) > 5 * 60 * 1000) {
            await updateLastSeen(userId);
        }
    } catch (error) {
        console.error('Viga lastSeen laiska uuendamisel:', error);
    }
};